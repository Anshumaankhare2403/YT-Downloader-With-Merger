import React from 'react';
import { FolderOpen, ExternalLink, Trash2, CheckCircle2, AlertCircle, FileVideo, Music } from 'lucide-react';

export default function DownloadHistory({ history = [], onDeleteItem, onClearHistory }) {
  const handleOpenFile = (path) => {
    if (path && window.electronAPI) {
      window.electronAPI.openFile(path);
    }
  };

  const handleOpenFolder = (path) => {
    if (path && window.electronAPI) {
      window.electronAPI.openFolder(path);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-sans">Download History</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Past downloads and saved local media files.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white dark:bg-[#121215] border border-[#E4DFD5] dark:border-[#222226] rounded-2xl p-12 text-center shadow-sm">
          <FileVideo className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No Download History</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Media downloaded through YT Downloader will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E4DFD5] dark:border-[#222226] bg-white dark:bg-[#121215] shadow-sm">
          <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
            <thead className="bg-[#F6F4F0] dark:bg-[#09090B] text-zinc-600 dark:text-zinc-400 uppercase font-bold border-b border-[#E4DFD5] dark:border-[#222226]">
              <tr>
                <th className="px-4 py-3">File / Title</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Quality</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4DFD5]/60 dark:divide-[#222226] font-medium">
              {history.map((item) => {
                const isCompleted = item.status === 'completed';

                return (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* Title */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="truncate font-bold text-zinc-900 dark:text-zinc-100" title={item.title}>
                        {item.title}
                      </div>
                      {item.fileName && (
                        <div className="truncate text-[11px] font-mono text-zinc-500" title={item.fileName}>
                          {item.fileName}
                        </div>
                      )}
                    </td>

                    {/* Mode */}
                    <td className="px-4 py-3 uppercase font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      {item.mode}
                    </td>

                    {/* Quality */}
                    <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100">
                      {item.resolution}
                    </td>

                    {/* Size */}
                    <td className="px-4 py-3 font-mono text-zinc-800 dark:text-zinc-200">
                      {item.fileSizeFormatted}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap font-mono">
                      {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : '—'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isCompleted
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                          : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span>{item.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isCompleted && item.outputPath && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenFile(item.outputPath)}
                              className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                              title="Open file"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenFolder(item.outputPath)}
                              className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                              title="Show in folder"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 transition-colors"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
