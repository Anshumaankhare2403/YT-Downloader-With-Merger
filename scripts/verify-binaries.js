/**
 * scripts/verify-binaries.js
 * Verifies that yt-dlp.exe, ffmpeg.exe, and ffprobe.exe exist in resources/win/
 * and execute correctly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_DIR = path.join(ROOT_DIR, 'resources', 'win');

export function verifyBinaries(customDir = TARGET_DIR) {
  console.log(`[Verification] Checking binaries in: ${customDir}`);
  const binaries = [
    { name: 'yt-dlp.exe', flag: '--version', regex: /^\d{4}\.\d{2}\.\d{2}/ },
    { name: 'ffmpeg.exe', flag: '-version', regex: /ffmpeg version/i },
    { name: 'ffprobe.exe', flag: '-version', regex: /ffprobe version/i },
  ];

  const results = {};
  let allValid = true;

  for (const bin of binaries) {
    const fullPath = path.join(customDir, bin.name);
    if (!fs.existsSync(fullPath)) {
      console.error(`  [MISSING] ${bin.name} not found at ${fullPath}`);
      results[bin.name] = { exists: false, works: false, error: 'File not found' };
      allValid = false;
      continue;
    }

    try {
      const run = spawnSync(fullPath, [bin.flag], {
        encoding: 'utf-8',
        timeout: 10000,
        windowsHide: true,
      });

      if (run.error) {
        throw run.error;
      }

      const output = (run.stdout || '') + (run.stderr || '');
      const valid = bin.regex.test(output);

      if (valid) {
        const firstLine = output.split('\n')[0].trim();
        console.log(`  [OK] ${bin.name} verified: "${firstLine}"`);
        results[bin.name] = { exists: true, works: true, version: firstLine };
      } else {
        console.error(`  [FAIL] ${bin.name} executed but output failed regex check.`);
        results[bin.name] = { exists: true, works: false, output };
        allValid = false;
      }
    } catch (err) {
      console.error(`  [ERROR] Could not execute ${bin.name}:`, err.message);
      results[bin.name] = { exists: true, works: false, error: err.message };
      allValid = false;
    }
  }

  return { allValid, results };
}

// Direct execution CLI check
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { allValid } = verifyBinaries();
  if (!allValid) {
    console.error('\n[Error] Binary verification failed.');
    process.exit(1);
  } else {
    console.log('\n[Success] All binary verification checks passed.');
    process.exit(0);
  }
}

