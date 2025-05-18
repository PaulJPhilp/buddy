import { dirname } from 'node:path';
import { fileURLToPath } from 'url';
// filepath: /Users/paul/Projects/buddy/packages/ui/tailwind.config.ts
import type { Config } from 'tailwindcss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
        },
    },
    plugins: {

        '@tailwindcss/typography': {},
        '@tailwindcss/forms': {},
    },
} as const;
