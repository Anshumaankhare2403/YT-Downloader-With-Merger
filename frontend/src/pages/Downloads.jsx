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
          <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <DownloadCloud className="w-6 h-6 text-blue-500" />
            <span>Download Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Live progress and status of active and recent media downloads.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'active' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'completed' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => setFilter('failed')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'failed' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Failed
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <DownloadCloud className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Downloads Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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

