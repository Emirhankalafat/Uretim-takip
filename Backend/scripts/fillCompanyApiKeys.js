const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

async function fillMissingApiKeys() {
  try {
    // Get all companies without API keys
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { api_key: null },
          { api_key: '' }
        ]
      }
    });

    console.log(`Found ${companies.length} companies without API keys`);

    // Update each company with a new API key
    for (const company of companies) {
      const apiKey = generateApiKey();
      await prisma.company.update({
        where: { id: company.id },
        data: { api_key: apiKey }
      });
      console.log(`Updated company ${company.Name} (ID: ${company.id}) with new API key`);
    }

    console.log('Finished updating companies with missing API keys');
  } catch (error) {
    console.error('Error updating companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillMissingApiKeys(); 