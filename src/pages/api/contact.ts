import type { APIRoute } from 'astro';
import { buildResendEmail, type ContactPayload } from '@/lib/contact';

export const prerender = false;

interface Lead extends ContactPayload {
  phone: string;
  service: string;
}

const MAX_BODY_BYTES = 16 * 1024;
const LIMITS = { name: 120, email: 254, phone: 40, service: 80, message: 5000 } as const;
const EMAIL_RE = /^[^\s@<>"'()[\],:;]+@[^\s@<>"'.]+(\.[^\s@<>"'.]+)+$/;
const DEFAULT_NOTIFY_EMAIL = 'TBD@mlunaelectric.com';

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

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch (err) {
    console.error('contact: could not parse request body', err);
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
    name: singleLine(text(body.name, LIMITS.name)),
    email: text(body.email, LIMITS.email),
    phone: text(body.phone, LIMITS.phone),
    service: text(body.service, LIMITS.service),
    message: text(body.message, LIMITS.message),
  };

  const missing = [
    !lead.name && 'name',
    !lead.email && 'email',
    !lead.phone && 'phone',
    !lead.message && 'message',
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    return json({ error: `Missing required fields: ${missing.join(', ')}`, fields: missing }, 400);
  }
  if (!EMAIL_RE.test(lead.email)) {
    return json({ error: 'Please enter a valid email address', fields: ['email'] }, 400);
  }
  if (!isValidPhone(lead.phone)) {
    return json({ error: 'Invalid phone number', fields: ['phone'] }, 400);
  }

  const env = (locals as { runtime?: { env?: Record<string, string | undefined> } } | undefined)?.runtime?.env;
  const resendApiKey = env?.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
  const notifyEmail = env?.NOTIFY_EMAIL ?? import.meta.env.NOTIFY_EMAIL ?? DEFAULT_NOTIFY_EMAIL;

  if (!resendApiKey) {
    console.error('contact: RESEND_API_KEY is not set — cannot deliver submission');
    return json({ error: 'Server misconfiguration' }, 500);
  }

  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildResendEmail(lead, notifyEmail)),
    });
  } catch (err) {
    console.error('contact: request to Resend failed', err);
    return json({ error: 'Failed to send email' }, 502);
  }

  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch (err) {
      detail = `<unreadable response body: ${String(err)}>`;
    }
    console.error(`contact: Resend responded ${res.status}`, detail);
    return json({ error: 'Failed to send email' }, 502);
  }

  return json({ ok: true }, 200);
};

export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
