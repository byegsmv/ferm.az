import { prisma } from "@/lib/prisma";

// The category dropdown only lists top-level (parent) categories, but every
// product is actually assigned to a leaf/child category (e.g. "Bal" under
// "Arıçılıq"). Filtering by the parent's slug directly (`category: { slug }`)
// therefore matched zero products even when matching items existed — this
// resolves a parent slug to itself + all its child slugs so the filter
// actually works. If the slug is already a child/leaf category (or has no
// children), it resolves to just that slug, unchanged.
export async function resolveCategorySlugs(slug) {
  if (!slug) return null;
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { 
      children: { 
        select: { 
          slug: true,
          children: { select: { slug: true } }
        } 
      } 
    },
  });
  if (!category) return [slug];
  
  const slugs = new Set([category.slug]);
  if (category.children && category.children.length) {
    for (const child of category.children) {
      slugs.add(child.slug);
      if (child.children && child.children.length) {
        for (const grandChild of child.children) {
          slugs.add(grandChild.slug);
        }
      }
    }
  }
  return Array.from(slugs);
}
