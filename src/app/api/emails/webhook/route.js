import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

// POST /api/emails/webhook
// Receives Resend inbound email webhook events
// Resend sends metadata only; email body must be fetched via API
export async function POST(request) {
  try {
    // Optional: verify webhook secret for security
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      // Resend uses svix headers for verification
      // For simplicity, we check a custom header if set
      const secretHeader = request.headers.get("x-webhook-secret");
      if (secretHeader && secretHeader !== webhookSecret) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const event = await request.json().catch(() => ({}));

    // Handle Resend inbound email event
    if (event.type === "email.received" && event.data) {
      const data = event.data;

      // Fetch full email content from Resend API
      let bodyText = null;
      let bodyHtml = null;

      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data: emailContent } = await resend.emails.receiving.get(data.email_id);
        if (emailContent) {
          bodyText = emailContent.text || null;
          bodyHtml = emailContent.html || null;
        }
      } catch (fetchErr) {
        console.error("Failed to fetch email content from Resend:", fetchErr.message);
        // Still save metadata even if body fetch fails
      }

      // Extract sender info
      let fromEmail = "unknown@example.com";
      let fromName = null;
      if (typeof data.from === "string") {
        fromEmail = data.from;
      } else if (data.from && typeof data.from === "object") {
        fromEmail = data.from.email || data.from.address || fromEmail;
        fromName = data.from.name || null;
      }

      // Extract recipient
      let toEmail = "info@fermermarket.az";
      if (Array.isArray(data.to) && data.to.length > 0) {
        toEmail = typeof data.to[0] === "string" ? data.to[0] : (data.to[0]?.email || toEmail);
      } else if (typeof data.to === "string") {
        toEmail = data.to;
      }

      // Store the email in database
      const emailRecord = await prisma.incomingEmail.create({
        data: {
          fromEmail,
          fromName,
          toEmail,
          subject: data.subject || "(Mövzusuz)",
          bodyText,
          bodyHtml,
          messageId: data.message_id || data.messageId || null,
          attachments: data.attachments ? JSON.parse(JSON.stringify(data.attachments)) : null,
          receivedAt: data.created_at ? new Date(data.created_at) : new Date(),
        },
      });

      return Response.json({ success: true, id: emailRecord.id });
    }

    // Fallback: handle legacy webhook format (direct POST)
    if (event.fromEmail || event.from) {
      let fromEmail = event.fromEmail || event.from || "unknown@example.com";
      let fromName = event.fromName || null;
      if (typeof event.from === "object" && event.from !== null) {
        fromEmail = event.from.email || event.from.address || fromEmail;
        fromName = fromName || event.from.name || null;
      }

      let toEmail = event.toEmail || event.to || "info@fermermarket.az";
      if (typeof event.to === "object" && event.to !== null) {
        toEmail = event.to.email || event.to.address || toEmail;
      }

      const emailRecord = await prisma.incomingEmail.create({
        data: {
          fromEmail,
          fromName,
          toEmail,
          subject: event.subject || "(Mövzusuz)",
          bodyText: event.bodyText || event.text || null,
          bodyHtml: event.bodyHtml || event.html || null,
          messageId: event.messageId || null,
          inReplyTo: event.inReplyTo || null,
          attachments: event.attachments || null,
          receivedAt: event.receivedAt ? new Date(event.receivedAt) : new Date(),
        },
      });

      return Response.json({ success: true, id: emailRecord.id });
    }

    return Response.json({ success: true, message: "Event not handled" });
  } catch (error) {
    console.error("POST /api/emails/webhook error:", error);
    return Response.json(
      { error: "Webhook qəbul edilərkən xəta baş verdi: " + error.message },
      { status: 500 }
    );
  }
}
