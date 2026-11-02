import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../backend/app.js';
import { setSessionToken } from '../../backend/middleware/validation.js';

describe('Settings API Integration Tests', () => {
  const TEST_TOKEN = 'test-settings-token-998877';
  let app;

  beforeAll(() => {
    setSessionToken(TEST_TOKEN);
    app = createApp();
  });

  afterAll(() => {
    setSessionToken(null);
  });

  it('GET /api/settings retrieves current application settings', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('x-session-token', TEST_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('downloadDirectory');
    expect(res.body.data).toHaveProperty('maxConcurrency');
  });

  it('POST /api/settings updates maxConcurrency and theme', async () => {
    const res = await request(app)
      .post('/api/settings')
      .set('x-session-token', TEST_TOKEN)
      .send({ maxConcurrency: 4, theme: 'dark' });

    expect(res.status).toBe(200);
    expect(res.body.data.maxConcurrency).toBe(4);
    expect(res.body.data.theme).toBe('dark');
  });

  it('GET /api/settings/temp-stats returns valid cache information', async () => {
    const res = await request(app)
      .get('/api/settings/temp-stats')
      .set('x-session-token', TEST_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('tempDirectory');
    expect(res.body.data).toHaveProperty('fileCount');
    expect(res.body.data).toHaveProperty('totalSizeBytes');
  });

  it('POST /api/settings/clean-temp purges temporary files', async () => {
    const res = await request(app)
      .post('/api/settings/clean-temp')
      .set('x-session-token', TEST_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Cleaned up');
  });
});

