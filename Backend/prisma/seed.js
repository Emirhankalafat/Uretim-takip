import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.permissions.createMany({
    data: [
      { Name: 'CUSTOMER_READ', Type: 'CUSTOMER' },
      { Name: 'CUSTOMER_CREATE', Type: 'CUSTOMER' },
      { Name: 'CUSTOMER_UPDATE', Type: 'CUSTOMER' },
      { Name: 'CUSTOMER_DELETE', Type: 'CUSTOMER' },
      { Name: 'ORDER_CREATE', Type: 'ORDER' },
      { Name: 'ORDER_READ', Type: 'ORDER' },
      { Name: 'ORDER_UPDATE', Type: 'ORDER' },
      { Name: 'ORDER_DELETE', Type: 'ORDER' },
      { Name: 'MY_JOBS', Type: 'JOB' },
      { Name: 'USER_MANAGEMENT', Type: 'Admin' },
      { Name: 'CATEGORY_CREATE', Type: 'CATEGORY' },
      { Name: 'CATEGORY_READ', Type: 'CATEGORY' },
      { Name: 'CATEGORY_UPDATE', Type: 'CATEGORY' },
      { Name: 'CATEGORY_DELETE', Type: 'CATEGORY' },
      { Name: 'PRODUCT_CREATE', Type: 'PRODUCT' },
      { Name: 'PRODUCT_READ', Type: 'PRODUCT' },
      { Name: 'PRODUCT_UPDATE', Type: 'PRODUCT' },
      { Name: 'PRODUCT_DELETE', Type: 'PRODUCT' },
      { Name: 'PRODUCT_STEP_READ', Type: 'PRODUCT_STEP' },
      { Name: 'PRODUCT_STEP_CREATE', Type: 'PRODUCT_STEP' },
      { Name: 'PRODUCT_STEP_UPDATE', Type: 'PRODUCT_STEP' },
      { Name: 'PRODUCT_STEP_DELETE', Type: 'PRODUCT_STEP' },
      { Name: 'REPORT_READ', Type: 'REPORT' }
    ],
    skipDuplicates: true
  });

  console.log("✅ Permissions seeded.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
