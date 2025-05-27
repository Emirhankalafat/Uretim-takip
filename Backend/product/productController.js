const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Ürün oluşturma
const createProduct = async (req, res) => {
  try {
    const { name, description, Category_id } = req.body;
    const company_id = req.user.company_id;

    if (!name || !Category_id) {
      return res.status(400).json({ message: 'Ürün adı ve kategori gerekli.' });
    }

    // Kategori var mı ve aynı şirkette mi kontrol et
    const category = await prisma.categories.findFirst({
      where: {
        id: BigInt(Category_id),
        Company_id: BigInt(company_id)
      }
    });

    if (!category) {
      return res.status(400).json({ message: 'Geçersiz kategori seçimi.' });
    }

    // Aynı şirkette aynı isimde ürün var mı kontrol et
    const existingProduct = await prisma.products.findFirst({
      where: {
        name: name,
        Company_id: BigInt(company_id)
      }
    });

    if (existingProduct) {
      return res.status(400).json({ message: 'Bu isimde bir ürün zaten mevcut.' });
    }

    const product = await prisma.products.create({
      data: {
        name,
        description: description || null,
        Category_id: BigInt(Category_id),
        Company_id: BigInt(company_id)
      },
      include: {
        category: {
          select: {
            id: true,
            Name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Ürün başarıyla oluşturuldu.',
      product: {
        ...product,
        id: product.id.toString(),
        Category_id: product.Category_id.toString(),
        Company_id: product.Company_id.toString(),
        category: {
          ...product.category,
          id: product.category.id.toString()
        }
      }
    });
  } catch (error) {
    console.error('Ürün oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Ürünleri listeleme
const getProducts = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { category_id, search } = req.query;

    let whereClause = {
      Company_id: BigInt(company_id)
    };

    // Kategori filtresi
    if (category_id) {
      whereClause.Category_id = BigInt(category_id);
    }

    // Arama filtresi
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.products.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            Name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedProducts = products.map(product => ({
      ...product,
      id: product.id.toString(),
      Category_id: product.Category_id.toString(),
      Company_id: product.Company_id.toString(),
      category: {
        ...product.category,
        id: product.category.id.toString()
      }
    }));

    res.json({
      message: 'Ürünler başarıyla getirildi.',
      products: formattedProducts
    });
  } catch (error) {
    console.error('Ürünleri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Tek ürün getirme
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    const product = await prisma.products.findFirst({
      where: {
        id: BigInt(id),
        Company_id: BigInt(company_id)
      },
      include: {
        category: {
          select: {
            id: true,
            Name: true,
            Description: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı.' });
    }

    const formattedProduct = {
      ...product,
      id: product.id.toString(),
      Category_id: product.Category_id.toString(),
      Company_id: product.Company_id.toString(),
      category: {
        ...product.category,
        id: product.category.id.toString()
      }
    };

    res.json({
      message: 'Ürün başarıyla getirildi.',
      product: formattedProduct
    });
  } catch (error) {
    console.error('Ürün getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Ürün güncelleme
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, Category_id } = req.body;
    const company_id = req.user.company_id;

    if (!name || !Category_id) {
      return res.status(400).json({ message: 'Ürün adı ve kategori gerekli.' });
    }

    // Ürün var mı ve aynı şirkette mi kontrol et
    const existingProduct = await prisma.products.findFirst({
      where: {
        id: BigInt(id),
        Company_id: BigInt(company_id)
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Ürün bulunamadı.' });
    }

    // Kategori var mı ve aynı şirkette mi kontrol et
    const category = await prisma.categories.findFirst({
      where: {
        id: BigInt(Category_id),
        Company_id: BigInt(company_id)
      }
    });

    if (!category) {
      return res.status(400).json({ message: 'Geçersiz kategori seçimi.' });
    }

    // Aynı isimde başka ürün var mı kontrol et
    const duplicateProduct = await prisma.products.findFirst({
      where: {
        name: name,
        Company_id: BigInt(company_id),
        NOT: {
          id: BigInt(id)
        }
      }
    });

    if (duplicateProduct) {
      return res.status(400).json({ message: 'Bu isimde bir ürün zaten mevcut.' });
    }

    const updatedProduct = await prisma.products.update({
      where: {
        id: BigInt(id)
      },
      data: {
        name,
        description: description || null,
        Category_id: BigInt(Category_id)
      },
      include: {
        category: {
          select: {
            id: true,
            Name: true
          }
        }
      }
    });

    res.json({
      message: 'Ürün başarıyla güncellendi.',
      product: {
        ...updatedProduct,
        id: updatedProduct.id.toString(),
        Category_id: updatedProduct.Category_id.toString(),
        Company_id: updatedProduct.Company_id.toString(),
        category: {
          ...updatedProduct.category,
          id: updatedProduct.category.id.toString()
        }
      }
    });
  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Ürün silme
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    // Ürün var mı ve aynı şirkette mi kontrol et
    const existingProduct = await prisma.products.findFirst({
      where: {
        id: BigInt(id),
        Company_id: BigInt(company_id)
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Ürün bulunamadı.' });
    }

    await prisma.products.delete({
      where: {
        id: BigInt(id)
      }
    });

    res.json({
      message: 'Ürün başarıyla silindi.'
    });
  } catch (error) {
    console.error('Ürün silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Kategoriye göre ürünleri getirme
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const company_id = req.user.company_id;

    // Kategori var mı ve aynı şirkette mi kontrol et
    const category = await prisma.categories.findFirst({
      where: {
        id: BigInt(categoryId),
        Company_id: BigInt(company_id)
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı.' });
    }

    const products = await prisma.products.findMany({
      where: {
        Category_id: BigInt(categoryId),
        Company_id: BigInt(company_id)
      },
      include: {
        category: {
          select: {
            id: true,
            Name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedProducts = products.map(product => ({
      ...product,
      id: product.id.toString(),
      Category_id: product.Category_id.toString(),
      Company_id: product.Company_id.toString(),
      category: {
        ...product.category,
        id: product.category.id.toString()
      }
    }));

    res.json({
      message: 'Kategoriye ait ürünler başarıyla getirildi.',
      products: formattedProducts,
      category: {
        ...category,
        id: category.id.toString(),
        Company_id: category.Company_id.toString()
      }
    });
  } catch (error) {
    console.error('Kategoriye göre ürün getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsByCategory
}; 