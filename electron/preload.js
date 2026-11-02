/**
 * electron/preload.js
 * Secure preload script with strict Context Isolation.
 * Exposes a minimal, validated IPC interface to the React frontend.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getBackendInfo: () => ipcRenderer.invoke('get-backend-info'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});

