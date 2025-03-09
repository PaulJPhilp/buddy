import sharedConfig from '@buddy/ui/tailwind.config'
import type { Config } from 'tailwindcss'

const config: Config = {
    presets: [sharedConfig],
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
        '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
}

export default config 