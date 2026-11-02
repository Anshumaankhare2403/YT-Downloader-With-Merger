/**
 * frontend/src/services/api.js
 * Client-side communication service for Express REST API & Socket.IO events.
 */

import axios from 'axios';
import { io } from 'socket.io-client';

let apiClient = null;
let socketClient = null;
let backendInfoCache = null;

export async function getBackendInfo() {
  if (backendInfoCache && backendInfoCache.port) return backendInfoCache;

  // 1. Electron IPC (when running inside desktop app)
  if (window.electronAPI && typeof window.electronAPI.getBackendInfo === 'function') {
    try {
      const info = await window.electronAPI.getBackendInfo();
      if (info && info.port) {
        backendInfoCache = info;
        return info;
      }
    } catch (e) {
      console.warn('Could not retrieve backend info via Electron IPC:', e);
    }
  }

  // 2. Vite Dev Server discovery endpoint (when running/testing in browser)
  try {
    const res = await fetch('/api/backend-info');
    if (res.ok) {
      const info = await res.json();
      if (info && info.port) {
        backendInfoCache = info;
        return info;
      }
    }
  } catch (e) {
    // not in vite dev server
  }

  // 3. Fallback for standalone tests
  return {
    port: 5000,
    sessionToken: null,
  };
}

export async function getApiClient() {
  const info = await getBackendInfo();
  const baseURL = `http://127.0.0.1:${info.port}`;

  if (!apiClient || apiClient.defaults.baseURL !== baseURL) {
    apiClient = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(info.sessionToken ? { 'x-session-token': info.sessionToken } : {}),
      },
      timeout: 60000,
    });
  }

  return apiClient;
}

export async function getSocket() {
  const info = await getBackendInfo();
  const socketURL = `http://127.0.0.1:${info.port}`;

  if (!socketClient || !socketClient.connected) {
    socketClient = io(socketURL, {
      auth: { token: info.sessionToken },
      query: { token: info.sessionToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
  }

  return socketClient;
}

// API Methods
export async function fetchMetadata(url) {
  const client = await getApiClient();
  const response = await client.post('/api/metadata', { url });
  return response.data.data;
}

export async function startDownload(downloadOptions) {
  const client = await getApiClient();
  const response = await client.post('/api/downloads', downloadOptions);
  return response.data.data;
}

export async function cancelDownload(taskId) {
  const client = await getApiClient();
  const response = await client.post(`/api/downloads/${taskId}/cancel`);
  return response.data;
}

export async function getActiveDownloads() {
  const client = await getApiClient();
  const response = await client.get('/api/downloads');
  return response.data.data;
}

export async function getDownloadHistory() {
  const client = await getApiClient();
  const response = await client.get('/api/downloads/history');
  return response.data.data;
}

export async function deleteHistoryItem(id) {
  const client = await getApiClient();
  const response = await client.delete(`/api/downloads/history/${id}`);
  return response.data.data;
}

export async function clearDownloadHistory() {
  const client = await getApiClient();
  const response = await client.delete('/api/downloads/history');
  return response.data.data;
}

export async function getSettings() {
  const client = await getApiClient();
  const response = await client.get('/api/settings');
  return response.data.data;
}

export async function updateSettings(settings) {
  const client = await getApiClient();
  const response = await client.post('/api/settings', settings);
  return response.data.data;
}

export async function getTempStats() {
  const client = await getApiClient();
  const response = await client.get('/api/settings/temp-stats');
  return response.data.data;
}

export async function cleanTempFiles() {
  const client = await getApiClient();
  const response = await client.post('/api/settings/clean-temp');
  return response.data;
}
