const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Kategori oluşturma
const createCategory = async (req, res) => {
  try {
    const { Name, Description } = req.body;
    const company_id = req.user.company_id;

    if (!Name) {
      return res.status(400).json({ message: 'Kategori adı gerekli.' });
    }

    // Aynı şirkette aynı isimde kategori var mı kontrol et
    const existingCategory = await prisma.categories.findFirst({
      where: {
        Name: Name,
        Company_id: BigInt(company_id)
      }
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Bu isimde bir kategori zaten mevcut.' });
    }

    const category = await prisma.categories.create({
      data: {
        Name,
        Description: Description || null,
        Company_id: BigInt(company_id)
      }
    });

    res.status(201).json({
      message: 'Kategori başarıyla oluşturuldu.',
      category: {
        ...category,
        id: category.id.toString(),
        Company_id: category.Company_id.toString()
      }
    });
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Kategorileri listeleme
const getCategories = async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const categories = await prisma.categories.findMany({
      where: {
        Company_id: BigInt(company_id)
      },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        Name: 'asc'
      }
    });

    const formattedCategories = categories.map(category => ({
      ...category,
      id: category.id.toString(),
      Company_id: category.Company_id.toString(),
      productCount: category._count.products
    }));

    res.json({
      message: 'Kategoriler başarıyla getirildi.',
      categories: formattedCategories
    });
  } catch (error) {
    console.error('Kategorileri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Tek kategori getirme
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    const category = await prisma.categories.findFirst({
      where: {
        id: BigInt(id),
        Company_id: BigInt(company_id)
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Kategori bulunamadı.' });
    }

    const formattedCategory = {
      ...category,
      id: category.id.toString(),
      Company_id: category.Company_id.toString(),
      products: category.products.map(product => ({
        ...product,
        id: product.id.toString()
      }))
    };

    res.json({
      message: 'Kategori başarıyla getirildi.',
      category: formattedCategory
    });
  } catch (error) {
    console.error('Kategori getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Kategori güncelleme
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, Description } = req.body;
    const company_id = req.user.company_id;

    if (!Name) {
      return res.status(400).json({ message: 'Kategori adı gerekli.' });
    }

    // Kategori var mı ve aynı şirkette mi kontrol et
    const existingCategory = await prisma.categories.findFirst({
      where: {
        id: BigInt(id),
        Company_id: BigInt(company_id)
      }
    });

    if (!existingCategory) {
      return res.status(404).json({ message: 'Kategori bulunamadı.' });
    }

    // Aynı isimde başka kategori var mı kontrol et
    const duplicateCategory = await prisma.categories.findFirst({
      where: {
        Name: Name,
        Company_id: BigInt(company_id),
        NOT: {
          id: BigInt(id)
        }
      }
    });

    if (duplicateCategory) {
      return res.status(400).json({ message: 'Bu isimde bir kategori zaten mevcut.' });
    }

    const updatedCategory = await prisma.categories.update({
      where: {
        id: BigInt(id)
      },
      data: {
        Name,
        Description: Description || null
      }
    });

    res.json({
      message: 'Kategori başarıyla güncellendi.',
      category: {
        ...updatedCategory,
        id: updatedCategory.id.toString(),
        Company_id: updatedCategory.Company_id.toString()
      }
    });
  } catch (error) {
    console.error('Kategori güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Kategori silme
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    // Kategori var mı ve aynı şirkette mi kontrol et
    const existingCategory = await prisma.categories.findFirst({
      where: {
        id: BigInt(id),
        Company_id: BigInt(company_id)
      },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!existingCategory) {
      return res.status(404).json({ message: 'Kategori bulunamadı.' });
    }

    // Kategoriye bağlı ürün var mı kontrol et
    if (existingCategory._count.products > 0) {
      return res.status(400).json({ 
        message: 'Bu kategoriye bağlı ürünler bulunuyor. Önce ürünleri silin veya başka kategoriye taşıyın.' 
      });
    }

    await prisma.categories.delete({
      where: {
        id: BigInt(id)
      }
    });

    res.json({
      message: 'Kategori başarıyla silindi.'
    });
  } catch (error) {
    console.error('Kategori silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
}; 