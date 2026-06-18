import type { Metadata } from 'next'
import { AppShell } from '@/components/layout'
import { TransactionsShell } from '@/features/transactions/TransactionsShell'
import { RecordTransactionButton } from '@/features/transactions/RecordTransactionButton'

export const metadata: Metadata = {
  title: 'Transactions',
}

export default function TransactionsPage() {
  return (
    <AppShell
      title="Transactions"
      subtitle="Full ledger history"
      topbarActions={<RecordTransactionButton label="Record" />}
    >
      <TransactionsShell />
    </AppShell>
  )
}
