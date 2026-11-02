import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../backend/app.js';
import { setSessionToken } from '../../backend/middleware/validation.js';

describe('Metadata & Health API Integration Tests', () => {
  const TEST_TOKEN = 'test-secret-token-12345';
  let app;

  beforeAll(() => {
    setSessionToken(TEST_TOKEN);
    app = createApp();
  });

  afterAll(() => {
    setSessionToken(null);
  });

  it('GET /api/health returns 200 without authentication', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('YT-Downloader-Backend');
    expect(res.body.pid).toBeTypeOf('number');
  });

  it('POST /api/metadata rejects unauthorized requests missing session token', async () => {
    const res = await request(app)
      .post('/api/metadata')
      .send({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('POST /api/metadata rejects invalid URLs with 400', async () => {
    const res = await request(app)
      .post('/api/metadata')
      .set('x-session-token', TEST_TOKEN)
      .send({ url: 'file:///etc/passwd' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid URL');
  });

  it('POST /api/metadata rejects empty payload with 400', async () => {
    const res = await request(app)
      .post('/api/metadata')
      .set('x-session-token', TEST_TOKEN)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('URL parameter is required');
  });
});

