const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.setting.upsert({
    where: { key: 'module.ai_listing.active' },
    update: { value: 'true' },
    create: { key: 'module.ai_listing.active', value: 'true', label: 'AI Elan Köməkçisi' }
  });
  await prisma.setting.upsert({
    where: { key: 'module.agronomist.active' },
    update: { value: 'true' },
    create: { key: 'module.agronomist.active', value: 'true', label: 'AI Aqronom' }
  });
  console.log("Activated AI modules.");
}
main().catch(console.error).finally(() => prisma.());
