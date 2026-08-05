import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const secretHeader = request.headers.get("x-webhook-secret");
      if (secretHeader !== webhookSecret) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json().catch(() => ({}));

    let fromEmail = body.fromEmail || body.from || "";
    let fromName = body.fromName || null;

    if (typeof body.from === "object" && body.from !== null) {
      fromEmail = body.from.email || body.from.address || fromEmail;
      fromName = fromName || body.from.name || null;
    }

    let toEmail = body.toEmail || body.to || "";
    if (typeof body.to === "object" && body.to !== null) {
      toEmail = body.to.email || body.to.address || toEmail;
    }

    if (!fromEmail) fromEmail = "unknown@example.com";
    if (!toEmail) toEmail = "info@fermermarket.az";

    const subject = body.subject || "(Mövzusuz)";
    const bodyText = body.bodyText || body.text || null;
    const bodyHtml = body.bodyHtml || body.html || null;
    const messageId = body.messageId || null;
    const inReplyTo = body.inReplyTo || null;
    const attachments = body.attachments ? body.attachments : null;

    const emailRecord = await prisma.incomingEmail.create({
      data: {
        fromEmail,
        fromName,
        toEmail,
        subject,
        bodyText,
        bodyHtml,
        messageId,
        inReplyTo,
        attachments,
        receivedAt: body.receivedAt ? new Date(body.receivedAt) : new Date(),
      },
    });

    return Response.json({ success: true, id: emailRecord.id });
  } catch (error) {
    console.error("POST /api/emails/webhook error:", error);
    return Response.json(
      { error: "Webhook qəbul edilərkən xəta baş verdi: " + error.message },
      { status: 500 }
    );
  }
}
