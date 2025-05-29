const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Çalışanın kendi işlerini getirme (sırası gelenler ve gelecek işler)
const getMyJobs = async (req, res) => {
  try {
    const user_id = req.user.id;
    const company_id = req.user.company_id;

    // Kullanıcının atandığı tüm step'leri getir
    const mySteps = await prisma.orderSteps.findMany({
      where: {
        assigned_user: BigInt(user_id),
        order: {
          Company_id: BigInt(company_id),
          status: {
            in: ['PENDING', 'IN_PROGRESS'] // Sadece aktif siparişler
          }
        }
      },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            status: true,
            priority: true,
            deadline: true,
            customer: {
              select: { id: true, Name: true }
            }
          }
        },
        product: {
          select: { id: true, name: true, description: true }
        }
      },
      orderBy: [
        { order: { priority: 'desc' } }, // Önce öncelik
        { order: { deadline: 'asc' } },  // Sonra deadline
        { step_number: 'asc' }           // Sonra step sırası
      ]
    });

    // Her order için önceki step'lerin durumunu kontrol et
    const jobsWithStatus = await Promise.all(
      mySteps.map(async (step) => {
        // Bu step'ten önceki step'leri kontrol et
        const previousSteps = await prisma.orderSteps.findMany({
          where: {
            Order_id: step.Order_id,
            Product_id: step.Product_id,
            step_number: { lt: step.step_number }
          },
          orderBy: { step_number: 'asc' }
        });

        // Tüm önceki step'ler tamamlandı mı?
        const allPreviousCompleted = previousSteps.every(
          prevStep => prevStep.status === 'COMPLETED' || prevStep.status === 'SKIPPED'
        );

        // Bu step'in sırası geldi mi?
        const isMyTurn = allPreviousCompleted;

        return {
          ...step,
          id: step.id.toString(),
          Order_id: step.Order_id.toString(),
          Product_id: step.Product_id.toString(),
          assigned_user: step.assigned_user.toString(),
          isMyTurn,
          previousStepsCompleted: allPreviousCompleted,
          order: {
            ...step.order,
            id: step.order.id.toString(),
            customer: {
              ...step.order.customer,
              id: step.order.customer.id.toString()
            }
          },
          product: {
            ...step.product,
            id: step.product.id.toString()
          }
        };
      })
    );

    // Sırası gelenler ve gelecek işler olarak ayır
    const currentJobs = jobsWithStatus.filter(job => 
      job.isMyTurn && job.status === 'WAITING'
    );

    const upcomingJobs = jobsWithStatus.filter(job => 
      !job.isMyTurn && job.status === 'WAITING'
    );

    const inProgressJobs = jobsWithStatus.filter(job => 
      job.status === 'IN_PROGRESS'
    );

    const completedJobs = jobsWithStatus.filter(job => 
      job.status === 'COMPLETED'
    );

    res.json({
      message: 'İşlerim başarıyla getirildi.',
      jobs: {
        current: currentJobs,        // Sırası gelmiş, yapılabilir işler
        inProgress: inProgressJobs,  // Devam eden işler
        upcoming: upcomingJobs,      // Gelecek işler (sırası henüz gelmemiş)
        completed: completedJobs     // Tamamlanan işler
      },
      summary: {
        total: jobsWithStatus.length,
        current: currentJobs.length,
        inProgress: inProgressJobs.length,
        upcoming: upcomingJobs.length,
        completed: completedJobs.length
      }
    });
  } catch (error) {
    console.error('İşleri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Belirli bir job'ın detayını getirme
const getMyJobDetail = async (req, res) => {
  try {
    const { stepId } = req.params;
    const user_id = req.user.id;
    const company_id = req.user.company_id;

    const jobDetail = await prisma.orderSteps.findFirst({
      where: {
        id: BigInt(stepId),
        assigned_user: BigInt(user_id),
        order: {
          Company_id: BigInt(company_id)
        }
      },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        product: true
      }
    });

    if (!jobDetail) {
      return res.status(404).json({ message: 'İş bulunamadı veya size atanmamış.' });
    }

    // Önceki step'lerin durumunu kontrol et
    const previousSteps = await prisma.orderSteps.findMany({
      where: {
        Order_id: jobDetail.Order_id,
        Product_id: jobDetail.Product_id,
        step_number: { lt: jobDetail.step_number }
      },
      include: {
        assignedUser: {
          select: { id: true, Name: true }
        }
      },
      orderBy: { step_number: 'asc' }
    });

    const allPreviousCompleted = previousSteps.every(
      step => step.status === 'COMPLETED' || step.status === 'SKIPPED'
    );

    const formattedJob = {
      ...jobDetail,
      id: jobDetail.id.toString(),
      Order_id: jobDetail.Order_id.toString(),
      Product_id: jobDetail.Product_id.toString(),
      assigned_user: jobDetail.assigned_user.toString(),
      isMyTurn: allPreviousCompleted,
      order: {
        ...jobDetail.order,
        id: jobDetail.order.id.toString(),
        Customer_id: jobDetail.order.Customer_id.toString(),
        Company_id: jobDetail.order.Company_id.toString(),
        customer: {
          ...jobDetail.order.customer,
          id: jobDetail.order.customer.id.toString(),
          Company_Id: jobDetail.order.customer.Company_Id.toString()
        }
      },
      product: {
        ...jobDetail.product,
        id: jobDetail.product.id.toString(),
        Category_id: jobDetail.product.Category_id.toString(),
        Company_id: jobDetail.product.Company_id.toString()
      },
      previousSteps: previousSteps.map(step => ({
        ...step,
        id: step.id.toString(),
        Order_id: step.Order_id.toString(),
        Product_id: step.Product_id.toString(),
        assigned_user: step.assigned_user?.toString(),
        assignedUser: step.assignedUser ? {
          ...step.assignedUser,
          id: step.assignedUser.id.toString()
        } : null
      }))
    };

    res.json({
      message: 'İş detayı başarıyla getirildi.',
      job: formattedJob
    });
  } catch (error) {
    console.error('İş detayı getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Job'ı başlatma
const startMyJob = async (req, res) => {
  try {
    const { stepId } = req.params;
    const user_id = req.user.id;
    const company_id = req.user.company_id;

    // Step'in kullanıcıya ait olduğunu ve sırasının geldiğini kontrol et
    const step = await prisma.orderSteps.findFirst({
      where: {
        id: BigInt(stepId),
        assigned_user: BigInt(user_id),
        status: 'WAITING',
        order: {
          Company_id: BigInt(company_id),
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      }
    });

    if (!step) {
      return res.status(404).json({ message: 'İş bulunamadı veya başlatılamaz.' });
    }

    // Önceki step'lerin tamamlandığını kontrol et
    const previousSteps = await prisma.orderSteps.findMany({
      where: {
        Order_id: step.Order_id,
        Product_id: step.Product_id,
        step_number: { lt: step.step_number }
      }
    });

    const allPreviousCompleted = previousSteps.every(
      prevStep => prevStep.status === 'COMPLETED' || prevStep.status === 'SKIPPED'
    );

    if (!allPreviousCompleted) {
      return res.status(400).json({ message: 'Önceki adımlar henüz tamamlanmamış.' });
    }

    // Step'i başlat
    const updatedStep = await prisma.orderSteps.update({
      where: { id: BigInt(stepId) },
      data: {
        status: 'IN_PROGRESS',
        started_at: new Date(),
        updated_at: new Date()
      }
    });

    // Sipariş status'ünü güncelle
    await prisma.orders.update({
      where: { id: step.Order_id },
      data: { status: 'IN_PROGRESS' }
    });

    res.json({
      message: 'İş başarıyla başlatıldı.',
      step: {
        ...updatedStep,
        id: updatedStep.id.toString(),
        Order_id: updatedStep.Order_id.toString(),
        Product_id: updatedStep.Product_id.toString(),
        assigned_user: updatedStep.assigned_user?.toString()
      }
    });
  } catch (error) {
    console.error('İş başlatma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Job'ı tamamlama
const completeMyJob = async (req, res) => {
  try {
    const { stepId } = req.params;
    const { notes } = req.body;
    const user_id = req.user.id;
    const company_id = req.user.company_id;

    // Step'in kullanıcıya ait olduğunu ve devam ettiğini kontrol et
    const step = await prisma.orderSteps.findFirst({
      where: {
        id: BigInt(stepId),
        assigned_user: BigInt(user_id),
        status: 'IN_PROGRESS',
        order: {
          Company_id: BigInt(company_id)
        }
      }
    });

    if (!step) {
      return res.status(404).json({ message: 'İş bulunamadı veya tamamlanamaz.' });
    }

    // Step'i tamamla
    const updatedStep = await prisma.orderSteps.update({
      where: { id: BigInt(stepId) },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        notes: notes || step.notes,
        updated_at: new Date()
      }
    });

    // Bu order'ın tüm step'leri tamamlandı mı kontrol et
    const allOrderSteps = await prisma.orderSteps.findMany({
      where: { Order_id: step.Order_id }
    });

    const allCompleted = allOrderSteps.every(
      orderStep => orderStep.status === 'COMPLETED' || orderStep.status === 'SKIPPED'
    );

    // Eğer tüm step'ler tamamlandıysa siparişi tamamla
    if (allCompleted) {
      await prisma.orders.update({
        where: { id: step.Order_id },
        data: { status: 'COMPLETED' }
      });
    }

    res.json({
      message: 'İş başarıyla tamamlandı.',
      step: {
        ...updatedStep,
        id: updatedStep.id.toString(),
        Order_id: updatedStep.Order_id.toString(),
        Product_id: updatedStep.Product_id.toString(),
        assigned_user: updatedStep.assigned_user?.toString()
      },
      orderCompleted: allCompleted
    });
  } catch (error) {
    console.error('İş tamamlama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Job'a not ekleme/güncelleme
const updateMyJobNotes = async (req, res) => {
  try {
    const { stepId } = req.params;
    const { notes } = req.body;
    const user_id = req.user.id;
    const company_id = req.user.company_id;

    // Step'in kullanıcıya ait olduğunu kontrol et
    const step = await prisma.orderSteps.findFirst({
      where: {
        id: BigInt(stepId),
        assigned_user: BigInt(user_id),
        order: {
          Company_id: BigInt(company_id)
        }
      }
    });

    if (!step) {
      return res.status(404).json({ message: 'İş bulunamadı.' });
    }

    const updatedStep = await prisma.orderSteps.update({
      where: { id: BigInt(stepId) },
      data: {
        notes,
        updated_at: new Date()
      }
    });

    res.json({
      message: 'Not başarıyla güncellendi.',
      step: {
        ...updatedStep,
        id: updatedStep.id.toString(),
        Order_id: updatedStep.Order_id.toString(),
        Product_id: updatedStep.Product_id.toString(),
        assigned_user: updatedStep.assigned_user?.toString()
      }
    });
  } catch (error) {
    console.error('Not güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  getMyJobs,
  getMyJobDetail,
  startMyJob,
  completeMyJob,
  updateMyJobNotes
}; 