/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#38bdf8',
          hover: '#67e8f9',
          glow: 'rgba(56, 189, 248, 0.35)',
        },
        'text-muted': '#475569',
        'bg-deep': '#f5fbff',
        'bg-surface': 'rgba(255, 255, 255, 0.92)',
        'bg-elevated': 'rgba(248, 253, 255, 0.96)',
        border: 'rgba(14, 116, 144, 0.22)',
        'border-focus': '#38bdf8',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        card: '0 12px 28px rgba(14, 116, 144, 0.16)',
        chat: '0 8px 20px rgba(14, 116, 144, 0.14)',
      },
    },
  },
  plugins: [],
};
