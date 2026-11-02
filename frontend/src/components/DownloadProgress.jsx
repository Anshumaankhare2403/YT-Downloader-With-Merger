import React from 'react';
import { Play, Pause, XCircle, CheckCircle2, AlertCircle, FolderOpen, ExternalLink, RefreshCw, Zap } from 'lucide-react';

export default function DownloadProgress({ task, onCancel, onRetry }) {
  if (!task) return null;

  const isCompleted = task.status === 'completed';
  const isFailed = task.status === 'failed';
  const isCanceled = task.status === 'canceled';
  const isInProgress = !isCompleted && !isFailed && !isCanceled;

  const handleOpenFile = () => {
    if (task.outputPath && window.electronAPI) {
      window.electronAPI.openFile(task.outputPath);
    }
  };

  const handleOpenFolder = () => {
    if (task.outputPath && window.electronAPI) {
      window.electronAPI.openFolder(task.outputPath);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121215] border border-[#E4DFD5] dark:border-[#222226] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        {/* Title and Phase */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              isCompleted
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : isFailed
                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                : isCanceled
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 animate-pulse font-extrabold'
            }`}>
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Finished</span>
                </>
              ) : isFailed ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  <span>Failed</span>
                </>
              ) : isCanceled ? (
                <>
                  <XCircle className="w-3 h-3" />
                  <span>Canceled</span>
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  <span>Active</span>
                </>
              )}
            </span>

            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-medium">
              {task.phase || 'Processing...'}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {task.title || 'Downloading Media...'}
          </h3>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isInProgress && (
            <button
              type="button"
              onClick={() => onCancel(task.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all"
              title="Cancel download"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}

          {isCompleted && task.outputPath && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleOpenFile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white shadow-sm transition-all"
                title="Open file"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open File</span>
              </button>

              <button
                type="button"
                onClick={handleOpenFolder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-zinc-200 dark:border-zinc-700"
                title="Show in containing folder"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Show in Folder</span>
              </button>
            </div>
          )}

          {isFailed && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(task)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-[#E4DFD5] dark:border-[#222226]">
        <div
          className={`h-full transition-all duration-300 ${
            isCompleted
              ? 'bg-emerald-500'
              : isFailed
              ? 'bg-red-500'
              : isCanceled
              ? 'bg-zinc-400 dark:bg-zinc-700'
              : 'bg-zinc-900 dark:bg-zinc-100'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, task.progress || 0))}%` }}
        />
      </div>

      {/* Progress Stats Footer */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold text-zinc-900 dark:text-zinc-100">{task.progress || 0}%</span>
          {isInProgress && task.speedFormatted && (
            <span>• Speed: <strong className="text-zinc-800 dark:text-zinc-200">{task.speedFormatted}</strong></span>
          )}
          {isInProgress && task.etaFormatted && task.etaFormatted !== '--' && (
            <span>• ETA: <strong className="text-zinc-800 dark:text-zinc-200">{task.etaFormatted}</strong></span>
          )}
        </div>

        {task.error && (
          <span className="text-red-500 dark:text-red-400 truncate max-w-[300px] font-sans">
            Error: {task.error}
          </span>
        )}
      </div>
    </div>
  );
}
