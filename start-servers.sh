#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Buddy Chat Application${NC}"

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    pkill -f "node.*index.ts" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Kill any existing processes
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
pkill -f "node.*index.ts" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start the LLM server
echo -e "${GREEN}🤖 Starting LLM Server on port 8080...${NC}"
cd llm-agent
npm run start &
LLM_PID=$!
cd ..

# Wait a moment for LLM server to start
sleep 3

# Start the client
echo -e "${GREEN}🌐 Starting Client on port 3000...${NC}"
cd apps/client
bun run dev &
CLIENT_PID=$!
cd ../..

echo -e "${GREEN}✅ Both servers started!${NC}"
echo -e "${YELLOW}📱 Client: http://localhost:3000${NC}"
echo -e "${YELLOW}🤖 LLM Server: ws://localhost:8080${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Wait for background processes
wait 