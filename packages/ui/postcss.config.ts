import type { AcceptedPlugin, ProcessOptions } from 'postcss'

interface PostCSSConfig {
  plugins: Record<string, AcceptedPlugin | { [key: string]: any }>
  options?: ProcessOptions
}

const config: PostCSSConfig = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}

export default config
