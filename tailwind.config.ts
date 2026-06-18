import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base surfaces
        void: '#0A0B0F',
        surface: {
          DEFAULT: '#111318',
          raised: '#161922',
          elevated: '#1C2333',
          overlay: '#232B3E',
        },
        // Borders
        border: {
          DEFAULT: '#1E2535',
          subtle: '#161C29',
          strong: '#2A3550',
        },
        // Accent system
        signal: {
          DEFAULT: '#3B82F6',
          dim: '#1D4ED8',
          glow: 'rgba(59,130,246,0.15)',
        },
        gain: {
          DEFAULT: '#10B981',
          dim: '#065F46',
          glow: 'rgba(16,185,129,0.15)',
        },
        loss: {
          DEFAULT: '#EF4444',
          dim: '#7F1D1D',
          glow: 'rgba(239,68,68,0.15)',
        },
        violet: {
          DEFAULT: '#8B5CF6',
          dim: '#4C1D95',
          glow: 'rgba(139,92,246,0.15)',
        },
        amber: {
          DEFAULT: '#F59E0B',
          dim: '#78350F',
        },
        // Text
        ink: {
          DEFAULT: '#E2E8F0',
          muted: '#94A3B8',
          faint: '#475569',
          inverse: '#0A0B0F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'data-xs': ['0.65rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
        'data-sm': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
        'data-base': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.02em' }],
        'data-lg': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.01em' }],
        'data-xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0em' }],
        'data-2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        'data-3xl': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        'data-4xl': ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.03em' }],
      },
      boxShadow: {
        'glass': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        'glass-lg': '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        'signal': '0 0 20px rgba(59,130,246,0.2), 0 0 60px rgba(59,130,246,0.05)',
        'gain': '0 0 20px rgba(16,185,129,0.2)',
        'loss': '0 0 20px rgba(239,68,68,0.2)',
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        'glass-hover': 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
        'signal-gradient': 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231E2535' fill-opacity='0.4'%3E%3Cpath d='M0 0h1v40H0zm40 0h1v40h-1zM0 0v1h40V0zm0 40v1h40v-1z'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      backdropBlur: {
        'glass': '12px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      spacing: {
        'sidebar': '240px',
        'topbar': '60px',
      },
    },
  },
  plugins: [],
}

export default config
