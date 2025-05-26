import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';
import WebSocket, { WebSocketServer } from 'ws';

// Load environment variables from .env file
config();

const PORT = process.env.PORT || 8080;
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!GOOGLE_GENERATIVE_AI_API_KEY) {
  console.error('Missing GOOGLE_GENERATIVE_AI_API_KEY in .env file. Please set it.');
  process.exit(1);
}

// We don't directly need genAI instance if using the Vercel SDK's google adapter for streamText
// const genAI = new GoogleGenerativeAI(GOOGLE_GENERATIVE_AI_API_KEY);

const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`Mock Agent WebSocket server started on port ${PORT}`);

// Define the callLLM function
async function callLLM(inputText: string, ws: WebSocket) {
  console.log(`Calling LLM with input: "${inputText}"`);
  try {
    const { text, usage, finishReason, toolCalls, toolResults } = await generateText({
      model: google('models/gemini-1.5-flash-latest'),
      prompt: inputText,
    });

    console.log('LLM API Usage:', usage);
    console.log('LLM Finish Reason:', finishReason);
    if (toolCalls) console.log('LLM Tool Calls:', toolCalls);
    if (toolResults) console.log('LLM Tool Results:', toolResults);

    console.log('LLM Full Response (from generateText):', text);
    ws.send(JSON.stringify({ type: 'llm_response', content: text, finishReason: finishReason }));

  } catch (error: any) {
    console.error('Error calling LLM:');
    console.error('Error Message:', error.message);
    if (error.stack) {
      console.error('Error Stack:', error.stack);
    }
    if (error.cause) {
      console.error('Error Cause:', error.cause);
    }
    if (error.response?.data) {
      console.error('Detailed API Error Response:', error.response.data);
    }
    ws.send(JSON.stringify({ type: 'error', message: 'LLM call failed', details: error.message }));
  }
}

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    let parsedMessage: any;
    try {
      const messageString = message.toString();
      parsedMessage = JSON.parse(messageString);
      console.log('Received message from client:', parsedMessage);

      // Acknowledge receipt before making the LLM call
      ws.send(JSON.stringify({ type: 'ack', originalMessage: parsedMessage, status: 'Received, calling LLM...' }));

    } catch (error) {
      console.error('Failed to parse message or send ack:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      return;
    }

    // Call LLM if the message contains text
    if (parsedMessage && typeof parsedMessage.text === 'string' && parsedMessage.text.trim() !== '') {
      await callLLM(parsedMessage.text, ws);
    } else {
      // Optionally handle messages that are not meant for the LLM or lack text
      console.log('Message does not contain text or is not structured for LLM call:', parsedMessage);
      // ws.send(JSON.stringify({ type: 'info', message: 'Message not processed by LLM. No text found.' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log('Mock Agent Server setup complete. Ready for connections.');