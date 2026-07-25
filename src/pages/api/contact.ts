import type { APIRoute } from 'astro';
import { buildResendEmail, validateContactPayload } from '@/lib/contact';

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const result = validateContactPayload(body);
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), { status: 400 });
  }

  // Forward to Resend (or swap for n8n webhook URL via env var)
  const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = import.meta.env.NOTIFY_EMAIL ?? 'TBD@mlunaelectric.com';

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildResendEmail(result.payload, NOTIFY_EMAIL)),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
