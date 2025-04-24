import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    root: 'demo',
    build: {
        outDir: '../dist',
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'BuddyUI',
            fileName: (format) => `index.${format}.js`,
        },
        rollupOptions: {
            external: ['react', 'react-dom'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                },
            },
        },
    },
    server: {
        port: 3002,
        watch: {
            usePolling: true,
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@components': resolve(__dirname, 'src/components'),
            '@lib': resolve(__dirname, 'src/lib'),
        },
    },
}) 