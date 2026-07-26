import { describe, expect, it } from 'vitest';
import {
  buildContactEmailHtml,
  buildResendEmail,
  escapeHtml,
  validateContactPayload,
} from '@/lib/contact';

const validBody = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Need a panel upgrade.',
};

describe('validateContactPayload', () => {
  it('accepts a body with the required fields', () => {
    const result = validateContactPayload(validBody);
    expect(result).toEqual({ ok: true, payload: { ...validBody, phone: undefined, service: undefined } });
  });

  it('keeps optional phone and service when present', () => {
    const result = validateContactPayload({ ...validBody, phone: '610-555-0100', service: 'panel' });
    expect(result.ok && result.payload.phone).toBe('610-555-0100');
    expect(result.ok && result.payload.service).toBe('panel');
  });

  it('trims surrounding whitespace', () => {
    const result = validateContactPayload({
      name: '  Ada  ',
      email: ' ada@example.com ',
      message: ' hello ',
      phone: '  ',
    });
    expect(result.ok && result.payload).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'hello',
      phone: undefined,
      service: undefined,
    });
  });

  it.each([
    ['missing name', { email: 'a@b.com', message: 'hi' }],
    ['missing email', { name: 'Ada', message: 'hi' }],
    ['missing message', { name: 'Ada', email: 'a@b.com' }],
    ['blank name', { ...validBody, name: '   ' }],
    ['empty message', { ...validBody, message: '' }],
    ['non-string name', { ...validBody, name: 42 }],
    ['null email', { ...validBody, email: null }],
  ])('rejects a body with %s', (_label, body) => {
    expect(validateContactPayload(body)).toEqual({ ok: false, error: 'Missing required fields' });
  });

  it.each([
    ['null', null],
    ['a string', 'name=Ada'],
    ['a number', 7],
    ['an array', [validBody]],
  ])('rejects %s as a body', (_label, body) => {
    expect(validateContactPayload(body)).toEqual({ ok: false, error: 'Missing required fields' });
  });
});

describe('escapeHtml', () => {
  it('escapes HTML-significant characters', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
    expect(escapeHtml("Tom & Jerry's")).toBe('Tom &amp; Jerry&#39;s');
  });

  it('leaves plain text untouched', () => {
    expect(escapeHtml('200A panel upgrade')).toBe('200A panel upgrade');
  });
});

describe('buildContactEmailHtml', () => {
  it('includes the submitted name, email and message', () => {
    const html = buildContactEmailHtml(validBody);
    expect(html).toContain('<h2>New Contact Form Submission</h2>');
    expect(html).toContain('Ada Lovelace');
    expect(html).toContain('<a href="mailto:ada@example.com">ada@example.com</a>');
    expect(html).toContain('Need a panel upgrade.');
  });

  it('omits optional rows that were not submitted', () => {
    const html = buildContactEmailHtml(validBody);
    expect(html).not.toContain('Phone:');
    expect(html).not.toContain('Service:');
  });

  it('includes optional rows that were submitted', () => {
    const html = buildContactEmailHtml({ ...validBody, phone: '610-555-0100', service: 'EV Charger' });
    expect(html).toContain('<p><strong>Phone:</strong> 610-555-0100</p>');
    expect(html).toContain('<p><strong>Service:</strong> EV Charger</p>');
  });

  it('converts newlines in the message to line breaks', () => {
    const html = buildContactEmailHtml({ ...validBody, message: 'line one\nline two' });
    expect(html).toContain('line one<br>line two');
  });

  it('escapes markup submitted by the visitor', () => {
    const html = buildContactEmailHtml({
      ...validBody,
      name: '<script>alert(1)</script>',
      message: '<b>bold</b>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
  });
});

describe('buildResendEmail', () => {
  it('addresses the notification email and replies to the visitor', () => {
    const email = buildResendEmail(validBody, 'contact@mlunaelectric.com');
    expect(email.to).toEqual(['contact@mlunaelectric.com']);
    expect(email.reply_to).toBe('ada@example.com');
    expect(email.from).toBe('M Luna Electric Website <no-reply@mlunaelectric.com>');
    expect(email.subject).toBe('New estimate request from Ada Lovelace');
    expect(email.html).toBe(buildContactEmailHtml(validBody));
  });
});
