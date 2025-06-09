import fetch from "node-fetch";

export default {
  name: "order_get",
  description: "Tek bir siparişi getirir. Sipariş ID'sini order_list tool'undan alabilirsin.",
  inputSchema: {
    type: "object",
    properties: {
      order_id: { 
        type: "string", 
        description: "Sipariş ID (order_list tool'undan alınabilir)" 
      }
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || response.statusText);
      }

      const data = await response.json();

      if (!data.order) {
        return {
          content: [
            { type: "text", text: "📭 Sipariş bulunamadı." }
          ]
        };
      }

      const order = data.order;
      
      // Durum ikonları
      const statusIcons = {
        PENDING: "⏳",
        IN_PROGRESS: "🔄", 
        COMPLETED: "✅",
        CANCELLED: "❌"
      };

      const priorityIcons = {
        LOW: "🟢",
        NORMAL: "🟡",
        HIGH: "🟠", 
        URGENT: "🔴"
      };

      let responseText = `📦 **Sipariş Detayı**\n\n`;
      responseText += `🆔 **ID:** ${order.id}\n`;
      responseText += `📄 **Sipariş No:** ${order.order_number}\n`;
      responseText += `${statusIcons[order.status] || "❓"} **Durum:** ${order.status}\n`;
      responseText += `${priorityIcons[order.priority] || "🟡"} **Öncelik:** ${order.priority}\n`;
      responseText += `📦 **Tip:** ${order.is_stock ? "Stok Siparişi" : "Müşteri Siparişi"}\n`;
      
      if (order.customer) {
        responseText += `👤 **Müşteri:** ${order.customer.Name}\n`;
      }
      
      if (order.deadline) {
        const deadline = new Date(order.deadline);
        responseText += `📅 **Termin:** ${deadline.toLocaleDateString('tr-TR')}\n`;
      }
      
      if (order.notes) {
        responseText += `📝 **Notlar:** ${order.notes}\n`;
      }
      
      responseText += `📅 **Oluşturulma:** ${new Date(order.created_at).toLocaleDateString('tr-TR')}\n`;
      
      if (order.orderSteps && order.orderSteps.length > 0) {
        responseText += `\n🔧 **Sipariş Adımları:** ${order.orderSteps.length} adım\n`;
        responseText += `💡 Adım detaylarını görmek için order_steps_list tool'unu kullanabilirsin.\n`;
      }

      responseText += `\n📊 **Ham Veri (JSON):**\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;

      return {
        content: [{ type: "text", text: responseText }]
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
