/**
 * scripts/build.js
 * End-to-end packaging orchestrator for YT Downloader.
 * Verifies binaries, builds frontend, executes automated tests, and packages executables.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyBinaries } from './verify-binaries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

console.log('=== YT DOWNLOADER BUILD & PACKAGING ORCHESTRATOR ===\n');

// Step 1: Verify bundled binaries
console.log('[Step 1/4] Verifying bundled media binaries...');
const { allValid } = verifyBinaries();
if (!allValid) {
  console.error('[Error] Binary verification failed. Run npm run download-binaries first.');
  process.exit(1);
}
console.log('  -> Binaries verified.\n');

// Step 2: Build frontend
console.log('[Step 2/4] Building production React frontend...');
const feBuild = spawnSync(npmCmd, ['run', 'build'], {
  cwd: path.join(ROOT_DIR, 'frontend'),
  stdio: 'inherit',
  shell: true,
});
if (feBuild.status !== 0) {
  console.error('[Error] Frontend build failed.');
  process.exit(1);
}
console.log('  -> Frontend build complete.\n');

// Step 3: Run Automated Test Suites
console.log('[Step 3/4] Running automated test suites...');
const testRun = spawnSync(npxCmd, ['vitest', 'run'], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  shell: true,
});
if (testRun.status !== 0) {
  console.error('[Error] Test suites failed. Halting build to maintain release quality.');
  process.exit(1);
}
console.log('  -> Automated tests passed.\n');

// Step 4: Run Electron Builder
console.log('[Step 4/4] Generating Windows NSIS Installer and Portable EXE...');
const packArgs = ['electron-builder'];
if (process.argv.includes('--portable')) {
  packArgs.push('--win', 'portable');
} else if (process.argv.includes('--nsis')) {
  packArgs.push('--win', 'nsis');
}

const buildRun = spawnSync(npxCmd, packArgs, {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  shell: true,
});

if (buildRun.status !== 0) {
  console.error('[Error] Electron Builder packaging failed.');
  process.exit(1);
}

console.log('\n[SUCCESS] Package generation completed successfully!');
console.log('Artifacts generated in release/ directory:');
console.log('  - Windows NSIS Installer');
console.log('  - Portable Executable');

