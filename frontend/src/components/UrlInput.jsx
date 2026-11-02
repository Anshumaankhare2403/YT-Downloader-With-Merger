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
        <div className="relative flex items-center bg-white dark:bg-[#121215] border-2 border-[#E4DFD5] dark:border-[#222226] hover:border-zinc-400 dark:hover:border-zinc-600 focus-within:border-zinc-900 dark:focus-within:border-zinc-100 rounded-2xl p-1.5 shadow-sm dark:shadow-xl transition-all">
          <div className="pl-4 text-zinc-400 dark:text-zinc-500">
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
            className="w-full bg-transparent px-4 py-3 text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none disabled:opacity-50"
          />

          <div className="flex items-center gap-1.5 pr-1.5">
            {url && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePaste}
              disabled={isLoading}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-all border border-zinc-200 dark:border-zinc-700/60"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste</span>
            </button>

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-zinc-950 hover:bg-zinc-850 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all active:scale-[0.98]"
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
          <p className="mt-2 text-xs text-red-500 dark:text-red-400 pl-4 flex items-center gap-1 animate-fadeIn font-medium">
            <span>•</span> {error}
          </p>
        )}
      </form>
    </div>
  );
}
