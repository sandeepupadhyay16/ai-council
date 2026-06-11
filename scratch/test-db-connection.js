const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/ai_council_platform?schema=public&connection_limit=15";
  console.log("Connecting using:", connectionString);
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Querying count...");
    const count = await prisma.project.count();
    console.log("Projects count:", count);
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
