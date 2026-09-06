import type { APIContext } from 'astro';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/pages/api/contact';

const post = (body: unknown, raw?: string, origin?: string) => {
  const request = new Request('https://mlunaelectricinc.com/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
    body: raw ?? JSON.stringify(body),
  });
  return POST({ request } as APIContext);
};

const validBody = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '(610) 555-0100',
  message: 'Need a panel upgrade.',
};

beforeEach(() => {
  vi.stubEnv('RESEND_API_KEY', 're_test_key');
  vi.stubEnv('NOTIFY_EMAIL', 'Info@mlunaelectricinc.com');
  vi.stubEnv('FROM_EMAIL', 'M. Luna Electric <noreply@updates.mlunaelectricinc.com>');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('POST /api/contact', () => {
  it.each([
    'https://mlunaelectricinc.com',
    'https://www.mlunaelectricinc.com',
    'https://preview.mlunaelectricinc.com',
    'https://mlunaelectric.com',
    'https://abc123.mluna-electric.pages.dev',
  ])('accepts requests from allowed origin %s', async (origin) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    const res = await post(validBody, undefined, origin);
    expect(res.status).toBe(200);
  });

  it('returns 403 for a disallowed origin', async () => {
    const res = await post(validBody, undefined, 'https://evil.example.com');
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('returns 400 for a body that is not JSON', async () => {
    const res = await post(undefined, 'not json');
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await post({ email: 'ada@example.com' });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'Missing required fields: name, phone, message',
      fields: ['name', 'phone', 'message'],
    });
  });

  it('returns 500 when the Resend API key is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const res = await post(validBody);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'Server misconfiguration' });
  });

  it('forwards the submission to Resend and returns 200', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    const res = await post({ ...validBody, phone: '610-555-0100', service: 'panel' });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_test_key');
    const payload = JSON.parse(init.body as string);
    expect(payload.to).toEqual(['Info@mlunaelectricinc.com']);
    expect(payload.from).toBe('M. Luna Electric <noreply@updates.mlunaelectricinc.com>');
    expect(payload.reply_to).toBe('ada@example.com');
    expect(payload.html).toContain('610-555-0100');
    expect(payload.text).toContain('610-555-0100');
  });

  it('falls back to the default notify address when none is configured', async () => {
    vi.stubEnv('NOTIFY_EMAIL', undefined);
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    await post(validBody);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).to).toEqual(['Info@mlunaelectricinc.com']);
  });

  it('returns 502 when Resend rejects the request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 422 }));
    const res = await post(validBody);
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: 'Failed to send email' });
  });
});
