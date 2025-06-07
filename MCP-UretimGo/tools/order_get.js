import fetch from "node-fetch";

export default {
  name: "order_get",
  description: "Tek bir siparişi getirir.",
  inputSchema: {
    type: "object",
    properties: {
      order_id: { type: "string", description: "Sipariş ID" }
    },
    required: ["order_id"]
  },

  handler: async ({ order_id }, { env }) => {
    try {
      const apiKey = env?.API_KEY;
      if (!apiKey) throw new Error("API_KEY ortam değişkeni eksik.");
      if (!order_id) throw new Error("order_id eksik.");

      const response = await fetch("https://üretimgo.com/api/mcp/orders/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ api_key: apiKey, order_id })
      });

      const data = await response.json();

      if (!data.order) {
        return {
          content: [
            { type: "text", text: "📭 Sipariş bulunamadı." }
          ]
        };
      }

      const text = "```json\n" + JSON.stringify(data, null, 2) + "\n```";

      console.error("📦 [ORDER_GET] Local Cevap:", JSON.stringify(data, null, 2));

      return {
        content: [{ type: "text", text }]
      };
    } catch (error) {
      console.error("❌ [ORDER_GET] Hata:", error);
      return {
        error: {
          code: -32000,
          message: "Sipariş getirilirken hata oluştu",
          data: error.message
        }
      };
    }
  }
};
