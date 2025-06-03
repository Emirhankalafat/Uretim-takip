const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = 'emirhankalafayazilim@gmail.com';
  const password = 'kalafat19072001Ss';
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.systemAdmin.findUnique({ where: { email } });
  if (existing) {
    console.log('SystemAdmin already exists.');
    process.exit(0);
  }

  await prisma.systemAdmin.create({
    data: {
      email,
      passwordHash,
      isActive: true
    }
  });
  console.log('SystemAdmin created successfully.');
  process.exit(0);
}

seedAdmin().catch(e => {
  console.error(e);
  process.exit(1);
}); 