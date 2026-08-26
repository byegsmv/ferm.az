import PostalMime from 'postal-mime';

/**
 * Convert ArrayBuffer or Uint8Array to base64 string in chunks
 * to avoid stack size overflow on large attachments.
 */
function arrayBufferToBase64(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000; // 32KB chunks
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

export default {
  async email(message, env, ctx) {
    try {
      const rawEmail = await new Response(message.raw).arrayBuffer();
      const parser = new PostalMime();
      const parsed = await parser.parse(rawEmail);

      const attachments = (parsed.attachments || []).map((att) => ({
        filename: att.filename || 'attachment',
        mimeType: att.mimeType || 'application/octet-stream',
        disposition: att.disposition || null,
        related: att.related || false,
        contentId: att.contentId || null,
        content: arrayBufferToBase64(att.content),
      }));

      const payload = {
        from: parsed.from?.address || message.from || '',
        fromName: parsed.from?.name || '',
        to: parsed.to?.[0]?.address || message.to || '',
        subject: parsed.subject || '',
        bodyText: parsed.text || '',
        bodyHtml: parsed.html || '',
        messageId: parsed.messageId || message.headers?.get('message-id') || '',
        attachments,
      };

      const webhookUrl = env.WEBHOOK_URL || 'https://fermermarket.az/api/emails/webhook';
      const webhookSecret = env.WEBHOOK_SECRET || '';

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': webhookSecret,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Webhook returned status ${response.status}: ${errorText}`);
        throw new Error(`Webhook request failed with status ${response.status}`);
      }

      console.log(`Successfully forwarded email from ${payload.from} to ${webhookUrl}`);
    } catch (error) {
      console.error('Error processing email:', error);
      throw error;
    }
  },
};
