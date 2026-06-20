const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting manual enum to text migration...');

    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "menu_items" ALTER COLUMN "category" TYPE text USING "category"::text;`);
        console.log('Successfully altered menu_items.category to text.');
    } catch (e) {
        console.error('Error altering menu_items.category (might already be text):', e.message);
    }

    try {
        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "MenuCategory" CASCADE;`);
        console.log('Successfully dropped MenuCategory enum.');
    } catch (e) {
        console.error('Error dropping MenuCategory:', e.message);
    }

    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "bills" ALTER COLUMN "paymentMethod" TYPE text USING "paymentMethod"::text;`);
        console.log('Successfully altered bills.paymentMethod to text.');
    } catch (e) {
        console.error('Error altering bills.paymentMethod:', e.message);
    }

    try {
        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "PaymentMethod" CASCADE;`);
        console.log('Successfully dropped PaymentMethod enum.');
    } catch (e) {
        console.error('Error dropping PaymentMethod:', e.message);
    }

    console.log('Migration complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
