import { BillingOrder } from '@/types/billing';

export function getCanonicalSiteOrigin(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  return 'https://writing-platform-two.vercel.app';
}

export function getSupportEmail(): string {
  return (process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@ieltsmentor.ai').trim();
}

export function getSupportTelegram(): string {
  return (process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM || '').trim();
}

/**
 * Sends a non-blocking Telegram Bot alert to the platform admin when a student submits a new P2P order.
 */
export async function notifyAdminNewBillingOrder(order: BillingOrder): Promise<void> {
  const botToken = (process.env.TELEGRAM_ADMIN_BOT_TOKEN || '').trim();
  const chatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || '').trim();
  if (!botToken || !chatId) return;

  const amountLabel =
    order.currency === 'USD'
      ? `$${order.amountPaid}`
      : `${order.amountPaid.toLocaleString()} UZS`;
  const text = [
    `💳 *New IELTS Pro P2P Order*`,
    `Order: \`${order.id}\``,
    `Student: ${order.userName || order.userEmail} (${order.userEmail})`,
    `Plan: ${order.planCode} (${amountLabel})`,
    `Method: ${order.paymentMethod}`,
    order.receiptNote ? `Ref: ${order.receiptNote}` : null,
    order.receiptUrl ? `Receipt image attached in /admin` : null,
    `Review: ${getCanonicalSiteOrigin()}/admin`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (err) {
    console.warn('Telegram admin billing notification failed (non-fatal):', err);
  }
}

/**
 * Sends a transactional email via Resend REST API when RESEND_API_KEY is configured.
 * Fails gracefully in development if no mail provider is configured yet.
 */
export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ delivered: boolean; mode: 'resend' | 'unconfigured' }> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.EMAIL_FROM || 'IELTS Mentor AI <onboarding@resend.dev>').trim();

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[Transactional Email - Dev Fallback] To: ${params.to} | Subject: ${params.subject}\n${params.text}`);
    }
    return { delivered: false, mode: 'unconfigured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
      signal: AbortSignal.timeout(6000),
    });
    return { delivered: res.ok, mode: 'resend' };
  } catch (err) {
    console.warn('Transactional email send error:', err);
    return { delivered: false, mode: 'resend' };
  }
}

