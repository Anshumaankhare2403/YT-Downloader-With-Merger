/**
 * scripts/generate-icons.js
 * Generates an SVG, PNG, and multi-resolution ICO for YT Downloader.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT_DIR, 'resources', 'icons');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate modern SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#311042" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="50%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>
    <linearGradient id="arrow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f3f4f6" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Base Rounded Rectangle -->
  <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#bg)" stroke="#334155" stroke-width="6"/>

  <!-- Glowing Accent Container -->
  <rect x="80" y="80" width="352" height="352" rx="72" fill="url(#glow)" filter="url(#shadow)"/>

  <!-- Play and Download Symbol -->
  <g fill="none" stroke="url(#arrow)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">
    <!-- Download Arrow -->
    <path d="M256 160 v150" />
    <path d="M190 245 l66 65 66 -65" />
    <!-- Tray/Base -->
    <path d="M160 350 h192" />
  </g>
</svg>`;

fs.writeFileSync(path.join(ICONS_DIR, 'icon.svg'), svgContent, 'utf-8');
console.log('[Icons] Created icon.svg');

