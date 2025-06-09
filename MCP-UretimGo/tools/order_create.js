import fetch from "node-fetch";

export default {
  name: "order_create",
  description: "Yeni bir stok siparişi oluşturur.",
  inputSchema: {
    type: "object",
    properties: {
      notes: {
        type: "string",
        description: "Siparişe ek not (isteğe bağlı)",
        default: ""
      }
    }
  },

  handler: async ({ notes = "" }, { env }) => {
    try {
      const apiKey = env?.API_KEY;
      if (!apiKey) throw new Error("API_KEY ortam değişkeni eksik.");

      const res = await fetch("https://üretimgo.com/api/mcp/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, notes })
      });

      if (!res.ok) throw new Error(`API başarısız: ${res.statusText}`);

      const data = await res.json();

      return {
        content: [
          {
            type: "text",
            text: `✅ Sipariş oluşturuldu!\n\n🆔 ID: ${data.order.id}\n📄 Sipariş No: ${data.order.order_number}`
          }
        ]
      };
    } catch (error) {
      console.error(`❌ [ORDER_CREATE] Hata: ${error.message}`);
      return {
        error: {
          code: -32000,
          message: "Sipariş oluşturulamadı",
          data: error.message
        }
      };
    }
  }
};
