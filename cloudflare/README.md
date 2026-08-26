# Cloudflare Email Worker for FermerMarket

This worker captures incoming emails sent to `info@fermermarket.az` via Cloudflare Email Routing, parses them using `postal-mime`, and forwards the extracted email data to the Vercel webhook endpoint at `https://fermermarket.az/api/emails/webhook`.

## Deployment Instructions

1. **Install Wrangler** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Log in to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Set the Webhook Secret**:
   Generate or choose a secure random string for `WEBHOOK_SECRET` and store it in Cloudflare Worker secrets:
   ```bash
   wrangler secret put WEBHOOK_SECRET
   ```
   *(When prompted, enter your secret key, e.g., a strong random token)*

4. **Deploy the Worker**:
   ```bash
   cd cloudflare && wrangler deploy
   ```

5. **Configure Cloudflare Email Routing**:
   - Go to Cloudflare Dashboard > select `fermermarket.az` domain.
   - Navigate to **Email Routing** > **Routes**.
   - Click **Add route**.
   - Set **Custom address**: `info@fermermarket.az`
   - Set **Action**: `Send to Worker`
   - Select **Worker**: `fermermarket-email-worker`
   - Save the route.

6. **Configure Webhook Secret on Vercel**:
   - Go to your Vercel Dashboard for the `fermermarket` project.
   - Navigate to **Settings** > **Environment Variables**.
   - Add an environment variable named `WEBHOOK_SECRET` and set its value to match the secret set in Step 3.
   - Redeploy or save the configuration.

## Features & Format

The worker extracts and posts the following JSON payload to `https://fermermarket.az/api/emails/webhook`:

```json
{
  "from": "sender@example.com",
  "fromName": "Sender Name",
  "to": "info@fermermarket.az",
  "subject": "Email Subject",
  "bodyText": "Plain text content",
  "bodyHtml": "<p>HTML content</p>",
  "messageId": "<message-id-header>",
  "attachments": [
    {
      "filename": "document.pdf",
      "mimeType": "application/pdf",
      "disposition": "attachment",
      "related": false,
      "contentId": null,
      "content": "<base64-encoded-string>"
    }
  ]
}
```

The request includes the custom header for verification:
```
x-webhook-secret: <WEBHOOK_SECRET>
```
