import React, { useState } from 'react';
import { Download, Table, Sparkles, AlertCircle, CheckCircle, FileText, Folder } from 'lucide-react';
import UrlInput from '../components/UrlInput.jsx';
import VideoPreview from '../components/VideoPreview.jsx';
import DownloadModeSelector from '../components/DownloadModeSelector.jsx';
import QualitySelector from '../components/QualitySelector.jsx';
import FormatTable from '../components/FormatTable.jsx';
import { fetchMetadata, startDownload } from '../services/api.js';

export default function Home({ onDownloadStarted, setActiveTab, settings }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);

  const [mode, setMode] = useState('merged'); // 'merged' | 'video' | 'audio'
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [convertToMp3, setConvertToMp3] = useState(false);
  const [customFilename, setCustomFilename] = useState('');
  const [showFullTable, setShowFullTable] = useState(false);
  const [isStartingDownload, setIsStartingDownload] = useState(false);

  const handleInspectUrl = async (url) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMetadata(url);
      setMetadata(data);
      setCustomFilename(data.title || '');

      // Default selected format: highest quality video for merged/video, or best audio
      if (mode === 'audio') {
        setSelectedFormat(data.audioFormats?.[0] || null);
      } else {
        setSelectedFormat(data.videoFormats?.[0] || null);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        (err.message === 'Network Error'
          ? 'Cannot connect to local engine. Please make sure the desktop application is running.'
          : err.message) ||
        'Failed to inspect media URL.';
      setError(errorMsg);
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (!metadata) return;

    if (newMode === 'audio') {
      setSelectedFormat(metadata.audioFormats?.[0] || null);
    } else {
      setSelectedFormat(metadata.videoFormats?.[0] || null);
    }
  };

  const handleStartDownload = async () => {
    if (!metadata || !selectedFormat) return;

    setIsStartingDownload(true);
    try {
      const downloadPayload = {
        url: metadata.webpage_url,
        mode,
        videoFormatId: mode !== 'audio' ? selectedFormat.format_id : null,
        audioFormatId: mode === 'audio' ? selectedFormat.format_id : null,
        customFilename: customFilename.trim() || metadata.title,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        convertToMp3: mode === 'audio' ? convertToMp3 : false,
        outputDirectory: settings?.downloadDirectory || null,
      };

      const task = await startDownload(downloadPayload);
      if (onDownloadStarted) {
        onDownloadStarted(task);
      }
      setActiveTab('downloads');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not initiate download.');
    } finally {
      setIsStartingDownload(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Search Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
          Download Media with <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-400 to-amber-300">Precision Quality</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Inspect stream formats, select high-resolution video streams, and let FFmpeg automatically merge video & audio into clean MP4 or WebM files.
        </p>
      </div>

      {/* URL Input */}
      <UrlInput onSubmit={handleInspectUrl} isLoading={isLoading} />

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold">Inspection Failed:</strong>
            <p className="mt-0.5 text-xs text-red-300/90">{error}</p>
          </div>
        </div>
      )}

      {/* Media Inspection Results */}
      {metadata && (
        <div className="space-y-6 animate-fadeIn">
          {/* Video Metadata Preview */}
          <VideoPreview metadata={metadata} />

          {/* Download Mode Selection */}
          <DownloadModeSelector mode={mode} onSelectMode={handleModeChange} />

          {/* Quality Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-sm font-bold text-slate-200">
                Quality & Stream Options
              </span>

              <button
                type="button"
                onClick={() => setShowFullTable(!showFullTable)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/60"
              >
                <Table className="w-3.5 h-3.5" />
                <span>{showFullTable ? 'Show Quick Cards' : 'View Full Formats Table'}</span>
              </button>
            </div>

            {showFullTable ? (
              <FormatTable
                formats={metadata.formats || []}
                selectedFormat={selectedFormat}
                onSelectFormat={setSelectedFormat}
                mode={mode}
              />
            ) : (
              <QualitySelector
                mode={mode}
                metadata={metadata}
                selectedFormat={selectedFormat}
                onSelectFormat={setSelectedFormat}
                convertToMp3={convertToMp3}
                setConvertToMp3={setConvertToMp3}
              />
            )}
          </div>

          {/* Action Bar / Download Initiation */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:max-w-md space-y-1">
              <label className="text-xs font-semibold text-slate-400">
                Output File Name
              </label>
              <input
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder="Enter filename..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleStartDownload}
                disabled={isStartingDownload || !selectedFormat}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 via-orange-500 to-pink-600 hover:opacity-95 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Download className="w-5 h-5" />
                <span>
                  {isStartingDownload ? 'Preparing...' : `Download ${selectedFormat?.qualityLabel || ''}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

