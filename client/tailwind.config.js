/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#080A0F',
          secondary: '#0C0F15',
        },
        surface: {
          DEFAULT: '#11151D',
          elevated: '#151A23',
          hover: '#1B212D',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          subtle: 'rgba(255, 255, 255, 0.05)',
          purple: 'rgba(139, 92, 246, 0.15)',
        },
        primary: {
          DEFAULT: '#6366F1',
          hover: '#7C3AED',
          accent: '#8B5CF6',
          bright: '#A5B4FC',
        },
        cyan: {
          DEFAULT: '#22D3EE',
          glow: 'rgba(34, 211, 238, 0.22)',
        },
        text: {
          DEFAULT: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#38BDF8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        'elevated': '0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3)',
        'modal': '0 20px 40px -8px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'glow-primary': '0 0 25px rgba(99, 102, 241, 0.25), 0 0 60px rgba(99, 102, 241, 0.08)',
        'glow-subtle': '0 0 30px rgba(99, 102, 241, 0.12)',
        'glow-card': '0 0 50px rgba(99, 102, 241, 0.08)',
        'glow-editor': '0 0 40px rgba(99, 102, 241, 0.10)',
        'glow-button': '0 0 25px rgba(99, 102, 241, 0.30)',
        'glow-status': '0 0 8px rgba(16, 185, 129, 0.8)',
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.22)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
