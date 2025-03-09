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
  }
})
