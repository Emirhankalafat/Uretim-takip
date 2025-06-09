import fetch from "node-fetch";

export default {
  name: "products_list",
  description: "Şirketin ürünlerini listeler. İsteğe bağlı olarak belirli bir kategoriye ait ürünleri filtreleyebilir.",
  inputSchema: {
    type: "object",
    properties: {
      category_id: {
        type: "string",
        description: "Belirli bir kategoriye ait ürünleri getirmek için kategori ID'si (opsiyonel)"
      }
    }
  },

  handler: async (args, { env }) => {
    try {
      const apiKey = env?.API_KEY;
      if (!apiKey) throw new Error("API_KEY ortam değişkeni eksik.");

      const requestBody = { api_key: apiKey };
      if (args.category_id) {
        requestBody.category_id = args.category_id;
      }

      const response = await fetch("https://üretimgo.com/api/mcp/products/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
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
