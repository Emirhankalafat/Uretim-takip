const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Product step oluşturma
const createProductStep = async (req, res) => {
  try {
    const { Name, Description, Product_id, Step_number, Responsible_User } = req.body;
    const company_id = req.user.company_id;

    if (!Name || !Product_id || !Step_number) {
      return res.status(400).json({ message: 'Adım adı, ürün ID ve adım numarası gerekli.' });
    }

    // Ürün var mı ve aynı şirkette mi kontrol et
    const product = await prisma.products.findFirst({
      where: {
        id: BigInt(Product_id),
        Company_id: BigInt(company_id)
      }
    });

    if (!product) {
      return res.status(400).json({ message: 'Geçersiz ürün seçimi.' });
    }

    // Sorumlu kullanıcı varsa aynı şirkette mi kontrol et
    if (Responsible_User) {
      const user = await prisma.user.findFirst({
        where: {
          id: BigInt(Responsible_User),
          company_id: BigInt(company_id)
        }
      });

      if (!user) {
        return res.status(400).json({ message: 'Geçersiz sorumlu kullanıcı seçimi.' });
      }
    }

    // Aynı ürün için aynı step numarası var mı kontrol et
    const existingStep = await prisma.productSteps.findFirst({
      where: {
        Product_id: BigInt(Product_id),
        Step_number: parseInt(Step_number)
      }
    });

    if (existingStep) {
      return res.status(400).json({ message: 'Bu ürün için bu adım numarası zaten mevcut.' });
    }

    const productStep = await prisma.productSteps.create({
      data: {
        Name,
        Description: Description || null,
        Product_id: BigInt(Product_id),
        Step_number: parseInt(Step_number),
        Responsible_User: Responsible_User ? BigInt(Responsible_User) : null
      },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        },
        responsible: {
          select: {
            id: true,
            Name: true,
            Mail: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Ürün adımı başarıyla oluşturuldu.',
      productStep: {
        ...productStep,
        id: productStep.id.toString(),
        Product_id: productStep.Product_id.toString(),
        Responsible_User: productStep.Responsible_User?.toString() || null,
        product: {
          ...productStep.product,
          id: productStep.product.id.toString()
        },
        responsible: productStep.responsible ? {
          ...productStep.responsible,
          id: productStep.responsible.id.toString()
        } : null
      }
    });
  } catch (error) {
    console.error('Ürün adımı oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Ürün adımlarını listeleme
const getProductSteps = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { product_id, search } = req.query;

    let whereClause = {
      product: {
        Company_id: BigInt(company_id)
      }
    };

    // Ürün filtresi
    if (product_id) {
      whereClause.Product_id = BigInt(product_id);
    }

    // Arama filtresi
    if (search) {
      whereClause.OR = [
        { Name: { contains: search, mode: 'insensitive' } },
        { Description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const productSteps = await prisma.productSteps.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        },
        responsible: {
          select: {
            id: true,
            Name: true,
            Mail: true
          }
        }
      },
      orderBy: [
        { Product_id: 'asc' },
        { Step_number: 'asc' }
      ]
    });

    const formattedSteps = productSteps.map(step => ({
      ...step,
      id: step.id.toString(),
      Product_id: step.Product_id.toString(),
      Responsible_User: step.Responsible_User?.toString() || null,
      product: {
        ...step.product,
        id: step.product.id.toString()
      },
      responsible: step.responsible ? {
        ...step.responsible,
        id: step.responsible.id.toString()
      } : null
    }));

    res.json({
      message: 'Ürün adımları başarıyla getirildi.',
      productSteps: formattedSteps
    });
  } catch (error) {
    console.error('Ürün adımlarını getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Belirli ürünün adımlarını getirme
const getStepsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const company_id = req.user.company_id;

    // Ürün var mı ve aynı şirkette mi kontrol et
    const product = await prisma.products.findFirst({
      where: {
        id: BigInt(productId),
        Company_id: BigInt(company_id)
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı.' });
    }

    const productSteps = await prisma.productSteps.findMany({
      where: {
        Product_id: BigInt(productId)
      },
      include: {
        responsible: {
          select: {
            id: true,
            Name: true,
            Mail: true
          }
        }
      },
      orderBy: {
        Step_number: 'asc'
      }
    });

    const formattedSteps = productSteps.map(step => ({
      ...step,
      id: step.id.toString(),
      Product_id: step.Product_id.toString(),
      Responsible_User: step.Responsible_User?.toString() || null,
      responsible: step.responsible ? {
        ...step.responsible,
        id: step.responsible.id.toString()
      } : null
    }));

    res.json({
      message: 'Ürün adımları başarıyla getirildi.',
      product: {
        ...product,
        id: product.id.toString(),
        Category_id: product.Category_id.toString(),
        Company_id: product.Company_id.toString()
      },
      productSteps: formattedSteps
    });
  } catch (error) {
    console.error('Ürün adımlarını getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Tek adım getirme
const getProductStepById = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    const productStep = await prisma.productSteps.findFirst({
      where: {
        id: BigInt(id),
        product: {
          Company_id: BigInt(company_id)
        }
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            Company_id: true
          }
        },
        responsible: {
          select: {
            id: true,
            Name: true,
            Mail: true
          }
        }
      }
    });

    if (!productStep) {
      return res.status(404).json({ message: 'Ürün adımı bulunamadı.' });
    }

    const formattedStep = {
      ...productStep,
      id: productStep.id.toString(),
      Product_id: productStep.Product_id.toString(),
      Responsible_User: productStep.Responsible_User?.toString() || null,
      product: {
        ...productStep.product,
        id: productStep.product.id.toString(),
        Company_id: productStep.product.Company_id.toString()
      },
      responsible: productStep.responsible ? {
        ...productStep.responsible,
        id: productStep.responsible.id.toString()
      } : null
    };

    res.json({
      message: 'Ürün adımı başarıyla getirildi.',
      productStep: formattedStep
    });
  } catch (error) {
    console.error('Ürün adımı getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Adım güncelleme
const updateProductStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, Description, Step_number, Responsible_User } = req.body;
    const company_id = req.user.company_id;

    if (!Name || !Step_number) {
      return res.status(400).json({ message: 'Adım adı ve adım numarası gerekli.' });
    }

    // Adım var mı ve aynı şirkette mi kontrol et
    const existingStep = await prisma.productSteps.findFirst({
      where: {
        id: BigInt(id),
        product: {
          Company_id: BigInt(company_id)
        }
      },
      include: {
        product: true
      }
    });

    if (!existingStep) {
      return res.status(404).json({ message: 'Ürün adımı bulunamadı.' });
    }

    // Sorumlu kullanıcı varsa aynı şirkette mi kontrol et
    if (Responsible_User) {
      const user = await prisma.user.findFirst({
        where: {
          id: BigInt(Responsible_User),
          company_id: BigInt(company_id)
        }
      });

      if (!user) {
        return res.status(400).json({ message: 'Geçersiz sorumlu kullanıcı seçimi.' });
      }
    }

    // Aynı ürün için aynı step numarası var mı kontrol et (kendisi hariç)
    const duplicateStep = await prisma.productSteps.findFirst({
      where: {
        Product_id: existingStep.Product_id,
        Step_number: parseInt(Step_number),
        NOT: {
          id: BigInt(id)
        }
      }
    });

    if (duplicateStep) {
      return res.status(400).json({ message: 'Bu ürün için bu adım numarası zaten mevcut.' });
    }

    const updatedStep = await prisma.productSteps.update({
      where: {
        id: BigInt(id)
      },
      data: {
        Name,
        Description: Description || null,
        Step_number: parseInt(Step_number),
        Responsible_User: Responsible_User ? BigInt(Responsible_User) : null
      },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        },
        responsible: {
          select: {
            id: true,
            Name: true,
            Mail: true
          }
        }
      }
    });

    res.json({
      message: 'Ürün adımı başarıyla güncellendi.',
      productStep: {
        ...updatedStep,
        id: updatedStep.id.toString(),
        Product_id: updatedStep.Product_id.toString(),
        Responsible_User: updatedStep.Responsible_User?.toString() || null,
        product: {
          ...updatedStep.product,
          id: updatedStep.product.id.toString()
        },
        responsible: updatedStep.responsible ? {
          ...updatedStep.responsible,
          id: updatedStep.responsible.id.toString()
        } : null
      }
    });
  } catch (error) {
    console.error('Ürün adımı güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Adım silme
const deleteProductStep = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    // Adım var mı ve aynı şirkette mi kontrol et
    const existingStep = await prisma.productSteps.findFirst({
      where: {
        id: BigInt(id),
        product: {
          Company_id: BigInt(company_id)
        }
      }
    });

    if (!existingStep) {
      return res.status(404).json({ message: 'Ürün adımı bulunamadı.' });
    }

    await prisma.productSteps.delete({
      where: {
        id: BigInt(id)
      }
    });

    res.json({
      message: 'Ürün adımı başarıyla silindi.'
    });
  } catch (error) {
    console.error('Ürün adımı silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Adım sırasını güncelleme (bulk update)
const reorderProductSteps = async (req, res) => {
  try {
    const { productId } = req.params;
    const { steps } = req.body; // [{ id, step_number }, ...]
    const company_id = req.user.company_id;

    if (!steps || !Array.isArray(steps)) {
      return res.status(400).json({ message: 'Geçerli adım listesi gerekli.' });
    }

    // Ürün var mı ve aynı şirkette mi kontrol et
    const product = await prisma.products.findFirst({
      where: {
        id: BigInt(productId),
        Company_id: BigInt(company_id)
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı.' });
    }

    // Transaction ile tüm adımları güncelle
    await prisma.$transaction(async (tx) => {
      // 1. Önce tüm step numaralarını geçici değerlere çevir (unique constraint'i bypass etmek için)
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await tx.productSteps.update({
          where: {
            id: BigInt(step.id)
          },
          data: {
            Step_number: -(i + 1) // Negatif değerler kullan (geçici)
          }
        });
      }

      // 2. Sonra gerçek step numaralarını ata
      for (const step of steps) {
        await tx.productSteps.update({
          where: {
            id: BigInt(step.id)
          },
          data: {
            Step_number: parseInt(step.step_number)
          }
        });
      }
    });

    res.json({
      message: 'Adım sıralaması başarıyla güncellendi.'
    });
  } catch (error) {
    console.error('Adım sıralama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  createProductStep,
  getProductSteps,
  getStepsByProduct,
  getProductStepById,
  updateProductStep,
  deleteProductStep,
  reorderProductSteps
}; 