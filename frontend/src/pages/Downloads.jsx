import React, { useState } from 'react';
import { DownloadCloud, Layers, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import DownloadProgress from '../components/DownloadProgress.jsx';

export default function Downloads({ tasks = [], onCancelTask, onRetryTask }) {
  const [filter, setFilter] = useState('all'); // all, active, completed, failed

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return t.status !== 'completed' && t.status !== 'failed' && t.status !== 'canceled';
    if (filter === 'completed') return t.status === 'completed';
    if (filter === 'failed') return t.status === 'failed' || t.status === 'canceled';
    return true;
  });

  const activeCount = tasks.filter(t => t.status !== 'completed' && t.status !== 'failed' && t.status !== 'canceled').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5 font-sans">
            <DownloadCloud className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
            <span>Download Manager</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Live progress and status of active and recent media downloads.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#121215] border border-[#E4DFD5] dark:border-[#222226] p-1 rounded-2xl text-xs font-semibold shadow-sm">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              filter === 'all'
                ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              filter === 'active'
                ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              filter === 'completed'
                ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
            }`}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => setFilter('failed')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              filter === 'failed'
                ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
            }`}
          >
            Failed
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-white dark:bg-[#121215] border border-[#E4DFD5] dark:border-[#222226] rounded-2xl p-12 text-center shadow-sm">
          <DownloadCloud className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No Downloads Found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {filter === 'active'
              ? 'There are currently no downloads in progress.'
              : 'Paste a media URL on the Downloader tab to start a download.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <DownloadProgress
              key={task.id}
              task={task}
              onCancel={onCancelTask}
              onRetry={onRetryTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
