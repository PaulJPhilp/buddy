import { join } from 'node:path'
import type { AcceptedPlugin, ProcessOptions } from 'postcss'

interface PostCSSConfig {
  plugins: Record<string, AcceptedPlugin | { [key: string]: any }>
  options?: ProcessOptions
}

const config: PostCSSConfig = {
  plugins: {
    "@tailwindcss/postcss": {
      base: join(__dirname, "../../"),
    },
  },
}

export default config
