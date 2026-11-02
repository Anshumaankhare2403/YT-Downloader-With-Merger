import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../backend/app.js';
import { setSessionToken, isValidMediaUrl } from '../../backend/middleware/validation.js';
import { sanitizeFilename, validateDirectory } from '../../backend/utils/fileManager.js';

describe('Security & Hardening Tests', () => {
  const SECRET_TOKEN = 'secure_secret_token_abcdef123456';
  const app = createApp();

  setSessionToken(SECRET_TOKEN);

  it('blocks shell command injection payloads in URL validation', () => {
    const maliciousUrls = [
      'https://youtube.com/watch?v=123; calc.exe',
      'https://youtube.com/watch?v=123 & calc.exe',
      'https://youtube.com/watch?v=123 | calc.exe',
      'https://youtube.com/watch?v=123 `calc.exe`',
      'https://youtube.com/watch?v=123 $(calc.exe)',
      '--dump-json https://youtube.com',
      '-o /etc/passwd',
      '--exec-cmd calc.exe',
    ];

    for (const bad of maliciousUrls) {
      expect(isValidMediaUrl(bad)).toBe(false);
    }
  });

  it('neutralizes path traversal attempts in filename sanitization', () => {
    const maliciousFilenames = [
      '../../../../Windows/System32/evil.exe',
      '..\\..\\Windows\\System32\\cmd.exe',
      '/etc/passwd',
      'C:\\autoexec.bat',
      'file*name?with|bad<chars>',
    ];

    for (const name of maliciousFilenames) {
      const clean = sanitizeFilename(name);
      expect(clean).not.toContain('/');
      expect(clean).not.toContain('\\');
      expect(clean).not.toContain('..');
      expect(clean).not.toContain(':');
      expect(clean).not.toContain('*');
      expect(clean).not.toContain('?');
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('>');
      expect(clean).not.toContain('|');
    }
  });

  it('rejects directory validation for non-existent or path traversal targets', () => {
    expect(() => validateDirectory('C:\\SomeRandomNonExistentDirectoryForTest998877')).toThrow();
    expect(() => validateDirectory('')).toThrow();
  });

  it('rejects unauthorized API access with invalid session token', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('x-session-token', 'wrong_tampered_token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('masks internal filesystem paths in error responses', async () => {
    const res = await request(app)
      .post('/api/settings')
      .set('x-session-token', SECRET_TOKEN)
      .send({ downloadDirectory: 'D:\\DefinitelyInvalidDirectory123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

