// Test API key oluşturmak için basit script
const { getPrismaClient } = require('../utils/prismaClient');
const crypto = require('crypto');

const prisma = getPrismaClient();

async function createTestApiKey() {
  try {
    // İlk şirketi bul
    const company = await prisma.company.findFirst();
    
    if (!company) {
      console.log("❌ Şirket bulunamadı!");
      return;
    }

    // API key yoksa oluştur
    if (!company.api_key) {
      const apiKey = crypto.randomUUID();
      
      await prisma.company.update({
        where: { id: company.id },
        data: { api_key: apiKey }
      });
      
      console.log("✅ API Key oluşturuldu:");
      console.log("Şirket:", company.Name);
      console.log("API Key:", apiKey);
    } else {
      console.log("✅ Mevcut API Key:");
      console.log("Şirket:", company.Name);
      console.log("API Key:", company.api_key);
    }

  } catch (error) {
    console.error("❌ Hata:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestApiKey();
