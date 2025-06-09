const { getPrismaClient, checkPrismaClient } = require('../utils/prismaClient');

// Merkezi prisma client'ı al
const prisma = getPrismaClient();

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

    res.setHeader('Content-Type', 'application/json');
    res.send(
      JSON.stringify({ orders: formatted }, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
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

// Müşterileri getir
const getCustomers = async (req, res) => {
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

    const customers = await prisma.customers.findMany({
      where: { Company_Id: company.id },
      orderBy: { Created_At: "desc" }
    });

    const formatted = customers.map(customer => ({
      ...customer,
      id: customer.id.toString(),
      Company_Id: customer.Company_Id?.toString()
    }));

    res.setHeader('Content-Type', 'application/json');
    res.send(
      JSON.stringify({ customers: formatted }, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
  } catch (error) {
    console.error("Müşterileri getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası.", details: error.message });
  }
};

// Kategorileri getir
const getCategories = async (req, res) => {
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

    const categories = await prisma.categories.findMany({
      where: { Company_id: company.id },
      include: {
        products: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const formatted = categories.map(category => ({
      ...category,
      id: category.id.toString(),
      Company_id: category.Company_id?.toString(),
      products: category.products.map(product => ({
        ...product,
        id: product.id.toString()
      }))
    }));

    res.setHeader('Content-Type', 'application/json');
    res.send(
      JSON.stringify({ categories: formatted }, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
  } catch (error) {
    console.error("Kategorileri getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası.", details: error.message });
  }
};

// Ürünleri getir
const getProducts = async (req, res) => {
  try {
    const { api_key, category_id } = req.body;

    if (!api_key) {
      return res.status(400).json({ error: "API key zorunludur." });
    }

    const company = await prisma.company.findFirst({
      where: { api_key }
    });

    if (!company) {
      return res.status(403).json({ error: "Geçersiz API key." });
    }

    const whereClause = { Company_id: company.id };
    if (category_id) {
      whereClause.Category_id = BigInt(category_id);
    }

    const products = await prisma.products.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            Name: true
          }
        },
        steps: {
          orderBy: { Step_number: 'asc' }
        }
      }
    });

    const formatted = products.map(product => ({
      ...product,
      id: product.id.toString(),
      Category_id: product.Category_id?.toString(),
      Company_id: product.Company_id?.toString(),
      category: product.category ? {
        ...product.category,
        id: product.category.id.toString()
      } : null,
      steps: product.steps.map(step => ({
        ...step,
        id: step.id.toString(),
        Product_id: step.Product_id?.toString(),
        Responsible_User: step.Responsible_User?.toString()
      }))
    }));

    res.setHeader('Content-Type', 'application/json');
    res.send(
      JSON.stringify({ products: formatted }, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
  } catch (error) {
    console.error("Ürünleri getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası.", details: error.message });
  }
};

// Sipariş adımlarını getir
const getOrderSteps = async (req, res) => {
  try {
    const { api_key, order_id } = req.body;

    if (!api_key) {
      return res.status(400).json({ error: "API key zorunludur." });
    }

    if (!order_id) {
      return res.status(400).json({ error: "order_id zorunludur." });
    }

    const company = await prisma.company.findFirst({
      where: { api_key }
    });

    if (!company) {
      return res.status(403).json({ error: "Geçersiz API key." });
    }

    // Önce siparişin bu şirkete ait olduğunu kontrol et
    const order = await prisma.orders.findFirst({
      where: {
        id: BigInt(order_id),
        Company_id: company.id
      }
    });

    if (!order) {
      return res.status(404).json({ error: "Sipariş bulunamadı." });
    }

    const orderSteps = await prisma.orderSteps.findMany({
      where: { Order_id: BigInt(order_id) },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            Name: true,
            Mail: true
          }
        }
      },
      orderBy: { step_number: 'asc' }
    });

    const formatted = orderSteps.map(step => ({
      ...step,
      id: step.id.toString(),
      Order_id: step.Order_id?.toString(),
      Product_id: step.Product_id?.toString(),
      assigned_user: step.assigned_user?.toString(),
      product: step.product ? {
        ...step.product,
        id: step.product.id.toString()
      } : null,
      assignedUser: step.assignedUser ? {
        ...step.assignedUser,
        id: step.assignedUser.id.toString()
      } : null
    }));

    res.setHeader('Content-Type', 'application/json');
    res.send(
      JSON.stringify({ orderSteps: formatted }, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
  } catch (error) {
    console.error("Sipariş adımlarını getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası.", details: error.message });
  }
};

// Kullanıcıları getir
const getUsers = async (req, res) => {
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

    const users = await prisma.user.findMany({
      where: { 
        company_id: company.id,
        is_active: true
      },
      select: {
        id: true,
        Name: true,
        Mail: true,
        is_SuperAdmin: true,
        is_active: true,
        created_at: true,
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: { created_at: "desc" }
    });

    const formatted = users.map(user => ({
      ...user,
      id: user.id.toString(),
      company_id: company.id.toString(),
      permissions: user.permissions.map(up => ({
        id: up.id.toString(),
        User_id: up.User_id.toString(),
        Permission_id: up.Permission_id.toString(),
        permission: {
          ...up.permission,
          id: up.permission.id.toString()
        }
      }))
    }));

    res.setHeader('Content-Type', 'application/json');
    res.send(
      JSON.stringify({ users: formatted }, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
  } catch (error) {
    console.error("Kullanıcıları getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası.", details: error.message });
  }
};

// Şirket bilgilerini getir
const getCompanyInfo = async (req, res) => {
  try {
    const { api_key } = req.body;

    if (!api_key) {
      return res.status(400).json({ error: "API key zorunludur." });
    }

    const company = await prisma.company.findFirst({
      where: { api_key },
      select: {
        id: true,
        Name: true,
        Created_At: true,
        Max_User: true,
        Suspscription_package: true,
        Sub_end_time: true,
        _count: {
          select: {
            users: true,
            orders: true,
            products: true,
            customers: true,
            categories: true
          }
        }
      }
    });

    if (!company) {
      return res.status(403).json({ error: "Geçersiz API key." });
    }

    const formatted = {
      ...company,
      id: company.id.toString(),
      _count: company._count
    };

    res.setHeader('Content-Type', 'application/json');
    res.send(
      JSON.stringify({ company: formatted }, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );
  } catch (error) {
    console.error("Şirket bilgilerini getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası.", details: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  getCustomers,
  getCategories,
  getProducts,
  getOrderSteps,
  getUsers,
  getCompanyInfo
};
