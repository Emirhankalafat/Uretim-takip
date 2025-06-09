#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import orderList from "./tools/order_list.js";
import orderGet from "./tools/order_get.js";
import orderCreate from "./tools/order_create.js";
import customersList from "./tools/customers_list.js";
import categoriesList from "./tools/categories_list.js";
import productsList from "./tools/products_list.js";
import orderStepsList from "./tools/order_steps_list.js";
import usersList from "./tools/users_list.js";
import companyInfo from "./tools/company_info.js";

const server = new Server(
  { name: "uretimgo", version: "1.0.0" },
  {
    capabilities: {
      tools: {
        order_list: orderList,
        order_get: orderGet,
        order_create: orderCreate,
        customers_list: customersList,
        categories_list: categoriesList,
        products_list: productsList,
        order_steps_list: orderStepsList,
        users_list: usersList,
        company_info: companyInfo
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
        },
        {
          name: orderGet.name,
          description: orderGet.description,  
          inputSchema: orderGet.inputSchema
        },
        {
          name: orderCreate.name,
          description: orderCreate.description,
          inputSchema: orderCreate.inputSchema
        },
        {
          name: customersList.name,
          description: customersList.description,
          inputSchema: customersList.inputSchema
        },
        {
          name: categoriesList.name,
          description: categoriesList.description,
          inputSchema: categoriesList.inputSchema
        },
        {
          name: productsList.name,
          description: productsList.description,
          inputSchema: productsList.inputSchema
        },
        {
          name: orderStepsList.name,
          description: orderStepsList.description,
          inputSchema: orderStepsList.inputSchema
        },
        {
          name: usersList.name,
          description: usersList.description,
          inputSchema: usersList.inputSchema
        },
        {
          name: companyInfo.name,
          description: companyInfo.description,
          inputSchema: companyInfo.inputSchema
        }
      ]
    };
  }
  if (method === "tools/call") {
    const { name, arguments: args = {} } = params;

    try {
      if (name === orderList.name) {
        return await orderList.handler(args, { env: process.env });
      } else if (name === orderGet.name) {
        return await orderGet.handler(args, { env: process.env });
      } else if (name === orderCreate.name) {
        return await orderCreate.handler(args, { env: process.env });
      } else if (name === customersList.name) {
        return await customersList.handler(args, { env: process.env });
      } else if (name === categoriesList.name) {
        return await categoriesList.handler(args, { env: process.env });
      } else if (name === productsList.name) {
        return await productsList.handler(args, { env: process.env });
      } else if (name === orderStepsList.name) {
        return await orderStepsList.handler(args, { env: process.env });
      } else if (name === usersList.name) {
        return await usersList.handler(args, { env: process.env });
      } else if (name === companyInfo.name) {
        return await companyInfo.handler(args, { env: process.env });
      }

      return {
        error: {
          code: -32601,
          message: `Tool bulunamadı: ${name}`
        }
      };
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

  return {};
};

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error("✅ ÜretimGo MCP sunucusu başlatıldı.");
});
