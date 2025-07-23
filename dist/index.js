#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema, InitializedNotificationSchema, } from "@modelcontextprotocol/sdk/types.js";
import { createServer } from "http";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();
const PERPLEXITY_ASK_TOOL = {
    name: "perplexity_ask",
    description: "Engages in a conversation using the Sonar API. " +
        "Accepts an array of messages (each with a role and content) " +
        "and returns a ask completion response from the Perplexity model.",
    inputSchema: {
        type: "object",
        properties: {
            messages: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        role: {
                            type: "string",
                            description: "Role of the message (e.g., system, user, assistant)",
                        },
                        content: {
                            type: "string",
                            description: "The content of the message",
                        },
                    },
                    required: ["role", "content"],
                },
                description: "Array of conversation messages",
            },
        },
        required: ["messages"],
    },
};
const PERPLEXITY_RESEARCH_TOOL = {
    name: "perplexity_research",
    description: "Performs deep research using the Perplexity API. " +
        "Accepts an array of messages (each with a role and content) " +
        "and returns a comprehensive research response with citations.",
    inputSchema: {
        type: "object",
        properties: {
            messages: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        role: {
                            type: "string",
                            description: "Role of the message (e.g., system, user, assistant)",
                        },
                        content: {
                            type: "string",
                            description: "The content of the message",
                        },
                    },
                    required: ["role", "content"],
                },
                description: "Array of conversation messages",
            },
        },
        required: ["messages"],
    },
};
const PERPLEXITY_REASON_TOOL = {
    name: "perplexity_reason",
    description: "Performs reasoning tasks using the Perplexity API. " +
        "Accepts an array of messages (each with a role and content) " +
        "and returns a well-reasoned response using the sonar-reasoning-pro model.",
    inputSchema: {
        type: "object",
        properties: {
            messages: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        role: {
                            type: "string",
                            description: "Role of the message (e.g., system, user, assistant)",
                        },
                        content: {
                            type: "string",
                            description: "The content of the message",
                        },
                    },
                    required: ["role", "content"],
                },
                description: "Array of conversation messages",
            },
        },
        required: ["messages"],
    },
};
// Check for API key
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
if (!PERPLEXITY_API_KEY) {
    console.error("Error: PERPLEXITY_API_KEY environment variable is required");
    process.exit(1);
}
function performChatCompletion(messages_1) {
    return __awaiter(this, arguments, void 0, function* (messages, model = "sonar-pro") {
        const url = new URL("https://api.perplexity.ai/chat/completions");
        const body = {
            model: model,
            messages: messages,
        };
        let response;
        try {
            response = yield fetch(url.toString(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
                },
                body: JSON.stringify(body),
            });
        }
        catch (error) {
            throw new Error(`Network error while calling Perplexity API: ${error}`);
        }
        if (!response.ok) {
            let errorText;
            try {
                errorText = yield response.text();
            }
            catch (parseError) {
                errorText = "Unable to parse error response";
            }
            throw new Error(`Perplexity API error: ${response.status} ${response.statusText}\n${errorText}`);
        }
        let data;
        try {
            data = yield response.json();
        }
        catch (jsonError) {
            throw new Error(`Failed to parse JSON response from Perplexity API: ${jsonError}`);
        }
        let messageContent = data.choices[0].message.content;
        if (data.citations && Array.isArray(data.citations) && data.citations.length > 0) {
            messageContent += "\n\nCitations:\n";
            data.citations.forEach((citation, index) => {
                messageContent += `[${index + 1}] ${citation}\n`;
            });
        }
        return messageContent;
    });
}
// Create a new server instance
function createServerInstance() {
    const serverInstance = new Server({
        name: "example-servers/perplexity-ask",
        version: "0.1.0",
    }, {
        capabilities: {
            tools: {},
        },
    });
    // Notification handlers
    serverInstance.setNotificationHandler(InitializedNotificationSchema, () => __awaiter(this, void 0, void 0, function* () {
        // Client has acknowledged initialization
        console.log('Client initialized');
    }));
    // Tool handlers
    serverInstance.setRequestHandler(ListToolsRequestSchema, () => __awaiter(this, void 0, void 0, function* () {
        return ({
            tools: [PERPLEXITY_ASK_TOOL, PERPLEXITY_RESEARCH_TOOL, PERPLEXITY_REASON_TOOL],
        });
    }));
    serverInstance.setRequestHandler(CallToolRequestSchema, (request) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, arguments: args } = request.params;
            if (!args) {
                throw new Error("No arguments provided");
            }
            switch (name) {
                case "perplexity_ask": {
                    if (!Array.isArray(args.messages)) {
                        throw new Error("Invalid arguments for perplexity_ask: 'messages' must be an array");
                    }
                    const result = yield performChatCompletion(args.messages, "sonar-pro");
                    return {
                        content: [{ type: "text", text: result }],
                        isError: false,
                    };
                }
                case "perplexity_research": {
                    if (!Array.isArray(args.messages)) {
                        throw new Error("Invalid arguments for perplexity_research: 'messages' must be an array");
                    }
                    const result = yield performChatCompletion(args.messages, "sonar-deep-research");
                    return {
                        content: [{ type: "text", text: result }],
                        isError: false,
                    };
                }
                case "perplexity_reason": {
                    if (!Array.isArray(args.messages)) {
                        throw new Error("Invalid arguments for perplexity_reason: 'messages' must be an array");
                    }
                    const result = yield performChatCompletion(args.messages, "sonar-reasoning-pro");
                    return {
                        content: [{ type: "text", text: result }],
                        isError: false,
                    };
                }
                default:
                    return {
                        content: [{ type: "text", text: `Unknown tool: ${name}` }],
                        isError: true,
                    };
            }
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
                isError: true,
            };
        }
    }));
    return serverInstance;
}
// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--port' && i + 1 < args.length) {
            options.port = parseInt(args[i + 1], 10);
            i++;
        }
    }
    return options;
}
// Session storage for streamable HTTP
const streamableSessions = new Map();
// SSE transport handler
function handleSSE(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const serverInstance = createServerInstance();
        const transport = new SSEServerTransport('/sse', res);
        try {
            yield serverInstance.connect(transport);
        }
        catch (error) {
            console.error('SSE connection error:', error);
        }
    });
}
// Streamable HTTP transport handler
function handleStreamable(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const sessionId = req.headers['mcp-session-id'];
        if (sessionId) {
            // Use existing session
            const session = streamableSessions.get(sessionId);
            if (!session) {
                res.statusCode = 404;
                res.end('Session not found');
                return;
            }
            return yield session.transport.handleRequest(req, res);
        }
        // Create new session for initialization
        if (req.method === 'POST') {
            const serverInstance = createServerInstance();
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (sessionId) => {
                    streamableSessions.set(sessionId, { transport, server: serverInstance });
                    console.log('New session created:', sessionId);
                }
            });
            transport.onclose = () => {
                if (transport.sessionId) {
                    streamableSessions.delete(transport.sessionId);
                    console.log('Session closed:', transport.sessionId);
                }
            };
            try {
                yield serverInstance.connect(transport);
                yield transport.handleRequest(req, res);
            }
            catch (error) {
                console.error('Streamable HTTP connection error:', error);
            }
            return;
        }
        res.statusCode = 400;
        res.end('Invalid request');
    });
}
// HTTP server setup
function startHttpServer(port) {
    const httpServer = createServer();
    httpServer.on('request', (req, res) => __awaiter(this, void 0, void 0, function* () {
        const url = new URL(req.url, `http://${req.headers.host}`);
        if (url.pathname === '/sse') {
            yield handleSSE(req, res);
        }
        else if (url.pathname === '/mcp') {
            yield handleStreamable(req, res);
        }
        else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    }));
    httpServer.listen(port, () => {
        console.log(`Listening on http://localhost:${port}`);
        console.log('Put this in your client config:');
        console.log(JSON.stringify({
            "mcpServers": {
                "perplexity-ask": {
                    "url": `http://localhost:${port}/sse`
                }
            }
        }, null, 2));
        console.log('If your client supports streamable HTTP, you can use the /mcp endpoint instead.');
    });
    return httpServer;
}
// Main server function
function runServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const options = parseArgs();
        if (options.port) {
            // HTTP mode
            startHttpServer(options.port);
        }
        else {
            // STDIO mode (default)
            const serverInstance = createServerInstance();
            const transport = new StdioServerTransport();
            yield serverInstance.connect(transport);
            console.error("Perplexity MCP Server running on stdio with Ask, Research, and Reason tools");
        }
    });
}
runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
