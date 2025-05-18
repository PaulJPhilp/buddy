import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3002
    },
    resolve: {
        alias: {
            '@buddy/ui': path.resolve(__dirname, '../../packages/ui/src'),
            'effect/Effect': path.resolve(__dirname, '../../node_modules/effect/dist/Effect/index.js')
        }
    }
});
