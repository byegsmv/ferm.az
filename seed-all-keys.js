// Seed all 192 translation keys into database
import { prisma } from './src/lib/prisma.js';
import seedData from './translation-keys-seed.json' assert { type: 'json' };

async function main() {
  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const item of seedData) {
    const existing = await prisma.siteText.findUnique({ where: { key: item.key } });
    
    if (existing) {
      // Update if valueAz differs (sync with latest fallback)
      if (existing.valueAz !== item.valueAz) {
        await prisma.siteText.update({
          where: { key: item.key },
          data: { valueAz: item.valueAz }
        });
        console.log(`🔄 Updated: ${item.key}`);
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    await prisma.siteText.create({
      data: {
        key: item.key,
        group: item.group,
        label: item.label,
        valueAz: item.valueAz,
        valueEn: item.valueEn,
        valueRu: item.valueRu,
        isActive: true,
      }
    });
    console.log(`✅ Created: ${item.key}`);
    created++;
  }

  console.log(`\n✅ Done! Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
