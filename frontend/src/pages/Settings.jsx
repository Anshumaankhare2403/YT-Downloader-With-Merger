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
        <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-blue-500" />
          <span>Application Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure download destinations, concurrency policies, and local cache.
        </p>
      </div>

      {saveMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Download Location */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Download Destination Folder
            </h3>
          </div>
          <span className="text-xs text-slate-400">Default storage directory</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={downloadDir}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-mono select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSelectFolder}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
          >
            Browse...
          </button>
        </div>
      </div>

      {/* Concurrency Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Max Concurrent Downloads
            </h3>
          </div>
          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
            {concurrency} concurrent
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Limits the number of simultaneous active downloads to preserve bandwidth and system responsiveness. Extra downloads are queued.
        </p>

        <div className="flex items-center gap-4 pt-2">
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between w-full text-[10px] text-slate-500 font-mono">
            <span>1 (Conservative)</span>
            <span>3 (Balanced)</span>
            <span>5 (High Throughput)</span>
          </div>
        </div>
      </div>

      {/* Temporary Storage Cache */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Temporary Stream Storage
            </h3>
          </div>
          <span className="text-xs text-slate-400">Isolated OS cache</span>
        </div>

        <p className="text-xs text-slate-400">
          Streams are downloaded into temporary scratch storage during download and merge operations. Files are automatically cleared after completion.
        </p>

        {tempStats && (
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500">Cache Path: </span>
              <span className="font-mono text-slate-300">{tempStats.tempDirectory}</span>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span>Files: <strong className="text-slate-200">{tempStats.fileCount}</strong></span>
              <span>Size: <strong className="text-slate-200">{tempStats.totalSizeFormatted}</strong></span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          {cleanMessage ? (
            <span className="text-xs text-emerald-400 font-medium">{cleanMessage}</span>
          ) : (
            <span className="text-xs text-slate-500">Safely purges any abandoned stream segments.</span>
          )}

          <button
            type="button"
            onClick={handleCleanTemp}
            disabled={isCleaning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isCleaning ? 'Cleaning...' : 'Clear Temp Cache'}</span>
          </button>
        </div>
      </div>

      {/* Bundled Self-Contained Engine Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-200">
            Bundled Engine Diagnostics
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Media Engine</span>
            <div className="text-sm font-bold text-slate-200 mt-1">yt-dlp (Bundled)</div>
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>Integrated Binary</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Stream Merger</span>
            <div className="text-sm font-bold text-slate-200 mt-1">FFmpeg 9.0.2</div>
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>Integrated Binary</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Stream Analyzer</span>
            <div className="text-sm font-bold text-slate-200 mt-1">FFprobe 9.0.2</div>
            <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>Integrated Binary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

