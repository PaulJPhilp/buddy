import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '.env') });

// Check required environment variables
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const PORT = process.env.PORT || 8080;

if (!GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('Missing GOOGLE_GENERATIVE_AI_API_KEY in .env file');
    process.exit(1);
}

// Start server
console.log(`Starting LLM server on port ${PORT}...`);

try {
    const { default: server } = await import('./index.js');

    // Handle graceful shutdown
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const;
    for (const signal of signals) {
        process.on(signal, () => {
            console.log(`\nReceived ${signal}, shutting down...`);
            process.exit(0);
        });
    }

    console.log('LLM Server ready for connections');
} catch (error) {
    console.error('Failed to start LLM server:', error);
    process.exit(1);
} 