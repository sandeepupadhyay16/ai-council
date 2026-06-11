const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Querying projects...");
    const count = await prisma.project.count();
    console.log(`Projects count: ${count}`);

    console.log("Querying meetingIngestion...");
    const countIngest = await prisma.meetingIngestion.count();
    console.log(`MeetingIngestion count: ${countIngest}`);
  } catch (err) {
    console.error("Database test failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
