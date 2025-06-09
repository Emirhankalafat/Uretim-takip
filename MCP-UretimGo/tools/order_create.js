import fetch from "node-fetch";

export default {
  name: "order_create",
  description: "Yeni bir sipariş oluşturur. Müşteri seçmek için customers_list, ürün seçmek için products_list, kullanıcı seçmek için users_list kullanabilirsin. Ürün eklersen otomatik olarak o ürünün adımları oluşturulur ve sorumlu kullanıcılara atanır.",
  inputSchema: {
    type: "object",
    properties: {
      customer_id: {
        type: "string",
        description: "Müşteri ID (is_stock=false ise zorunlu). customers_list ile müşteri ID'lerini görebilirsin."
      },      order_number: {
        type: "string",
        description: "Sipariş numarası (isteğe bağlı). Verilmezse otomatik oluşturulur. Örnek: SIP-20250610-001"
      },
      priority: {
        type: "string",
        description: "Sipariş önceliği",
        enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
        default: "NORMAL"
      },
      deadline: {
        type: "string",
        description: "Termin tarihi (YYYY-MM-DD formatında, isteğe bağlı)"
      },
      notes: {
        type: "string",
        description: "Sipariş notları (isteğe bağlı)",
        default: ""
      },      is_stock: {
        type: "boolean",
        description: "Stok siparişi mi? (true=stok siparişi, false=müşteri siparişi)",
        default: false
      },
      products: {
        type: "array",
        description: "Sipariş ürünleri (isteğe bağlı). products_list ile ürün ID'lerini görebilirsin.",
        items: {
          type: "object",
          properties: {
            product_id: {
              type: "string",
              description: "Ürün ID"
            },
            quantity: {
              type: "number",
              description: "Miktar",
              default: 1
            }
          },
          required: ["product_id"]
        }
      }},
    required: []
  },

  handler: async ({ customer_id, order_number, priority = "NORMAL", deadline, notes = "", is_stock = false, products = [] }, { env }) => {
    try {
      const apiKey = env?.API_KEY;
      if (!apiKey) throw new Error("API_KEY ortam değişkeni eksik.");

      // Müşteri siparişi ise Customer_id zorunlu
      if (!is_stock && !customer_id) {
        throw new Error("Müşteri siparişi için customer_id zorunludur. customers_list tool'unu kullanarak müşteri ID'lerini görebilirsin.");
      }      const requestBody = {
        api_key: apiKey,
        priority,
        notes,
        is_stock
      };

      // Sipariş numarası verilmişse ekle
      if (order_number) {
        requestBody.order_number = order_number;
      }

      // Stok siparişi değilse Customer_id ekle
      if (!is_stock) {
        requestBody.Customer_id = customer_id;
      }

      // Deadline varsa ekle
      if (deadline) {
        requestBody.deadline = deadline;
      }

      // Ürünler varsa ekle
      if (products && products.length > 0) {
        requestBody.products = products;
      }

      const res = await fetch("https://üretimgo.com/api/mcp/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errorData.error || res.statusText);
      }

      const data = await res.json();

      const orderType = is_stock ? "📦 Stok Siparişi" : "👤 Müşteri Siparişi";
      const priorityIcon = {
        LOW: "🟢",
        NORMAL: "🟡", 
        HIGH: "🟠",
        URGENT: "🔴"
      }[priority] || "🟡";      let responseText = `✅ ${orderType} oluşturuldu!\n\n`;
      responseText += `🆔 ID: ${data.order.id}\n`;
      responseText += `📄 Sipariş No: ${data.order.order_number}`;
      
      if (!order_number) {
        responseText += ` (otomatik oluşturuldu)`;
      }
      
      responseText += `\n${priorityIcon} Öncelik: ${priority}\n`;
      
      if (deadline) {
        responseText += `📅 Termin: ${deadline}\n`;
      }
        if (notes) {
        responseText += `📝 Not: ${notes}\n`;
      }

      if (data.totalStepsCreated > 0) {
        responseText += `🔧 Oluşturulan Adım: ${data.totalStepsCreated}\n`;
        responseText += `👥 Sorumlu Kullanıcı: ${data.assignedUsers}\n`;
      }

      responseText += `\n💡 İpucu: Sipariş detaylarını görmek için order_get tool'unu kullanabilirsin.`;

      return {
        content: [
          {
            type: "text",
            text: responseText
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
