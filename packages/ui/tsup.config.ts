import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: false,
  clean: true,
  external: ["react"],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    }
    options.target = "es2020"
  },
  onSuccess: "tsc --emitDeclarationOnly --declaration",
  loader: {
    ".css": "copy"
  },
  watch: true,
  env: {
    NODE_OPTIONS: '--max-old-space-size=4096',
  },
  silent: false,
  minify: false,
  sourcemap: true
})
