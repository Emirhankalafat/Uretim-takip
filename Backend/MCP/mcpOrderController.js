const fetch = require("node-fetch");

const getOrders = async (req, res) => {
  try {
    const apiKey = req.company?.api_key;
    if (!apiKey) {
      return res.status(400).json({ error: "API key eksik." });
    }

    const response = await fetch("https://uretimgo.com/api/mcp/orders/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey })
    });

    const data = await response.json();
    return res.json(data);

  } catch (error) {
    return res.status(500).json({
      error: "Siparişler alınırken hata oluştu.",
      details: error.message
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.body;
    const apiKey = req.company?.api_key;
    
    if (!apiKey) {
      return res.status(400).json({ error: "API key eksik." });
    }
    
    if (!orderId) {
      return res.status(400).json({ error: "Sipariş ID'si gerekli." });
    }

    const response = await fetch("https://uretimgo.com/api/mcp/orders/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, order_id: orderId })
    });

    const data = await response.json();
    return res.json(data);

  } catch (error) {
    return res.status(500).json({
      error: "Sipariş detayları alınırken hata oluştu.",
      details: error.message
    });
  }
};

const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const apiKey = req.company?.api_key;
    
    if (!apiKey) {
      return res.status(400).json({ error: "API key eksik." });
    }
    
    if (!orderData) {
      return res.status(400).json({ error: "Sipariş verileri gerekli." });
    }

    const response = await fetch("https://uretimgo.com/api/mcp/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, ...orderData })
    });

    const data = await response.json();
    return res.json(data);

  } catch (error) {
    return res.status(500).json({
      error: "Sipariş oluşturulurken hata oluştu.",
      details: error.message
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder
};
