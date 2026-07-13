import type { APIRoute } from 'astro';

interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
}

export const POST: APIRoute = async ({ request }) => {
  let body: ContactPayload;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { name, email, message } = body;
  if (!name || !email || !message) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
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
    body: JSON.stringify({
      from: 'M Luna Electric Website <no-reply@mlunaelectric.com>',
      to: [NOTIFY_EMAIL],
      reply_to: email,
      subject: `New estimate request from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${body.phone ? `<p><strong>Phone:</strong> ${body.phone}</p>` : ''}
        ${body.service ? `<p><strong>Service:</strong> ${body.service}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
