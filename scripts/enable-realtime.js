const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Enabling realtime...');
    await prisma.$executeRawUnsafe('ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";');
    console.log('Done');
  } catch(e) {
    if(e.message && e.message.includes('publication "supabase_realtime" does not exist')) {
      await prisma.$executeRawUnsafe('CREATE PUBLICATION supabase_realtime FOR TABLE "Notification";');
      console.log('Created and added');
    } else {
      console.log(e.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}
main();
