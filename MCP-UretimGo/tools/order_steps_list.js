import fetch from "node-fetch";

export default {
  name: "order_steps_list",
  description: "Belirli bir siparişin üretim adımlarını listeler.",
  inputSchema: {
    type: "object",
    properties: {
      order_id: {
        type: "string",
        description: "Adımlarını getirmek istenen siparişin ID'si"
      }
    },
    required: ["order_id"]
  },

  handler: async (args, { env }) => {
    try {
      const apiKey = env?.API_KEY;
      if (!apiKey) throw new Error("API_KEY ortam değişkeni eksik.");

      if (!args.order_id) {
        throw new Error("order_id parametresi zorunludur.");
      }

      const response = await fetch("https://üretimgo.com/api/mcp/orders/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          api_key: apiKey,
          order_id: args.order_id
        })
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
