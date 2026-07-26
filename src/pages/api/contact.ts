import type { APIRoute } from 'astro';

export const prerender = false;

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  service?: unknown;
  message?: unknown;
  company?: unknown;
}

interface Lead {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

const MAX_BODY_BYTES = 16 * 1024;
const LIMITS = { name: 120, email: 254, phone: 40, service: 80, message: 5000 } as const;
const EMAIL_RE = /^[^\s@<>"'()[\],:;]+@[^\s@<>"'.]+(\.[^\s@<>"'.]+)+$/;

function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, '').length === 10;
}

const ALLOWED_ORIGINS = [
  'https://mlunaelectric.com',
  'https://www.mlunaelectric.com',
];

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : '';

const singleLine = (value: string) => value.replace(/[\r\n]+/g, ' ');

function isAllowedOrigin(request: Request, siteOrigin: string | undefined): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  if (siteOrigin && origin === siteOrigin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'https:') return hostname === 'localhost' || hostname === '127.0.0.1';
    return hostname.endsWith('.mluna-electric.pages.dev') || hostname.endsWith('.mlunaelectric.com');
  } catch {
    return false;
  }
}

function renderEmail(lead: Lead): string {
  const rows = [
    ['Name', escapeHtml(lead.name)],
    ['Email', `<a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a>`],
    lead.phone ? ['Phone', escapeHtml(lead.phone)] : null,
    lead.service ? ['Service', escapeHtml(lead.service)] : null,
  ].filter((row): row is [string, string] => row !== null);

  return `
    <h2>New Contact Form Submission</h2>
    ${rows.map(([label, value]) => `<p><strong>${label}:</strong> ${value}</p>`).join('')}
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(lead.message).replace(/\r?\n/g, '<br>')}</p>
  `;
}

export const POST: APIRoute = async ({ request, locals, site }) => {
  if (!isAllowedOrigin(request, site?.origin)) {
    return json({ error: 'Forbidden' }, 403);
  }

  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return json({ error: 'Unsupported media type' }, 415);
  }

  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (declaredLength > MAX_BODY_BYTES) {
    return json({ error: 'Payload too large' }, 413);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: 'Payload too large' }, 413);
  }

  let body: ContactPayload;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (typeof body !== 'object' || body === null) {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // Honeypot: real users never see or fill this field.
  if (text(body.company, 64)) {
    return json({ ok: true }, 200);
  }

  const lead: Lead = {
    name: text(body.name, LIMITS.name),
    email: text(body.email, LIMITS.email),
    phone: text(body.phone, LIMITS.phone),
    service: text(body.service, LIMITS.service),
    message: text(body.message, LIMITS.message),
  };

  if (!lead.name || !lead.email || !lead.phone || !lead.message) {
    return json({ error: 'Missing required fields' }, 400);
  }
  if (!EMAIL_RE.test(lead.email)) {
    return json({ error: 'Invalid email address' }, 400);
  }
  if (!isValidPhone(lead.phone)) {
    return json({ error: 'Invalid phone number' }, 400);
  }

  const env = (locals as { runtime?: { env?: Record<string, string | undefined> } }).runtime?.env;
  const resendApiKey = env?.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
  const notifyEmail = env?.NOTIFY_EMAIL ?? import.meta.env.NOTIFY_EMAIL;

  if (!resendApiKey || !notifyEmail) {
    console.error('Contact form misconfigured: RESEND_API_KEY or NOTIFY_EMAIL missing');
    return json({ error: 'Server misconfiguration' }, 500);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'M Luna Electric Website <no-reply@mlunaelectric.com>',
      to: [notifyEmail],
      reply_to: lead.email,
      subject: `New estimate request from ${singleLine(lead.name)}`,
      html: renderEmail(lead),
    }),
  });

  if (!res.ok) {
    console.error(`Resend request failed with status ${res.status}`);
    return json({ error: 'Failed to send email' }, 502);
  }

  return json({ ok: true }, 200);
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
