import { prisma } from "@/lib/prisma";

export async function extractAndSaveKeywords(product) {
  try {
    const words = new Set();
    
    // 1. Extract from title
    if (product.titleAz) {
      product.titleAz.toLowerCase().split(/[\s,.-]+/).forEach(w => {
        if (w.length > 2) words.add(w);
      });
    }

    // 2. Extract from tags
    if (product.tags && Array.isArray(product.tags)) {
      product.tags.forEach(t => words.add(t.toLowerCase().trim()));
    }

    // 3. Extract from category if available
    if (product.category && product.category.nameAz) {
      product.category.nameAz.toLowerCase().split(/[\s,.-]+/).forEach(w => {
        if (w.length > 2) words.add(w);
      });
    }

    const uniqueWords = Array.from(words).filter(w => w.length > 0);

    // 4. Upsert into database
    for (const word of uniqueWords) {
      await prisma.searchKeyword.upsert({
        where: { word },
        update: { searchCount: { increment: 1 } },
        create: { word, searchCount: 1 },
      });
    }
  } catch (error) {
    console.error("Failed to extract keywords:", error);
  }
}
