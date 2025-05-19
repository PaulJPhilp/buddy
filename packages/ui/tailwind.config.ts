// filepath: /Users/paul/Projects/buddy/packages/ui/tailwind.config.ts

export default {
    content: [
        './src/**/*.{js,jsx,ts,tsx}',
        './src/components/**/*.{js,jsx,ts,tsx}',

    ],
    darkMode: 'class',
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            spacing: {
                'xxs': '0.125rem', // 2px
                'xs': '0.25rem',   // 4px
                'sm': '0.5rem',    // 8px
                'md': '0.75rem',   // 12px
                'lg': '1rem',      // 16px
            },
            fontSize: {
                'xxs': ['0.625rem', { lineHeight: '1rem' }], // 10px
                'xs': ['0.75rem', { lineHeight: '1rem' }],   // 12px
                'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
                'md': ['1rem', { lineHeight: '1.5rem' }],    // 16px
            },
            borderRadius: {
                'xxs': '1px',
                'xs': '2px',
                'sm': 'calc(var(--radius) - 4px)',
                'md': 'calc(var(--radius) - 2px)',
                'lg': 'var(--radius)',
            },
            colors: {
                border: 'hsl(var(--border) / <alpha>)',
                input: 'hsl(var(--input) / <alpha>)',
                ring: 'hsl(var(--ring) / <alpha>)',
                background: 'hsl(var(--background) / <alpha>)',
                foreground: 'hsl(var(--foreground) / <alpha>)',
                primary: {
                    DEFAULT: 'hsl(var(--primary) / <alpha>)',
                    foreground: 'hsl(var(--primary-foreground) / <alpha>)',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary) / <alpha>)',
                    foreground: 'hsl(var(--secondary-foreground) / <alpha>)',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive) / <alpha>)',
                    foreground: 'hsl(var(--destructive-foreground) / <alpha>)',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted) / <alpha>)',
                    foreground: 'hsl(var(--muted-foreground) / <alpha>)',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent) / <alpha>)',
                    foreground: 'hsl(var(--accent-foreground) / <alpha>)',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover) / <alpha>)',
                    foreground: 'hsl(var(--popover-foreground) / <alpha>)',
                },
                card: {
                    DEFAULT: 'hsl(var(--card) / <alpha>)',
                    foreground: 'hsl(var(--card-foreground) / <alpha>)',
                },
            }

        },
    },
    plugins: [
        import('tailwindcss-animate'),
        import('@tailwindcss/typography'),
        import('@tailwindcss/forms')
    ],
} as const;
