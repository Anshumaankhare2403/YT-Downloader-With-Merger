import { describe, it, expect } from 'vitest';
import { isValidMediaUrl } from '../../backend/middleware/validation.js';

describe('Validation Middleware Unit Tests', () => {
  it('accepts valid HTTP and HTTPS URLs', () => {
    expect(isValidMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isValidMediaUrl('http://vimeo.com/12345678')).toBe(true);
    expect(isValidMediaUrl('https://soundcloud.com/artist/track')).toBe(true);
    expect(isValidMediaUrl('https://archive.org/details/test_media')).toBe(true);
  });

  it('rejects invalid or dangerous protocol schemes', () => {
    expect(isValidMediaUrl('file:///C:/Windows/System32/calc.exe')).toBe(false);
    expect(isValidMediaUrl('javascript:alert(1)')).toBe(false);
    expect(isValidMediaUrl('data:text/html,test')).toBe(false);
    expect(isValidMediaUrl('ftp://example.com/file.mp4')).toBe(false);
    expect(isValidMediaUrl('gopher://example.com')).toBe(false);
  });

  it('rejects empty, non-string, or non-URL input', () => {
    expect(isValidMediaUrl('')).toBe(false);
    expect(isValidMediaUrl(null)).toBe(false);
    expect(isValidMediaUrl(undefined)).toBe(false);
    expect(isValidMediaUrl('just a regular sentence')).toBe(false);
  });

  it('rejects command flag injection attempts starting with dash', () => {
    expect(isValidMediaUrl('--version')).toBe(false);
    expect(isValidMediaUrl('-o /tmp/evil')).toBe(false);
    expect(isValidMediaUrl('--help')).toBe(false);
  });

  it('rejects URLs containing newline or control characters', () => {
    expect(isValidMediaUrl('https://youtube.com/watch?v=123\nrm -rf /')).toBe(false);
    expect(isValidMediaUrl('https://youtube.com/watch?v=123\r\n')).toBe(false);
    expect(isValidMediaUrl('https://youtube.com\0/bad')).toBe(false);
  });
});

