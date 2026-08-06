import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";
import { sendPushToUser } from "@/lib/push";

const sendSchema = z.object({ content: z.string().min(1).max(3000) });

async function getConversationForUser(id, userId) {
  if (!id) return null;
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) return null;
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) return "forbidden";
  return conversation;
}

// GET /api/conversations/:id/messages — poll for messages
export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const conversationId = resolvedParams?.id;
    if (!conversationId) return Response.json({ error: "Tapılmadı" }, { status: 404 });

    const conversation = await getConversationForUser(conversationId, authUser.sub);
    if (!conversation) return Response.json({ error: "Tapılmadı" }, { status: 404 });
    if (conversation === "forbidden") return Response.json({ error: "Forbidden" }, { status: 403 });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, fullName: true } } },
    });

    // Mark incoming messages (not sent by me) as read
    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: authUser.sub }, readAt: null },
      data: { readAt: new Date() },
    });

    return Response.json({ messages });
  } catch (error) {
    console.error("GET /api/conversations/[id]/messages error:", error);
    return Response.json({ error: "Daxili server xətası" }, { status: 500 });
  }
}

// POST /api/conversations/:id/messages — send a message in an existing conversation
export async function POST(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const conversationId = resolvedParams?.id;
    if (!conversationId) return Response.json({ error: "Tapılmadı" }, { status: 404 });

    const conversation = await getConversationForUser(conversationId, authUser.sub);
    if (!conversation) return Response.json({ error: "Tapılmadı" }, { status: 404 });
    if (conversation === "forbidden") return Response.json({ error: "Forbidden" }, { status: 403 });

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Yanlış JSON formatı" }, { status: 400 });
    }

    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "content tələb olunur" }, { status: 422 });

    const message = await prisma.message.create({
      data: { conversationId, senderId: authUser.sub, content: parsed.data.content },
    });

    await prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });

    const recipientId = conversation.buyerId === authUser.sub ? conversation.sellerId : conversation.buyerId;
    // Also create an in-app notification
    prisma.notification.create({
      data: {
        userId: recipientId,
        type: "message",
        title: "Yeni mesaj aldınız",
        body: parsed.data.content.slice(0, 100),
        entity: "Conversation",
        entityId: conversationId,
      },
    }).catch(() => {});

    sendPushToUser(recipientId, {
      title: "💬 Yeni mesaj",
      body: parsed.data.content.slice(0, 100),
      url: `/messages?id=${conversationId}`,
    }).catch(() => {});

    return Response.json({ message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/conversations/[id]/messages error:", error);
    return Response.json({ error: "Daxili server xətası" }, { status: 500 });
  }
}
