const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET ALL ORDERS (MCP)
 * POST /api/mcp/orders/list
 */
const getOrders = async (req, res) => {
  try {
    const company_id = req.company.id;

    const orders = await prisma.orders.findMany({
      where: { Company_id: BigInt(company_id) },
      include: {
        customer: { select: { id: true, Name: true } },
        _count: { select: { orderSteps: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = orders.map(order => ({
      id: order.id.toString(),
      order_number: order.order_number,
      customer_name: order.customer?.Name || null,
      steps_count: order._count.orderSteps
    }));

    res.json({ orders: formatted });
  } catch (error) {
    console.error('MCP orders list error:', error);
    res.status(500).json({ message: 'Siparişler getirilemedi.' });
  }
};

/**
 * GET ONE ORDER (MCP)
 * POST /api/mcp/orders/get
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.body;
    const company_id = req.company.id;

    if (!id) return res.status(400).json({ message: 'Order ID gerekli.' });

    const order = await prisma.orders.findFirst({
      where: { id: BigInt(id), Company_id: BigInt(company_id) },
      include: {
        customer: true,
        orderSteps: {
          include: {
            product: true,
            assignedUser: { select: { id: true, Name: true } }
          },
          orderBy: [
            { Product_id: 'asc' },
            { step_number: 'asc' }
          ]
        }
      }
    });

    if (!order) return res.status(404).json({ message: 'Sipariş bulunamadı.' });

    const formatted = {
      id: order.id.toString(),
      order_number: order.order_number,
      is_stock: order.is_stock,
      customer: order.customer ? {
        id: order.customer.id.toString(),
        name: order.customer.Name
      } : null,
      orderSteps: order.orderSteps.map(step => ({
        id: step.id.toString(),
        product_name: step.product.name,
        step_name: step.step_name,
        step_number: step.step_number,
        assigned_to: step.assignedUser?.Name || null,
        status: step.status
      }))
    };

    res.json({ order: formatted });
  } catch (error) {
    console.error('MCP order get error:', error);
    res.status(500).json({ message: 'Sipariş getirilemedi.' });
  }
};

/**
 * CREATE STOCK ORDER (MCP)
 * POST /api/mcp/orders/create
 */
const createOrder = async (req, res) => {
  try {
    const { notes } = req.body;
    const company_id = req.company.id;

    const now = new Date();
    const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    const todayCount = await prisma.orders.count({
      where: {
        Company_id: BigInt(company_id),
        created_at: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      }
    });

    const orderNumber = `STK-${dateCode}-${String(todayCount + 1).padStart(3, '0')}`;

    const order = await prisma.orders.create({
      data: {
        Company_id: BigInt(company_id),
        order_number: orderNumber,
        notes: notes || '',
        is_stock: true,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      message: 'Stok siparişi oluşturuldu.',
      order: {
        id: order.id.toString(),
        order_number: order.order_number,
        created_at: order.created_at
      }
    });
  } catch (error) {
    console.error('MCP order create error:', error);
    res.status(500).json({ message: 'Sipariş oluşturulamadı.' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder
};
