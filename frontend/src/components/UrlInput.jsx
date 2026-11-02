import React, { useState } from 'react';
import { Search, Clipboard, X, Loader2, Link2 } from 'lucide-react';

export default function UrlInput({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setError('');
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
    }
  };

  const handleClear = () => {
    setUrl('');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a media URL.');
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setError('Please provide a valid web URL starting with http:// or https://');
      return;
    }

    setError('');
    onSubmit(trimmed);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center bg-slate-900 border-2 border-slate-700/80 hover:border-slate-600 focus-within:border-blue-500 rounded-2xl p-1.5 shadow-2xl transition-all">
          <div className="pl-4 text-slate-500">
            <Link2 className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            placeholder="Paste YouTube or supported video URL here..."
            disabled={isLoading}
            className="w-full bg-transparent px-4 py-3 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />

          <div className="flex items-center gap-1.5 pr-1.5">
            {url && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePaste}
              disabled={isLoading}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all border border-slate-700/60"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste</span>
            </button>

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Inspecting...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Inspect Media</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-400 pl-4 flex items-center gap-1 animate-fadeIn">
            <span>•</span> {error}
          </p>
        )}
      </form>
    </div>
  );
}

