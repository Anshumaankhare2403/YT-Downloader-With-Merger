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
      <div className="text-center space-y-3">
        <div className="flex justify-center mb-1">
          <div className="w-16 h-16 rounded-2xl bg-[#F6F4F0] p-1.5 shadow-xl shadow-black/10 border border-[#D5CFBE] dark:border-[#34343A] flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <img 
              src="/logo-original.png" 
              alt="YT Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
          YT <span className="font-light text-zinc-500 dark:text-zinc-400">Downloader</span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
          High-performance media extractor with native FFmpeg audio/video multiplexing and quality preservation.
        </p>
      </div>

      {/* URL Input */}
      <UrlInput onSubmit={handleInspectUrl} isLoading={isLoading} />

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-600 dark:text-red-400 text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold">Inspection Failed:</strong>
            <p className="mt-0.5 text-xs text-red-500/90 dark:text-red-300/90">{error}</p>
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
          <div className="bg-white dark:bg-[#121215] border border-[#E4DFD5] dark:border-[#222226] rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DFD5] dark:border-[#222226]">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Quality & Stream Options
              </span>

              <button
                type="button"
                onClick={() => setShowFullTable(!showFullTable)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-all border border-zinc-200 dark:border-zinc-700"
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
          <div className="bg-white dark:bg-[#121215] border border-[#E4DFD5] dark:border-[#222226] rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
            <div className="w-full sm:max-w-md space-y-1">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Output File Name
              </label>
              <input
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder="Enter filename..."
                className="w-full bg-[#F6F4F0] dark:bg-[#09090B] border border-[#E4DFD5] dark:border-[#222226] rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 font-medium transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleStartDownload}
                disabled={isStartingDownload || !selectedFormat}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
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
