import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../backend/app.js';
import { setSessionToken } from '../../backend/middleware/validation.js';
import { downloadService } from '../../backend/services/downloadService.js';

describe('Download API Integration Tests', () => {
  const TEST_TOKEN = 'test-download-token-54321';
  let app;

  beforeAll(() => {
    setSessionToken(TEST_TOKEN);
    app = createApp();
  });

  afterAll(() => {
    setSessionToken(null);
  });

  it('rejects download initiation without valid session token', async () => {
    const res = await request(app)
      .post('/api/downloads')
      .send({
        url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        mode: 'merged',
        formatId: '18',
      });

    expect(res.status).toBe(401);
  });

  it('rejects invalid mode with 400', async () => {
    const res = await request(app)
      .post('/api/downloads')
      .set('x-session-token', TEST_TOKEN)
      .send({
        url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        mode: 'invalid_mode',
        formatId: '18',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid download mode');
  });

  it('rejects missing formatId for merged mode with 400', async () => {
    const res = await request(app)
      .post('/api/downloads')
      .set('x-session-token', TEST_TOKEN)
      .send({
        url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        mode: 'merged',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('requires videoFormatId');
  });

  it('manages download history list and deletion', async () => {
    // Add sample item to history directly
    downloadService.history = [
      {
        id: 'hist_test_1',
        title: 'Test Song',
        url: 'https://youtube.com/watch?v=123',
        mode: 'audio',
        resolution: 'Audio',
        outputPath: 'C:\\test\\song.mp3',
        fileName: 'song.mp3',
        fileSizeFormatted: '4.5 MB',
        completedAt: new Date().toISOString(),
        status: 'completed',
      },
    ];

    const getRes = await request(app)
      .get('/api/downloads/history')
      .set('x-session-token', TEST_TOKEN);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.length).toBe(1);
    expect(getRes.body.data[0].id).toBe('hist_test_1');

    // Delete item
    const delRes = await request(app)
      .delete('/api/downloads/history/hist_test_1')
      .set('x-session-token', TEST_TOKEN);

    expect(delRes.status).toBe(200);
    expect(delRes.body.data.length).toBe(0);
  });
});

