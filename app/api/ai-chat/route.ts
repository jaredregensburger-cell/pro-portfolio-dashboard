import { NextRequest } from 'next/server'
import type { PortfolioContext } from '@/components/ai-chat/useChat'

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt(ctx?: PortfolioContext): string {
  const base = `You are Folio AI, a friendly portfolio coach embedded in an investment dashboard.

PERSONALITY:
- Speak like a smart, calm friend who knows finance — not a bank robot.
- Use simple, clear language. No jargon unless the user introduces it.
- Be concise. 2–4 sentences per answer is usually enough.
- If you don't know something, say so honestly.

RULES:
- Never give specific buy/sell advice or price targets.
- You CAN explain what the numbers mean, point out what's performing well/badly, and describe risk.
- Always respond in the same language the user writes in (German or English).
- Never make up portfolio data — only use the context provided.`

  if (!ctx || ctx.positions.length === 0) {
    return `${base}

PORTFOLIO STATUS: No portfolio data available. Tell the user to add some assets first if they ask about their portfolio.`
  }

  const totalGainSign  = ctx.unrealizedPnL >= 0 ? '+' : ''
  const totalGainEmoji = ctx.unrealizedPnL >= 0 ? '📈' : '📉'

  const positionLines = ctx.positions
    .sort((a, b) => b.currentValue - a.currentValue)
    .map((p) => {
      const gainSign = p.unrealizedGainPct >= 0 ? '+' : ''
      return `  • ${p.name} (${p.ticker}): $${p.currentValue.toFixed(0)} | P&L ${gainSign}${p.unrealizedGainPct.toFixed(1)}% (${gainSign}$${p.unrealizedGain.toFixed(0)})`
    })
    .join('\n')

  const best  = [...ctx.positions].sort((a, b) => b.unrealizedGainPct - a.unrealizedGainPct)[0]
  const worst = [...ctx.positions].sort((a, b) => a.unrealizedGainPct - b.unrealizedGainPct)[0]

  return `${base}

LIVE PORTFOLIO SNAPSHOT ${totalGainEmoji}:
  Total Value:    $${ctx.totalValue.toFixed(2)}
  Total Cost:     $${ctx.totalCost.toFixed(2)}
  Unrealized P&L: ${totalGainSign}$${ctx.unrealizedPnL.toFixed(2)} (${totalGainSign}${ctx.unrealizedPct.toFixed(2)}%)
  Realized P&L:   $${ctx.realizedPnL.toFixed(2)}
  Currency:       ${ctx.currency}

POSITIONS (${ctx.positions.length} open):
${positionLines}

TOP WINNER:  ${best?.name ?? '–'} (${best ? (best.unrealizedGainPct >= 0 ? '+' : '') + best.unrealizedGainPct.toFixed(1) + '%' : '–'})
TOP LOSER:   ${worst?.name ?? '–'} (${worst ? (worst.unrealizedGainPct >= 0 ? '+' : '') + worst.unrealizedGainPct.toFixed(1) + '%' : '–'})

Use this data to answer questions. When the user asks why something is up/down, refer to specific positions.`
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { messages, portfolioContext } = (await req.json()) as {
      messages:         Array<{ role: 'user' | 'assistant'; content: string }>
      portfolioContext?: PortfolioContext
    }

    if (!messages?.length) {
      return Response.json({ error: 'No messages provided' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY is not configured. Add it to your .env.local file.' },
        { status: 500 }
      )
    }

    const systemPrompt = buildSystemPrompt(portfolioContext)

    // ── Call Claude API (streaming) ──────────────────────────────────────────
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta':    'messages-2023-12-15',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001', // fast + cheap for chat
        max_tokens: 512,
        system:     systemPrompt,
        stream:     true,
        messages:   messages.slice(-20), // keep last 20 turns for context window
      }),
    })

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}))
      return Response.json(
        { error: err?.error?.message ?? `Claude API error ${upstream.status}` },
        { status: upstream.status }
      )
    }

    // ── Transform Anthropic SSE → OpenAI-compatible SSE for the client hook ─
    // The client already speaks OpenAI SSE format (choices[0].delta.content),
    // so we translate Anthropic's event format on the fly.
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader  = upstream.body!.getReader()
        const decoder = new TextDecoder()
        let   buffer  = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const raw = line.slice(6).trim()
              if (!raw || raw === '[DONE]') continue

              try {
                const event = JSON.parse(raw)

                // Anthropic streams: content_block_delta with text delta
                if (
                  event.type === 'content_block_delta' &&
                  event.delta?.type === 'text_delta'
                ) {
                  const chunk = JSON.stringify({
                    choices: [{ delta: { content: event.delta.text } }],
                  })
                  controller.enqueue(encoder.encode(`data: ${chunk}\n\n`))
                }

                // Stream done
                if (event.type === 'message_stop') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  controller.close()
                  return
                }
              } catch {
                // skip malformed
              }
            }
          }
        } catch (err) {
          controller.error(err)
        } finally {
          reader.cancel()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
