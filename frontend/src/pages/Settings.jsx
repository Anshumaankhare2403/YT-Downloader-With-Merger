import React, { useState, useEffect } from 'react';
import { Folder, HardDrive, Trash2, Sliders, Cpu, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { getSettings, updateSettings, getTempStats, cleanTempFiles } from '../services/api.js';

export default function Settings({ settings, onSettingsUpdated }) {
  const [downloadDir, setDownloadDir] = useState(settings?.downloadDirectory || '');
  const [concurrency, setConcurrency] = useState(settings?.maxConcurrency || 3);
  const [tempStats, setTempStats] = useState(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanMessage, setCleanMessage] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    if (settings) {
      setDownloadDir(settings.downloadDirectory || '');
      setConcurrency(settings.maxConcurrency || 3);
    }
    loadTempStats();
  }, [settings]);

  const loadTempStats = async () => {
    try {
      const stats = await getTempStats();
      setTempStats(stats);
    } catch (e) {
      console.warn('Could not load temp stats:', e);
    }
  };

  const handleSelectFolder = async () => {
    if (window.electronAPI && typeof window.electronAPI.selectFolder === 'function') {
      const selected = await window.electronAPI.selectFolder();
      if (selected) {
        setDownloadDir(selected);
        handleSave({ downloadDirectory: selected });
      }
    }
  };

  const handleSave = async (overrides = {}) => {
    try {
      const payload = {
        downloadDirectory: overrides.downloadDirectory || downloadDir,
        maxConcurrency: overrides.maxConcurrency || concurrency,
      };
      const updated = await updateSettings(payload);
      if (onSettingsUpdated) {
        onSettingsUpdated(updated);
      }
      setSaveMessage('Settings saved successfully.');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleCleanTemp = async () => {
    setIsCleaning(true);
    setCleanMessage(null);
    try {
      const res = await cleanTempFiles();
      setCleanMessage(res.message || 'Temporary files cleared.');
      await loadTempStats();
      setTimeout(() => setCleanMessage(null), 4000);
    } catch (err) {
      setCleanMessage('Failed to clean temporary storage.');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5 font-sans">
          <Sliders className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
          <span>Application Settings</span>
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Configure download destinations, concurrency policies, and local cache.
        </p>
      </div>

      {saveMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Download Location */}
      <div className="bg-white dark:bg-[#121215] border border-[#E4DFD5] dark:border-[#222226] rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Download Destination Folder
            </h3>
          </div>
          <span className="text-xs text-zinc-500">Default storage directory</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={downloadDir}
            className="w-full bg-[#F6F4F0] dark:bg-[#09090B] border border-[#E4DFD5] dark:border-[#222226] rounded-xl px-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 font-mono select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSelectFolder}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white shadow-sm transition-all"
          >
            Browse...
          </button>
        </div>
      </div>

      {/* Concurrency Settings */}
      <div className="bg-white dark:bg-[#121215] border border-[#E4DFD5] dark:border-[#222226] rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Max Concurrent Downloads
            </h3>
          </div>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-md">
            {concurrency} concurrent
          </span>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Limits the number of simultaneous active downloads to preserve bandwidth and system responsiveness. Extra downloads are queued.
        </p>

        <div className="flex flex-col gap-2 pt-2">
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={concurrency}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setConcurrency(val);
              handleSave({ maxConcurrency: val });
            }}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-950 dark:accent-zinc-100"
          />
          <div className="flex justify-between w-full text-[10px] text-zinc-500 font-mono">
            <span>1 (Conservative)</span>
            <span>3 (Balanced)</span>
            <span>5 (High Throughput)</span>
          </div>
        </div>
      </div>

      {/* Temporary Storage Cache */}
      <div className="bg-white dark:bg-[#121215] border border-[#E4DFD5] dark:border-[#222226] rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Temporary Stream Storage
            </h3>
          </div>
          <span className="text-xs text-zinc-500">Isolated OS cache</span>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Streams are downloaded into temporary scratch storage during download and merge operations. Files are automatically cleared after completion.
        </p>

        {tempStats && (
          <div className="bg-[#F6F4F0] dark:bg-[#09090B] border border-[#E4DFD5] dark:border-[#222226] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-zinc-500">Cache Path: </span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">{tempStats.tempDirectory}</span>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span>Files: <strong className="text-zinc-900 dark:text-zinc-100">{tempStats.fileCount}</strong></span>
              <span>Size: <strong className="text-zinc-900 dark:text-zinc-100">{tempStats.totalSizeFormatted}</strong></span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          {cleanMessage ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{cleanMessage}</span>
          ) : (
            <span className="text-xs text-zinc-500">Safely purges any abandoned stream segments.</span>
          )}

          <button
            type="button"
            onClick={handleCleanTemp}
            disabled={isCleaning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isCleaning ? 'Cleaning...' : 'Clear Temp Cache'}</span>
          </button>
        </div>
      </div>

      {/* Bundled Self-Contained Engine Status */}
      <div className="bg-white dark:bg-[#121215] border border-[#E4DFD5] dark:border-[#222226] rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-3 transition-colors">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Bundled Engine Diagnostics
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-[#F6F4F0] dark:bg-[#09090B] border border-[#E4DFD5] dark:border-[#222226] p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Media Engine</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">yt-dlp (Bundled)</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Integrated Binary</span>
            </div>
          </div>

          <div className="bg-[#F6F4F0] dark:bg-[#09090B] border border-[#E4DFD5] dark:border-[#222226] p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Stream Merger</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">FFmpeg 9.0.2</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Integrated Binary</span>
            </div>
          </div>

          <div className="bg-[#F6F4F0] dark:bg-[#09090B] border border-[#E4DFD5] dark:border-[#222226] p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Stream Analyzer</span>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">FFprobe 9.0.2</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Integrated Binary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
