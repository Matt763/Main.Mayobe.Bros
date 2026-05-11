import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyBunnyWebhookSignature } from '../webhook-verify';

const SECRET = 'test-secret-abc-123';

describe('verifyBunnyWebhookSignature', () => {
  it('accepts a valid signature', () => {
    const body = JSON.stringify({ VideoGuid: 'abc' });
    const sig  = crypto.createHmac('sha256', SECRET).update(body).digest('hex');
    expect(verifyBunnyWebhookSignature(body, sig, SECRET)).toBe(true);
  });
  it('rejects a wrong signature', () => {
    expect(verifyBunnyWebhookSignature('payload', 'badbadbad', SECRET)).toBe(false);
  });
  it('rejects an empty signature', () => {
    expect(verifyBunnyWebhookSignature('payload', '', SECRET)).toBe(false);
  });
  it('rejects when secret is empty', () => {
    expect(verifyBunnyWebhookSignature('payload', 'abc', '')).toBe(false);
  });
  it('rejects a signature of the wrong length', () => {
    expect(verifyBunnyWebhookSignature('payload', 'ab', SECRET)).toBe(false);
  });
  it('rejects a malformed hex signature gracefully', () => {
    expect(verifyBunnyWebhookSignature('payload', 'not-hex!!!', SECRET)).toBe(false);
  });
});
