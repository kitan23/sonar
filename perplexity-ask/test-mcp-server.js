#!/usr/bin/env node

// Test script for MCP Server with SSE transport
// This script demonstrates how to properly communicate with the MCP server

const EventSource = require('eventsource');

const SERVER_URL = 'http://localhost:8080/sse';

// Helper to send JSON-RPC messages
let messageId = 0;
function createMessage(method, params = {}) {
  return {
    jsonrpc: "2.0",
    id: ++messageId,
    method: method,
    params: params
  };
}

// Test messages
const testMessages = {
  // 1. Initialize connection
  initialize: createMessage("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  }),

  // 2. List available tools
  listTools: createMessage("tools/list", {}),

  // 3. Test perplexity_ask tool
  askTest: createMessage("tools/call", {
    name: "perplexity_ask",
    arguments: {
      messages: [
        {
          role: "user",
          content: "What is the capital of France? Give a brief answer."
        }
      ]
    }
  }),

  // 4. Test perplexity_research tool
  researchTest: createMessage("tools/call", {
    name: "perplexity_research",
    arguments: {
      messages: [
        {
          role: "user",
          content: "What are the latest developments in quantum computing in 2024?"
        }
      ]
    }
  }),

  // 5. Test perplexity_reason tool
  reasonTest: createMessage("tools/call", {
    name: "perplexity_reason",
    arguments: {
      messages: [
        {
          role: "user",
          content: "If all roses are flowers, and some flowers fade quickly, can we conclude that some roses fade quickly? Explain your reasoning."
        }
      ]
    }
  })
};

// Create SSE connection
console.log('Connecting to MCP server at:', SERVER_URL);
const eventSource = new EventSource(SERVER_URL);

eventSource.onopen = () => {
  console.log('Connected to MCP server');
  
  // Send test messages
  console.log('\nSending initialize request...');
  eventSource.send(JSON.stringify(testMessages.initialize));
};

eventSource.onmessage = (event) => {
  console.log('\nReceived message:');
  console.log(JSON.parse(event.data));
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  eventSource.close();
};

// Note: Standard EventSource doesn't support sending data back to server
// For full bidirectional communication, you'd need to use:
// 1. A WebSocket-based approach
// 2. HTTP POST requests alongside SSE for receiving
// 3. A specialized SSE client that supports bidirectional communication

console.log(`
Note: This is a simplified test. For full MCP testing, consider using:
1. The official MCP client SDK
2. A tool like 'sse-client' that supports bidirectional SSE
3. WebSocket transport instead of SSE

Alternative testing approach using curl:
`);

// Print curl examples
console.log(`
# Test with curl (one-way communication):
curl -N -H "Accept: text/event-stream" http://localhost:8080/sse

# For bidirectional testing, you'll need a more sophisticated client
# or use the stdio transport mode instead:
echo '${JSON.stringify(testMessages.initialize)}' | node dist/server.js
`);