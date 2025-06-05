import fetch from "node-fetch";

export default {
  name: "order_list",
  description: "Şirkete ait tüm siparişleri listeler.",
  inputSchema: {
    type: "object",
    properties: {}
  },

  handler: async (_args, { env }) => {
    try {
      const apiKey = env?.API_KEY;
      if (!apiKey) throw new Error("API_KEY ortam değişkeni eksik.");

      const res = await fetch("https://uretimgo.com/api/mcp/orders/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey })
      });

      if (!res.ok) {
        throw new Error(`API başarısız: ${res.statusText}`);
      }

      const { orders } = await res.json();

      if (!Array.isArray(orders) || orders.length === 0) {
        return {
          content: [{ type: "text", text: "📦 Hiç sipariş bulunamadı." }]
        };
      }

      let text = "📦 Siparişler:\n\n";
      for (const order of orders) {
        text += `🆔 ID: ${order.id}\n`;
        text += `📄 No: ${order.order_number}\n`;
        text += `👥 Müşteri: ${order.customer_name || "Yok"}\n`;
        text += `🔢 Adım Sayısı: ${order.steps_count}\n\n`;
      }

      return { content: [{ type: "text", text }] };

    } catch (error) {
      console.error(`❌ [ORDER_LIST] Hata: ${error.message}`);
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
