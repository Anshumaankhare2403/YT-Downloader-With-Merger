import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Downloads from './pages/Downloads.jsx';
import Settings from './pages/Settings.jsx';
import DownloadHistory from './components/DownloadHistory.jsx';
import {
  getSocket,
  getActiveDownloads,
  getDownloadHistory,
  getSettings,
  cancelDownload,
  deleteHistoryItem,
  clearDownloadHistory,
  startDownload,
} from './services/api.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Load initial settings, downloads, and connect WebSocket
  useEffect(() => {
    let socket = null;

    async function init() {
      try {
        const loadedSettings = await getSettings();
        setSettings(loadedSettings);
        if (loadedSettings.theme) setTheme(loadedSettings.theme);

        const loadedHistory = await getDownloadHistory();
        setHistory(loadedHistory);

        const initialTasks = await getActiveDownloads();
        setTasks(initialTasks);
        setIsBackendReady(true);

        socket = await getSocket();

        socket.on('connect', () => {
          setIsBackendReady(true);
        });

        socket.on('disconnect', () => {
          setIsBackendReady(false);
        });

        socket.on('download:snapshot', (snapshot) => {
          setTasks(snapshot);
        });

        socket.on('download:progress', (updatedTask) => {
          setTasks((prev) => {
            const index = prev.findIndex((t) => t.id === updatedTask.id);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = { ...copy[index], ...updatedTask };
              return copy;
            }
            return [updatedTask, ...prev];
          });

          // If task completed or failed, refresh history
          if (updatedTask.status === 'completed' || updatedTask.status === 'failed') {
            getDownloadHistory().then(setHistory).catch(console.warn);
          }
        });
      } catch (err) {
        console.warn('Initial data load warning:', err.message);
      }
    }

    init();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleCancelTask = async (taskId) => {
    try {
      await cancelDownload(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'canceled', phase: 'Canceled' } : t))
      );
    } catch (e) {
      console.warn('Failed to cancel task:', e);
    }
  };

  const handleRetryTask = async (task) => {
    try {
      const newTask = await startDownload({
        url: task.url,
        mode: task.mode,
        videoFormatId: task.videoFormatId,
        audioFormatId: task.audioFormatId,
        customFilename: task.title,
        convertToMp3: task.convertToMp3,
        outputDirectory: task.outputDirectory,
      });
      setTasks((prev) => [newTask, ...prev]);
    } catch (e) {
      console.error('Retry failed:', e);
    }
  };

  const handleDeleteHistoryItem = async (id) => {
    try {
      const updated = await deleteHistoryItem(id);
      setHistory(updated);
    } catch (e) {
      console.warn('Delete history item failed:', e);
    }
  };

  const handleClearHistory = async () => {
    try {
      const updated = await clearDownloadHistory();
      setHistory(updated);
    } catch (e) {
      console.warn('Clear history failed:', e);
    }
  };

  const activeCount = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'failed' && t.status !== 'canceled'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 transition-colors font-sans antialiased">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeDownloadsCount={activeCount}
        isBackendReady={isBackendReady}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && (
          <Home
            onDownloadStarted={(task) => setTasks((prev) => [task, ...prev])}
            setActiveTab={setActiveTab}
            settings={settings}
          />
        )}

        {activeTab === 'downloads' && (
          <Downloads
            tasks={tasks}
            onCancelTask={handleCancelTask}
            onRetryTask={handleRetryTask}
          />
        )}

        {activeTab === 'history' && (
          <div className="max-w-5xl mx-auto py-4">
            <DownloadHistory
              history={history}
              onDeleteItem={handleDeleteHistoryItem}
              onClearHistory={handleClearHistory}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={settings}
            onSettingsUpdated={setSettings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-3 text-center text-xs text-slate-500">
        <p>
          YT Downloader • Self-Contained Desktop Application • Bundled with yt-dlp & FFmpeg
        </p>
      </footer>
    </div>
  );
}

