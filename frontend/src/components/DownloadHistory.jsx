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
          <h2 className="text-lg font-bold text-slate-100">Download History</h2>
          <p className="text-xs text-slate-400">
            Past downloads and saved local media files.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <FileVideo className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Download History</h3>
          <p className="text-xs text-slate-500 mt-1">
            Media downloaded through YT Downloader will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {history.map((item) => {
                const isCompleted = item.status === 'completed';

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Title */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="truncate font-semibold text-slate-100" title={item.title}>
                        {item.title}
                      </div>
                      {item.fileName && (
                        <div className="truncate text-[11px] font-mono text-slate-400" title={item.fileName}>
                          {item.fileName}
                        </div>
                      )}
                    </td>

                    {/* Mode */}
                    <td className="px-4 py-3 uppercase font-mono text-[11px] text-slate-400">
                      {item.mode}
                    </td>

                    {/* Quality */}
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {item.resolution}
                    </td>

                    {/* Size */}
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {item.fileSizeFormatted}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : '—'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
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
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Open file"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenFolder(item.outputPath)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Show in folder"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
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

