import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import os from 'os';

function backendInfoPlugin() {
  return {
    name: 'backend-runtime-info',
    configureServer(server) {
      server.middlewares.use('/api/backend-info', (req, res) => {
        try {
          const infoPath = path.join(os.tmpdir(), 'yt-downloader-temp', 'backend-runtime.json');
          if (fs.existsSync(infoPath)) {
            const data = fs.readFileSync(infoPath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
            return;
          }
        } catch (e) {}
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Backend runtime info not found' }));
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), backendInfoPlugin()],
  base: './', // Ensures relative assets for Electron file:// protocol
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
