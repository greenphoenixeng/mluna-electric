export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
}

export type ContactValidation =
  | { ok: true; payload: ContactPayload }
  | { ok: false; error: string };

const REQUIRED_FIELDS = ['name', 'email', 'message'] as const;

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

/** Validates an already-parsed request body from the contact form. */
export function validateContactPayload(body: unknown): ContactValidation {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Missing required fields' };
  }

  const raw = body as Record<string, unknown>;
  const values: Partial<Record<(typeof REQUIRED_FIELDS)[number], string>> = {};

  for (const field of REQUIRED_FIELDS) {
    const value = asOptionalString(raw[field]);
    if (!value) return { ok: false, error: 'Missing required fields' };
    values[field] = value;
  }

  return {
    ok: true,
    payload: {
      name: values.name!,
      email: values.email!,
      message: values.message!,
      phone: asOptionalString(raw.phone),
      service: asOptionalString(raw.service),
    },
  };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Notification email body sent to the shop for a new contact form submission. */
export function buildContactEmailHtml(payload: ContactPayload): string {
  const name = escapeHtml(payload.name);
  const email = escapeHtml(payload.email);
  const message = escapeHtml(payload.message).replace(/\n/g, '<br>');

  return [
    '<h2>New Contact Form Submission</h2>',
    `<p><strong>Name:</strong> ${name}</p>`,
    `<p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>`,
    payload.phone ? `<p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>` : '',
    payload.service ? `<p><strong>Service:</strong> ${escapeHtml(payload.service)}</p>` : '',
    '<p><strong>Message:</strong></p>',
    `<p>${message}</p>`,
  ]
    .filter(Boolean)
    .join('\n');
}

export interface ResendEmail {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  html: string;
}

export function buildResendEmail(payload: ContactPayload, notifyEmail: string): ResendEmail {
  return {
    from: 'M Luna Electric Website <no-reply@mlunaelectric.com>',
    to: [notifyEmail],
    reply_to: payload.email,
    subject: `New estimate request from ${payload.name}`,
    html: buildContactEmailHtml(payload),
  };
}
