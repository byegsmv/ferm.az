import { createNotification } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { messageCreateSchema } from "@/lib/validators";
import { sendPushToUser } from "@/lib/push";

// GET /api/conversations — list own conversations (as buyer or seller), newest first
export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let conversations = await prisma.conversation.findMany({
      where: { OR: [{ buyerId: authUser.sub }, { sellerId: authUser.sub }] },
      orderBy: { lastMessageAt: "desc" },
      include: {
        buyer: { select: { id: true, fullName: true } },
        seller: { select: { id: true, fullName: true } },
        product: { select: { id: true, titleAz: true, slug: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: authUser.sub },
                readAt: null
              }
            }
          }
        }
      },
    });

    // Map _count.messages to _unread
    conversations = conversations.map(c => ({
      ...c,
      _unread: c._count?.messages || 0,
      _count: undefined // remove the original _count object to keep the response clean
    }));

    return Response.json({ conversations });
  } catch (error) {
    console.error("GET /api/conversations error:", error);
    return Response.json({ error: "Daxili server xətası" }, { status: 500 });
  }
}

// POST /api/conversations — start (or reuse) a conversation and send the first message.
// Buyers pass sellerId (+ optional productId); sellers pass buyerId to reply to someone new.
export async function POST(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
    }

    const parsed = messageCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validasiya xətası", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { sellerId, buyerId, productId, content } = parsed.data;
    const resolvedBuyerId = buyerId || authUser.sub;
    const resolvedSellerId = sellerId || authUser.sub;

    if (resolvedBuyerId === resolvedSellerId) {
      return Response.json({ error: "Özünüzə mesaj göndərə bilməzsiniz" }, { status: 422 });
    }
    if (authUser.sub !== resolvedBuyerId && authUser.sub !== resolvedSellerId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetProductId = productId || null;

    let conversation = await prisma.conversation.findFirst({
      where: {
        buyerId: resolvedBuyerId,
        sellerId: resolvedSellerId,
        productId: targetProductId,
      },
    });

    if (conversation) {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    } else {
      conversation = await prisma.conversation.create({
        data: {
          buyerId: resolvedBuyerId,
          sellerId: resolvedSellerId,
          productId: targetProductId,
        },
      });
    }

    const message = await prisma.message.create({
      data: { conversationId: conversation.id, senderId: authUser.sub, content },
    });

    const recipientId = authUser.sub === resolvedBuyerId ? resolvedSellerId : resolvedBuyerId;
    sendPushToUser(recipientId, {
      title: "💬 Yeni mesaj",
      body: content.slice(0, 100),
      url: `/messages?id=${conversation.id}`,
    }).catch(() => {});

    createNotification({
      userId: recipientId,
      type: "message",
      title: "Yeni mesaj 💬",
      body: content.slice(0, 100),
      link: `/messages?id=${conversation.id}`,
    }).catch(() => {});

    return Response.json({ conversation, message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/conversations error:", error);
    return Response.json({ error: "Daxili server xətası" }, { status: 500 });
  }
}
