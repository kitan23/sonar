# HTTP Mode for Perplexity MCP Server

This MCP server supports both stdio (default) and HTTP/SSE transports. The HTTP mode uses the SDK's built-in SSE transport for simpler, standards-compliant implementation.

## Running the Server

### Standard stdio mode (default):
```bash
npm start
# or
node dist/server.js
```

### HTTP mode with SSE:
```bash
npm run start:http
# or
node dist/server.js --port 8080
```

The HTTP server will run on the specified port (default 8080 if using npm script).

## HTTP Endpoint

### SSE Endpoint: `/sse`
The server exposes a single SSE endpoint at `/sse` that handles all MCP communication using Server-Sent Events.

## Client Configuration

When using HTTP mode, configure your MCP client to connect to the SSE endpoint:

```json
{
  "mcpServers": {
    "perplexity": {
      "url": "http://localhost:8080/sse"
    }
  }
}
```

## Environment Variables

- `PERPLEXITY_API_KEY` - Required. Your Perplexity API key
- `--port` - Command line argument to specify HTTP server port

## How It Works

The server uses the MCP SDK's built-in `SSEServerTransport` which handles:
- Server-Sent Events for bidirectional communication
- Automatic session management
- Protocol compliance with MCP specification
- Proper error handling and connection management

## Example Usage

1. Start the server in HTTP mode:
   ```bash
   export PERPLEXITY_API_KEY=your_api_key_here
   npm run start:http
   ```

2. Connect your MCP client to `http://localhost:8080/sse`

3. The client can now call the available tools:
   - `perplexity_ask` - General conversation queries
   - `perplexity_research` - Deep research queries
   - `perplexity_reason` - Reasoning tasks

## Differences from stdio Mode

- **Transport**: Uses HTTP/SSE instead of stdin/stdout
- **Connectivity**: Can accept connections from network clients
- **Simplicity**: Leverages SDK's built-in transport handling
- **Standards**: Fully compliant with MCP SSE transport specification