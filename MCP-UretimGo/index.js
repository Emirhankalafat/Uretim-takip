#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import orderList from "./tools/order_list.js";

const server = new Server(
  { name: "uretimgo", version: "1.0.0" },
  {
    capabilities: {
      tools: {
        order_list: orderList
      }
    }
  }
);

server.fallbackRequestHandler = async (request) => {
  const { method, params } = request;

  if (method === "initialize") {
    return {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "uretimgo", version: "1.0.0" }
    };
  }

  if (method === "tools/list") {
    return {
      tools: [
        {
          name: orderList.name,
          description: orderList.description,
          inputSchema: orderList.inputSchema
        }
      ]
    };
  }

  if (method === "tools/call") {
    const { name, arguments: args = {} } = params;

    if (name === orderList.name) {
      try {
        return await orderList.handler(args, { env: process.env });
      } catch (error) {
        return {
          error: {
            code: -32000,
            message: "Tool çalıştırılırken hata oluştu",
            data: error.message
          }
        };
      }
    }

    return {
      error: {
        code: -32601,
        message: `Tool bulunamadı: ${name}`
      }
    };
  }

  return {};
};

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error("✅ ÜretimGo MCP sunucusu başlatıldı.");
});
