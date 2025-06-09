const { getPrismaClient, checkPrismaClient } = require('../utils/prismaClient');
const notificationService = require('../notifications/notification.service');

// Merkezi prisma client'ı al
const prisma = getPrismaClient();

// Sipariş oluşturma
const createOrder = async (req, res) => {
  try {
    // Prisma client kontrolü
    checkPrismaClient(prisma);
    
    const { Customer_id, priority, deadline, notes, products, is_stock } = req.body;
    const company_id = req.user.company_id;
    let customerName = null;

    // Sadece stok siparişi değilse müşteri kontrolü yap
    if (!is_stock) {
      if (!Customer_id) {
        return res.status(400).json({ message: 'Müşteri seçilmedi.' });
      }
      const customer = await prisma.customers.findFirst({
        where: {
          id: BigInt(Customer_id),
          Company_Id: BigInt(company_id)
        }
      });
      if (!customer) {
        return res.status(404).json({ message: 'Müşteri bulunamadı.' });
      }
      customerName = customer.Name; // Bildirim için müşteri adını sakla
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

    // Sipariş numarasını is_stock durumuna göre oluştur
    const orderPrefix = is_stock ? 'STK' : 'SIP';
    const orderNumber = `${orderPrefix}-${year}${month}${day}-${String(todayOrderCount + 1).padStart(3, '0')}`;

    // Transaction ile sipariş ve step'leri oluştur
    const result = await prisma.$transaction(async (tx) => {
      // Sipariş oluştur
      const order = await tx.orders.create({
        data: {
          order_number: orderNumber,
          Customer_id: is_stock ? null : BigInt(Customer_id),
          Company_id: BigInt(company_id),
          priority: priority || 'NORMAL',
          deadline: deadline ? new Date(deadline) : null,
          notes,
          is_stock: is_stock || false,
          status: 'PENDING'
        }
      });

      // Assigned user'ları toplamak için
      const assignedUserIds = [];

      // Her product için order item ve step'leri oluştur
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

          // Order Item oluştur (quantity burada saklanacak)
          await tx.orderItems.create({
            data: {
              Order_id: order.id,
              Product_id: BigInt(product_id),
              quantity: quantity || 1
            }
          });

          // Eğer customSteps varsa onları kullan, yoksa ProductSteps'ten şablon al
          if (customSteps && customSteps.length > 0) {
            // Manuel olarak düzenlenmiş step'leri kullan
            for (const customStep of customSteps) {
              // Assigned user kontrolü
              if (!customStep.assigned_user) {
                throw new Error(`${customStep.step_name} adımında sorumlu kullanıcı seçilmedi. Tüm adımlar için sorumlu kullanıcı seçilmelidir.`);
              }

              await tx.orderSteps.create({
                data: {
                  Order_id: order.id,
                  Product_id: BigInt(product_id),
                  step_name: customStep.step_name,
                  step_description: customStep.step_description || null,
                  step_number: customStep.step_number,
                  assigned_user: BigInt(customStep.assigned_user),
                  status: 'WAITING'
                }
              });

              // Assigned user'ı listeye ekle
              assignedUserIds.push(customStep.assigned_user);
            }
          } else {
            // ProductSteps'ten şablon olarak al
            const productSteps = await tx.productSteps.findMany({
              where: { Product_id: BigInt(product_id) },
              orderBy: { Step_number: 'asc' }
            });

            // Her step için order step oluştur (şablon olarak)
            for (const step of productSteps) {
              // ProductSteps'ten gelen step'lerde Responsible_User kontrolü
              if (!step.Responsible_User) {
                throw new Error(`${step.Name} adımında sorumlu kullanıcı tanımlanmamış. Lütfen ürün adımlarını kontrol edin.`);
              }

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

              // Assigned user'ı listeye ekle
              assignedUserIds.push(step.Responsible_User.toString());
            }
          }
        }
      }

      // En az bir assigned user olmalı
      if (assignedUserIds.length === 0) {
        throw new Error('Sipariş oluşturmak için en az bir adımda sorumlu kullanıcı seçilmelidir.');
      }

      return { order, assignedUserIds };
    });

    // Sipariş başarıyla oluşturulduktan sonra bildirim gönder
    try {
      // 1. Yöneticilere sipariş oluşturuldu bildirimi
      const managementNotifications = await notificationService.notifyOrderResponsibles({
        orderId: result.order.id,
        orderNumber: orderNumber,
        customerName: customerName,
        companyId: BigInt(company_id),
        isStock: is_stock || false
      });
      
      // 2. Sorumlu kullanıcılara iş atandı bildirimi
      const assignedNotifications = await notificationService.notifyAssignedUsers({
        orderId: result.order.id,
        orderNumber: orderNumber,
        assignedUserIds: result.assignedUserIds,
        customerName: customerName,
        isStock: is_stock || false
      });
      
      console.log(`Order ${orderNumber} created successfully. Management notifications: ${managementNotifications}, Task notifications: ${assignedNotifications}.`);
    } catch (notificationError) {
      // Bildirim hatası sipariş oluşturmayı engellemez, sadece log'la
      console.error('Failed to send order notifications:', notificationError);
    }

    res.status(201).json({
      message: 'Sipariş başarıyla oluşturuldu.',
      order: {
        ...result.order,
        id: result.order.id.toString(),
        Customer_id: result.order.Customer_id ? result.order.Customer_id.toString() : null,
        Company_id: result.order.Company_id.toString()
      }
    });
  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    
    // Özel hata mesajlarını frontend'e gönder
    if (error.message.includes('Ürün bulunamadı')) {
      res.status(404).json({ message: error.message });
    } else if (error.message.includes('sorumlu kullanıcı seçilmedi') || 
               error.message.includes('sorumlu kullanıcı tanımlanmamış')) {
      res.status(400).json({ message: error.message });
    } else if (error.message.includes('Kullanıcı limiti aşıldı')) {
      res.status(400).json({ message: error.message });
    } else if (error.message.includes('en az bir adımda sorumlu kullanıcı seçilmelidir')) {
      res.status(400).json({ message: error.message });
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
    // Prisma client kontrolü
    checkPrismaClient(prisma);

    const company_id = req.user.company_id;
    const user_id = req.user.id;
    const is_SuperAdmin = req.user.is_SuperAdmin;
    const { status, customer_id, search, page = 1, limit = 10 } = req.query;

    let whereClause = {
      Company_id: BigInt(company_id)
    };

    // SuperAdmin değilse yetki kontrolü yap
    if (!is_SuperAdmin) {
      // Kullanıcının ORDER_READ yetkisi var mı kontrol et
      const orderReadPermission = await prisma.users_Permissions.findFirst({
        where: {
          User_id: BigInt(user_id),
          permission: {
            Name: 'ORDER_READ'
          }
        },
        include: {
          permission: true
        }
      });

      if (!orderReadPermission) {
        // ORDER_READ yetkisi yoksa sadece kendisine atanan adımları görebilir
        const assignedOrderIds = await prisma.orderSteps.findMany({
          where: {
            assigned_user: BigInt(user_id)
          },
          select: {
            Order_id: true
          }
        });

        const orderIds = [...new Set(assignedOrderIds.map(step => step.Order_id))];
        
        if (orderIds.length === 0) {
          return res.json({
            message: 'Size atanmış sipariş bulunmuyor.',
            orders: [],
            pagination: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0 }
          });
        }

        whereClause.id = {
          in: orderIds
        };
      }
    }

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
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true }
            }
          }
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
      Customer_id: order.Customer_id ? order.Customer_id.toString() : null,
      Company_id: order.Company_id.toString(),
      customer: {
        ...order.customer,
        id: order.customer?.id ? order.customer.id.toString() : null
      },
      orderItems: order.orderItems.map(item => ({
        ...item,
        id: item.id.toString(),
        Order_id: item.Order_id.toString(),
        Product_id: item.Product_id.toString(),
        product: {
          ...item.product,
          id: item.product.id.toString()
        }
      })),
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
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, description: true }
            }
          }
        },
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
      Customer_id: order.Customer_id ? order.Customer_id.toString() : null,
      Company_id: order.Company_id.toString(),
      customer: {
        ...order.customer,
        id: order.customer?.id ? order.customer.id.toString() : null,
        Company_Id: order.customer?.Company_Id ? order.customer.Company_Id.toString() : null
      },
      orderItems: order.orderItems.map(item => ({
        ...item,
        id: item.id.toString(),
        Order_id: item.Order_id.toString(),
        Product_id: item.Product_id.toString(),
        product: {
          ...item.product,
          id: item.product.id.toString()
        }
      })),
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
        } : null,
        notes: step.notes || null
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
    const { Customer_id, priority, deadline, notes, status, is_stock } = req.body;
    const company_id = req.user.company_id;

    // Sipariş var mı ve aynı şirkette mi kontrol et
    const existingOrder = await prisma.orders.findFirst({
      where: {
        id: BigInt(id),
        Company_id: BigInt(company_id)
      },
      include: {
        customer: {
          select: { Name: true }
        }
      }
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Sipariş bulunamadı.' });
    }

    // Müşteri kontrolü (eğer değiştirilecekse)
    let customerName = existingOrder.customer?.Name || null;
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
      customerName = customer.Name;
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: BigInt(id) },
      data: {
        ...(Customer_id && { Customer_id: BigInt(Customer_id) }),
        ...(priority && { priority }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
        ...(is_stock !== undefined && { is_stock }),
        updated_at: new Date()
      }
    });

    // Durum değişikliği varsa bildirim gönder
    if (status && status !== existingOrder.status) {
      try {
        const notificationsSent = await notificationService.notifyOrderStatusChange({
          orderId: BigInt(id),
          orderNumber: existingOrder.order_number,
          oldStatus: existingOrder.status,
          newStatus: status,
          companyId: BigInt(company_id),
          customerName: customerName
        });
        
        console.log(`Order ${existingOrder.order_number} status changed from ${existingOrder.status} to ${status}. Notifications sent to ${notificationsSent} users.`);
      } catch (notificationError) {
        // Bildirim hatası sipariş güncellemeyi engellemez, sadece log'la
        console.error('Failed to send order status change notifications:', notificationError);
      }
    }

    res.json({
      message: 'Sipariş başarıyla güncellendi.',
      order: {
        ...updatedOrder,
        id: updatedOrder.id.toString(),
        Customer_id: updatedOrder.Customer_id ? updatedOrder.Customer_id.toString() : null,
        Company_id: updatedOrder.Company_id ? updatedOrder.Company_id.toString() : null
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