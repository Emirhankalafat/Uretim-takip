import fetch from "node-fetch";

export default {
  name: "order_list",
  description: "Kullanıcının siparişlerini listeler.",
  inputSchema: {
    type: "object",
    properties: {}
  },

  handler: async (_args, { env }) => {
    try {
      const apiKey = env?.API_KEY;
      if (!apiKey) throw new Error("API_KEY ortam değişkeni eksik.");

      const response = await fetch("https://üretimgo.com/api/mcp/orders/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey })
      });

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: "```json\n" + JSON.stringify(data, null, 2) + "\n```"
          }
        ]
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
};
