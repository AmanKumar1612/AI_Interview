/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                // ── Primary: Orange ──────────────────────────────────
                primary: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#ea580c',
                    700: '#c2410c',
                },
                // ── Accent 1: Red ─────────────────────────────────────
                danger: {
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                },
                // ── Accent 2: Yellow/Amber ────────────────────────────
                warm: {
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                },
                // ── Accent 3: Teal / Blue-green ───────────────────────
                cool: {
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                },
                // ── Surface (dark backgrounds) ────────────────────────
                surface: {
                    900: '#0c0a00',
                    850: '#120f04',
                    800: '#1a1508',
                    700: '#2c2410',
                    600: '#3d3318',
                    500: '#52451f',
                },
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow-orange': 'glowOrange 2s ease-in-out infinite alternate',
                'shimmer': 'shimmer 1.5s linear infinite',
            },
            keyframes: {
                float: {
                    '0%,100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                glowOrange: {
                    '0%': { boxShadow: '0 0 8px #f97316, 0 0 20px #f97316' },
                    '100%': { boxShadow: '0 0 25px #ea580c, 0 0 50px #14b8a6' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-fire': 'linear-gradient(135deg, #f97316, #ef4444)',
                'gradient-sunset': 'linear-gradient(135deg, #fbbf24, #f97316, #ef4444)',
                'gradient-ocean': 'linear-gradient(135deg, #14b8a6, #0ea5e9)',
            },
        },
    },
    plugins: [],
}
