import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { productUpdateSchema } from "@/lib/validators";
import { extractAndSaveKeywords } from "@/lib/keywords";
import { notifyProductReviewed } from "@/lib/email";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: true,
        store: true,
        seller: { select: { id: true, fullName: true, phone: true } },
      },
    });

    // Allow admins to view any product; public only sees ACTIVE
    const authUser = getAuthUser(request);
    const isAdmin = authUser && ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role);
    const isOwner = authUser && product && product.sellerId === authUser.sub;

    if (!product || (!isAdmin && !isOwner && product.status !== "ACTIVE")) {
      return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });
    }

    // Fire-and-forget view counter (non-blocking correctness not required here)
    if (product.id) {
      prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    }

    return Response.json({ product });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return Response.json({ error: "Server xətası" }, { status: 500 });
  }
}

// Statuses a non-admin owner is allowed to move between WITHOUT going back
// through admin review (pure visibility toggles, no content risk).
const OWNER_SELF_TOGGLE_STATUSES = ["ACTIVE", "SOLD", "EXPIRED"];

export async function PATCH(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!product) {
      return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });
    }

    const productId = product.id;
    const isOwner = product.sellerId === authUser.sub;
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role);
    if (!isOwner && !isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
    }

    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { images, status, isCorporate, minOrderQty, ...contentData } = parsed.data;
    const hasContentChanges = Object.keys(contentData).length > 0;
    // isCorporate + minOrderQty are admin/owner toggles — never trigger re-review
    const corpData = {};
    if (isCorporate !== undefined) corpData.isCorporate = isCorporate;
    if (minOrderQty !== undefined) corpData.minOrderQty = minOrderQty;

    let finalData;

    if (isAdmin) {
      // Admins can set any status and edit any content freely, no restrictions.
      finalData = { ...contentData, ...corpData, ...(status ? { status } : {}) };
    } else if (hasContentChanges) {
      // Owner changed actual listing content (title/price/description/etc) —
      // force back to review to prevent bait-and-switch, regardless of any
      // status they tried to send.
      finalData = { ...contentData, ...corpData, status: "PENDING_REVIEW" };
    } else if (status) {
      // Owner sent a pure status change (no content fields).
      const fromApprovedState = OWNER_SELF_TOGGLE_STATUSES.includes(product.status);
      const toAllowedState = OWNER_SELF_TOGGLE_STATUSES.includes(status);
      if (!fromApprovedState || !toAllowedState) {
        return Response.json(
          {
            error:
              "Bu status dəyişikliyi üçün admin təsdiqi lazımdır. Siz yalnız Aktiv, Satıldı və Bitib arasında keçid edə bilərsiniz.",
          },
          { status: 403 }
        );
      }
      finalData = { ...corpData, status };
    } else {
      finalData = corpData;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.product.update({
        where: { id: productId },
        data: finalData,
      });
      // Replace the image set if the caller sent a new `images` array (owner or admin editing photos).
      if (images) {
        await tx.productImage.deleteMany({ where: { productId } });
        if (images.length) {
          await tx.productImage.createMany({
            data: images.map((img, idx) => ({
              productId,
              url: img.url,
              altText: img.altText,
              sortOrder: idx,
            })),
          });
        }
      }
      return result;
    });

    // Notify the seller when an admin resolves a pending review (approve/reject).
    if (
      isAdmin &&
      product.sellerId &&
      finalData.status &&
      finalData.status !== product.status &&
      product.status === "PENDING_REVIEW"
    ) {
      if (finalData.status === "ACTIVE" || finalData.status === "REJECTED") {
        prisma.user
          .findUnique({ where: { id: product.sellerId }, select: { email: true } })
          .then((seller) => {
            if (!seller) return;
            notifyProductReviewed({
              to: seller.email,
              productTitle: updated.titleAz,
              approved: finalData.status === "ACTIVE",
            }).catch(() => {});
          })
          .catch(() => {});
      }
    }

    // Extract and save keywords for SEO
    await extractAndSaveKeywords(updated);

    return Response.json({ product: updated });
  } catch (error) {
    console.error("PATCH /api/products/[id] error:", error);
    return Response.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!product) {
      return Response.json({ error: "Məhsul tapılmadı" }, { status: 404 });
    }

    const isOwner = product.sellerId === authUser.sub;
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(authUser.role);
    if (!isOwner && !isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Transactional cleanup: delete ALL dependent records before deleting the product.
    // Most relations already have onDelete: Cascade in the schema (ProductImage, Review,
    // Favorite, BundleItem, Listing, ProductActiveIngredient, ProductDisease,
    // ProductPest, ProductCrop, TieredPrice) — those cascade automatically.
    // BUT OrderItem does NOT have onDelete: Cascade (it defaults to Restrict) so it
    // blocks deletion if the product was ever ordered. We delete OrderItems manually
    // in the transaction so the product can always be deleted.
    // Conversation.productId uses onDelete: SetNull so it won't block.
    // Category and Seller relations don't block (we're not deleting THEM, just the product).
    await prisma.$transaction([
      // Delete any OrderItems referencing this product (from test or real orders)
      prisma.orderItem.deleteMany({ where: { productId: product.id } }),
      // Now safe to delete the product — all other relations cascade
      prisma.product.delete({ where: { id: product.id } }),
    ]);

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    // Return a more specific error message for FK constraint failures
    if (error.code === "P2003") {
      return Response.json({
        error: "Bu məhsul sifarişlərlə əlaqəlidir və silinə bilmir. Əlaqəli məlumatları əvvəlcə təmizləyin."
      }, { status: 409 });
    }
    return Response.json({ error: `Server xətası: ${error.message || "naməlum"}` }, { status: 500 });
  }
}
