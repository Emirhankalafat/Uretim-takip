const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Siparişleri getir
const getOrders = async (req, res) => {
  try {
    const { api_key } = req.body;

    if (!api_key) {
      return res.status(400).json({ error: "API key zorunludur." });
    }

    const company = await prisma.company.findFirst({
      where: { api_key }
    });

    if (!company) {
      return res.status(403).json({ error: "Geçersiz API key." });
    }

    const orders = await prisma.orders.findMany({
      where: { Company_id: company.id },
      include: { customer: true },
      orderBy: { created_at: "desc" }
    });

    const formatted = orders.map(order => ({
      ...order,
      id: order.id.toString(),
      Company_id: order.Company_id?.toString(),
      Customer_id: order.Customer_id?.toString(),
      customer: order.customer ? {
        ...order.customer,
        id: order.customer.id?.toString()
      } : null
    }));

    res.json({ orders: formatted });
  } catch (error) {
    console.error("Siparişleri getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası.", details: error.message });
  }
};

// Tek siparişi getir
const getOrderById = async (req, res) => {
  try {
    const { api_key, order_id } = req.body;

    if (!api_key || !order_id) {
      return res.status(400).json({ error: "api_key ve order_id zorunludur." });
    }

    const company = await prisma.company.findFirst({
      where: { api_key }
    });

    if (!company) {
      return res.status(403).json({ error: "Geçersiz API key." });
    }

    const order = await prisma.orders.findFirst({
      where: {
        id: BigInt(order_id),
        Company_id: company.id
      },
      include: {
        customer: true,
        orderSteps: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: "Sipariş bulunamadı." });
    }

    res.json({
      order: {
        ...order,
        id: order.id.toString(),
        Customer_id: order.Customer_id?.toString(),
        Company_id: order.Company_id?.toString(),
        customer: order.customer ? {
          ...order.customer,
          id: order.customer.id?.toString()
        } : null,
        orderSteps: order.orderSteps.map(step => ({
          ...step,
          id: step.id.toString(),
          Order_id: step.Order_id?.toString(),
          Product_id: step.Product_id?.toString()
        }))
      }
    });
  } catch (error) {
    console.error("Sipariş detay hatası:", error);
    res.status(500).json({ error: "Sunucu hatası.", details: error.message });
  }
};

// Sipariş oluştur
const createOrder = async (req, res) => {
  try {
    const { api_key, Customer_id, order_number, priority = "NORMAL", deadline, notes = "", is_stock = false } = req.body;

    if (!api_key || !order_number) {
      return res.status(400).json({ error: "api_key ve order_number zorunludur." });
    }

    const company = await prisma.company.findFirst({
      where: { api_key }
    });

    if (!company) {
      return res.status(403).json({ error: "Geçersiz API key." });
    }

    const newOrder = await prisma.orders.create({
      data: {
        Company_id: company.id,
        Customer_id: Customer_id ? BigInt(Customer_id) : null,
        order_number,
        priority,
        deadline: deadline ? new Date(deadline) : null,
        notes,
        is_stock
      }
    });

    res.json({
      order: {
        ...newOrder,
        id: newOrder.id.toString(),
        Company_id: newOrder.Company_id?.toString(),
        Customer_id: newOrder.Customer_id?.toString()
      }
    });
  } catch (error) {
    console.error("Sipariş oluşturma hatası:", error);
    res.status(500).json({ error: "Sunucu hatası.", details: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder
};
