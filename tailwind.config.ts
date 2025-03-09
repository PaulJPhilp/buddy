import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './apps/**/*.{js,ts,jsx,tsx,mdx}',
        './packages/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        fontFamily: {
            sans: ['geist'],
            mono: ['geist-mono'],
        },
        extend: {
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
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
                chart: {
                    '1': 'hsl(var(--chart-1) / <alpha>)',
                    '2': 'hsl(var(--chart-2) / <alpha>)',
                    '3': 'hsl(var(--chart-3) / <alpha>)',
                    '4': 'hsl(var(--chart-4) / <alpha>)',
                    '5': 'hsl(var(--chart-5) / <alpha>)',
                },
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background) / <alpha>)',
                    foreground: 'hsl(var(--sidebar-foreground) / <alpha>)',
                    primary: 'hsl(var(--sidebar-primary) / <alpha>)',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground) / <alpha>)',
                    accent: 'hsl(var(--sidebar-accent) / <alpha>)',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground) / <alpha>)',
                    border: 'hsl(var(--sidebar-border) / <alpha>)',
                    ring: 'hsl(var(--sidebar-ring) / <alpha>)',
                },
            },
        },
    },
    plugins: [
        require('tailwindcss-animate'),
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
    ],
} as const

export default config 