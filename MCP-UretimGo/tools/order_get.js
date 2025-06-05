import fetch from "node-fetch";

export default {
  name: "order_list",
  description: "Kullanıcının siparişlerini backend üzerinden listeler (JSON olarak).",
  inputSchema: {
    type: "object",
    properties: {}
  },

  handler: async (_args, { env }) => {
    try {
      const apiKey = env?.API_KEY;
      if (!apiKey) throw new Error("API_KEY ortam değişkeni eksik.");

      const response = await fetch("https://uretimgo.com/api/mcp/orders/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey })
      });

      const data = await response.json();

      if (!Array.isArray(data.orders) || data.orders.length === 0) {
        return {
          content: [
            { type: "text", text: "📭 Hiç sipariş bulunamadı." }
          ]
        };
      }

      // JSON veriyi markdown içinde döndür
      const text = "```json\n" + JSON.stringify(data, null, 2) + "\n```";

      console.error("📦 [ORDER_LIST] Cevap:", JSON.stringify(data, null, 2));

      return {
        content: [{ type: "text", text }]
      };
    } catch (error) {
      console.error("❌ [ORDER_LIST] Hata:", error);
      return {
        error: {
          code: -32000,
          message: "Siparişler getirilirken hata oluştu",
          data: error.message
        }
      };
    }
  }
};
