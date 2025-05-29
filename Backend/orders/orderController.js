const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Sipariş oluşturma
const createOrder = async (req, res) => {
  try {
    const { Customer_id, priority, deadline, notes, products } = req.body;
    const company_id = req.user.company_id;

    // Müşteri kontrolü
    const customer = await prisma.customers.findFirst({
      where: {
        id: BigInt(Customer_id),
        Company_Id: BigInt(company_id)
      }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı.' });
    }

    // Otomatik sipariş numarası oluştur
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Aynı gün içindeki sipariş sayısını bul
    const startOfDay = new Date(year, now.getMonth(), now.getDate());
    const endOfDay = new Date(year, now.getMonth(), now.getDate() + 1);
    
    const todayOrderCount = await prisma.orders.count({
      where: {
        Company_id: BigInt(company_id),
        created_at: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    const orderNumber = `SIP-${year}${month}${day}-${String(todayOrderCount + 1).padStart(3, '0')}`;

    // Transaction ile sipariş ve step'leri oluştur
    const result = await prisma.$transaction(async (tx) => {
      // Sipariş oluştur
      const order = await tx.orders.create({
        data: {
          order_number: orderNumber,
          Customer_id: BigInt(Customer_id),
          Company_id: BigInt(company_id),
          priority: priority || 'NORMAL',
          deadline: deadline ? new Date(deadline) : null,
          notes,
          status: 'PENDING'
        }
      });

      // Her product için step'leri oluştur
      if (products && products.length > 0) {
        for (const productData of products) {
          const { product_id, quantity = 1, customSteps } = productData;

          // Ürün var mı kontrol et
          const product = await tx.products.findFirst({
            where: {
              id: BigInt(product_id),
              Company_id: BigInt(company_id)
            }
          });

          if (!product) {
            throw new Error(`Ürün bulunamadı: ${product_id}`);
          }

          // Eğer customSteps varsa onları kullan, yoksa ProductSteps'ten şablon al
          if (customSteps && customSteps.length > 0) {
            // Manuel olarak düzenlenmiş step'leri kullan
            for (const customStep of customSteps) {
              await tx.orderSteps.create({
                data: {
                  Order_id: order.id,
                  Product_id: BigInt(product_id),
                  step_name: customStep.step_name,
                  step_description: customStep.step_description || null,
                  step_number: customStep.step_number,
                  assigned_user: customStep.assigned_user ? BigInt(customStep.assigned_user) : null,
                  status: 'WAITING'
                }
              });
            }
          } else {
            // ProductSteps'ten şablon olarak al
            const productSteps = await tx.productSteps.findMany({
              where: { Product_id: BigInt(product_id) },
              orderBy: { Step_number: 'asc' }
            });

            // Her step için order step oluştur (şablon olarak)
            for (const step of productSteps) {
              await tx.orderSteps.create({
                data: {
                  Order_id: order.id,
                  Product_id: BigInt(product_id),
                  step_name: step.Name,
                  step_description: step.Description,
                  step_number: step.Step_number,
                  assigned_user: step.Responsible_User,
                  status: 'WAITING'
                }
              });
            }
          }
        }
      }

      return order;
    });

    res.status(201).json({
      message: 'Sipariş başarıyla oluşturuldu.',
      order: {
        ...result,
        id: result.id.toString(),
        Customer_id: result.Customer_id.toString(),
        Company_id: result.Company_id.toString()
      }
    });
  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    if (error.message.includes('Ürün bulunamadı')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Sunucu hatası.' });
    }
  }
};

// ProductSteps'i şablon olarak getirme (sipariş oluştururken kullanmak için)
const getProductStepsTemplate = async (req, res) => {
  try {
    const { productId } = req.params;
    const company_id = req.user.company_id;

    // Product'ın şirkete ait olduğunu kontrol et
    const product = await prisma.products.findFirst({
      where: {
        id: BigInt(productId),
        Company_id: BigInt(company_id)
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı.' });
    }

    // Product'ın step'lerini getir
    const productSteps = await prisma.productSteps.findMany({
      where: { Product_id: BigInt(productId) },
      include: {
        responsible: {
          select: { id: true, Name: true }
        }
      },
      orderBy: { Step_number: 'asc' }
    });

    // Şablon formatında dön (düzenlenebilir)
    const stepsTemplate = productSteps.map(step => ({
      id: step.id.toString(), // ProductStep ID'si (referans için)
      step_name: step.Name,
      step_description: step.Description,
      step_number: step.Step_number,
      assigned_user: step.Responsible_User?.toString() || null,
      assignedUser: step.responsible ? {
        id: step.responsible.id.toString(),
        Name: step.responsible.Name
      } : null,
      isEditable: true // Frontend'de düzenlenebilir olduğunu belirt
    }));

    res.json({
      message: 'Ürün adımları şablon olarak getirildi.',
      product: {
        id: product.id.toString(),
        name: product.name,
        description: product.description
      },
      stepsTemplate
    });
  } catch (error) {
    console.error('Ürün adımları şablon getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Siparişleri listeleme
const getOrders = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { status, customer_id, search, page = 1, limit = 10 } = req.query;

    let whereClause = {
      Company_id: BigInt(company_id)
    };

    // Filtreler
    if (status) {
      whereClause.status = status;
    }

    if (customer_id) {
      whereClause.Customer_id = BigInt(customer_id);
    }

    if (search) {
      whereClause.OR = [
        { order_number: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const orders = await prisma.orders.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { id: true, Name: true }
        },
        orderSteps: {
          include: {
            product: {
              select: { id: true, name: true }
            },
            assignedUser: {
              select: { id: true, Name: true }
            }
          }
        },
        _count: {
          select: { orderSteps: true }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const totalOrders = await prisma.orders.count({ where: whereClause });

    const formattedOrders = orders.map(order => ({
      ...order,
      id: order.id.toString(),
      Customer_id: order.Customer_id.toString(),
      Company_id: order.Company_id.toString(),
      customer: {
        ...order.customer,
        id: order.customer.id.toString()
      },
      orderSteps: order.orderSteps.map(step => ({
        ...step,
        id: step.id.toString(),
        Order_id: step.Order_id.toString(),
        Product_id: step.Product_id.toString(),
        assigned_user: step.assigned_user?.toString(),
        product: {
          ...step.product,
          id: step.product.id.toString()
        },
        assignedUser: step.assignedUser ? {
          ...step.assignedUser,
          id: step.assignedUser.id.toString()
        } : null
      }))
    }));

    res.json({
      message: 'Siparişler başarıyla getirildi.',
      orders: formattedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    console.error('Siparişleri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Tek sipariş getirme
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    const order = await prisma.orders.findFirst({
      where: {
        id: BigInt(id),
        Company_id: BigInt(company_id)
      },
      include: {
        customer: true,
        orderSteps: {
          include: {
            product: {
              select: { id: true, name: true, description: true }
            },
            assignedUser: {
              select: { id: true, Name: true }
            }
          },
          orderBy: [
            { Product_id: 'asc' },
            { step_number: 'asc' }
          ]
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }

    const formattedOrder = {
      ...order,
      id: order.id.toString(),
      Customer_id: order.Customer_id.toString(),
      Company_id: order.Company_id.toString(),
      customer: {
        ...order.customer,
        id: order.customer.id.toString(),
        Company_Id: order.customer.Company_Id.toString()
      },
      orderSteps: order.orderSteps.map(step => ({
        ...step,
        id: step.id.toString(),
        Order_id: step.Order_id.toString(),
        Product_id: step.Product_id.toString(),
        assigned_user: step.assigned_user?.toString(),
        product: {
          ...step.product,
          id: step.product.id.toString()
        },
        assignedUser: step.assignedUser ? {
          ...step.assignedUser,
          id: step.assignedUser.id.toString()
        } : null
      }))
    };

    res.json({
      message: 'Sipariş başarıyla getirildi.',
      order: formattedOrder
    });
  } catch (error) {
    console.error('Sipariş getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Sipariş güncelleme
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { Customer_id, priority, deadline, notes, status } = req.body;
    const company_id = req.user.company_id;

    // Sipariş var mı ve aynı şirkette mi kontrol et
    const existingOrder = await prisma.orders.findFirst({
      where: {
        id: BigInt(id),
        Company_id: BigInt(company_id)
      }
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }

    // Müşteri kontrolü (eğer değiştirilecekse)
    if (Customer_id) {
      const customer = await prisma.customers.findFirst({
        where: {
          id: BigInt(Customer_id),
          Company_Id: BigInt(company_id)
        }
      });

      if (!customer) {
        return res.status(404).json({ message: 'Müşteri bulunamadı.' });
      }
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: BigInt(id) },
      data: {
        ...(Customer_id && { Customer_id: BigInt(Customer_id) }),
        ...(priority && { priority }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
        updated_at: new Date()
      }
    });

    res.json({
      message: 'Sipariş başarıyla güncellendi.',
      order: {
        ...updatedOrder,
        id: updatedOrder.id.toString(),
        Customer_id: updatedOrder.Customer_id.toString(),
        Company_id: updatedOrder.Company_id.toString()
      }
    });
  } catch (error) {
    console.error('Sipariş güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Sipariş silme
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    // Sipariş var mı ve aynı şirkette mi kontrol et
    const order = await prisma.orders.findFirst({
      where: {
        id: BigInt(id),
        Company_id: BigInt(company_id)
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }

    // Cascade delete ile order steps de silinir
    await prisma.orders.delete({
      where: { id: BigInt(id) }
    });

    res.json({ message: 'Sipariş başarıyla silindi.' });
  } catch (error) {
    console.error('Sipariş silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getProductStepsTemplate
}; 