const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Müşteri oluşturma
const createCustomer = async (req, res) => {
  try {
    const { Name, Company_Id, Created_At } = req.body;
    const company_id = req.user.company_id;

    if (!Name) {
      return res.status(400).json({ message: 'Müşteri adı gerekli.' });
    }

    // Aynı şirkette aynı isimde müşteri var mı kontrol et
    const existingCustomer = await prisma.customers.findFirst({
      where: {
        Name: Name,
        Company_Id: BigInt(company_id)
      }
    });

    if (existingCustomer) {
      return res.status(400).json({ message: 'Bu isimde bir müşteri zaten mevcut.' });
    }

    const customer = await prisma.customers.create({
      data: {
        Name,
        Company_Id: BigInt(company_id),
        Created_At: Created_At ? new Date(Created_At) : new Date()
      }
    });

    res.status(201).json({
      message: 'Müşteri başarıyla oluşturuldu.',
      customer: {
        ...customer,
        id: customer.id.toString(),
        Company_Id: customer.Company_Id.toString()
      }
    });
  } catch (error) {
    console.error('Müşteri oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Müşterileri listeleme
const getCustomers = async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const { search } = req.query;

    let whereClause = {
      Company_Id: BigInt(company_id)
    };

    // Arama filtresi
    if (search) {
      whereClause.Name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const customers = await prisma.customers.findMany({
      where: whereClause,
      orderBy: {
        Name: 'asc'
      }
    });

    const formattedCustomers = customers.map(customer => ({
      ...customer,
      id: customer.id.toString(),
      Company_Id: customer.Company_Id.toString()
    }));

    res.json({
      message: 'Müşteriler başarıyla getirildi.',
      customers: formattedCustomers
    });
  } catch (error) {
    console.error('Müşterileri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Tek müşteri getirme
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    const customer = await prisma.customers.findFirst({
      where: {
        id: BigInt(id),
        Company_Id: BigInt(company_id)
      }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı.' });
    }

    const formattedCustomer = {
      ...customer,
      id: customer.id.toString(),
      Company_Id: customer.Company_Id.toString()
    };

    res.json({
      message: 'Müşteri başarıyla getirildi.',
      customer: formattedCustomer
    });
  } catch (error) {
    console.error('Müşteri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Müşteri güncelleme
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name } = req.body;
    const company_id = req.user.company_id;

    if (!Name) {
      return res.status(400).json({ message: 'Müşteri adı gerekli.' });
    }

    // Müşteri var mı ve aynı şirkette mi kontrol et
    const existingCustomer = await prisma.customers.findFirst({
      where: {
        id: BigInt(id),
        Company_Id: BigInt(company_id)
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı.' });
    }

    // Aynı şirkette aynı isimde başka müşteri var mı kontrol et
    const duplicateCustomer = await prisma.customers.findFirst({
      where: {
        Name: Name,
        Company_Id: BigInt(company_id),
        id: { not: BigInt(id) }
      }
    });

    if (duplicateCustomer) {
      return res.status(400).json({ message: 'Bu isimde başka bir müşteri zaten mevcut.' });
    }

    const customer = await prisma.customers.update({
      where: {
        id: BigInt(id)
      },
      data: {
        Name
      }
    });

    res.json({
      message: 'Müşteri başarıyla güncellendi.',
      customer: {
        ...customer,
        id: customer.id.toString(),
        Company_Id: customer.Company_Id.toString()
      }
    });
  } catch (error) {
    console.error('Müşteri güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// Müşteri silme
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    // Müşteri var mı ve aynı şirkette mi kontrol et
    const existingCustomer = await prisma.customers.findFirst({
      where: {
        id: BigInt(id),
        Company_Id: BigInt(company_id)
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı.' });
    }

    await prisma.customers.delete({
      where: {
        id: BigInt(id)
      }
    });

    res.json({
      message: 'Müşteri başarıyla silindi.'
    });
  } catch (error) {
    console.error('Müşteri silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
}; 