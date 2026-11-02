/**
 * electron/ipc/appHandlers.js
 * IPC handlers for native dialogs, shell operations, and app info.
 */

import { ipcMain, dialog, shell, app } from 'electron';
import fs from 'fs';
import path from 'path';

export function registerAppHandlers(backendLifecycle) {
  // Returns local backend port and session token
  ipcMain.handle('get-backend-info', () => {
    return backendLifecycle.getBackendInfo();
  });

  // Native folder selection dialog
  ipcMain.handle('select-folder', async (event) => {
    const focusedWindow = event.sender.getOwnerBrowserWindow();
    const result = await dialog.showOpenDialog(focusedWindow, {
      title: 'Select Download Folder',
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // Open file with default system application
  ipcMain.handle('open-file', async (event, filePath) => {
    if (!filePath || typeof filePath !== 'string') return false;
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) return false;

    await shell.openPath(resolved);
    return true;
  });

  // Open containing folder in Windows Explorer
  ipcMain.handle('open-folder', async (event, filePath) => {
    if (!filePath || typeof filePath !== 'string') return false;
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) return false;

    shell.showItemInFolder(resolved);
    return true;
  });

  // App version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });
}

