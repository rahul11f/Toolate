const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all tables...');
  
  // Get all tables in public schema
  const result = await prisma.$queryRaw`
    SELECT tablename 
    FROM pg_catalog.pg_tables 
    WHERE schemaname = 'public';
  `;

  const tables = result.map(row => row.tablename);
  console.log(`Found ${tables.length} tables:`, tables);

  for (const table of tables) {
    if (table === '_prisma_migrations') continue;

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`✅ RLS enabled on table: ${table}`);
      
      try {
        await prisma.$executeRawUnsafe(`CREATE POLICY "Deny all external access" ON "${table}" FOR ALL TO public USING (false);`);
        console.log(`   - Added default deny policy for ${table}`);
      } catch (policyErr) {
        console.log(`   - Policy creation skipped or failed (might already exist): ${policyErr.message}`);
      }
    } catch (e) {
      console.error(`❌ Failed to enable RLS on ${table}:`, e.message);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
