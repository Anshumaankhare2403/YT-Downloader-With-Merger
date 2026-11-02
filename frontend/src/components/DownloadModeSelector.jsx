import React from 'react';
import { Film, Video, Music2, Sparkles, Check } from 'lucide-react';

export default function DownloadModeSelector({ mode, onSelectMode }) {
  const modes = [
    {
      id: 'merged',
      title: 'Video + Audio',
      subtitle: 'Highest quality video stream automatically merged with best audio via FFmpeg.',
      badge: 'Recommended',
      badgeColor: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold',
      icon: Film,
    },
    {
      id: 'video',
      title: 'Video Only',
      subtitle: 'Original video stream without an embedded audio track.',
      badge: 'Silent',
      badgeColor: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      icon: Video,
    },
    {
      id: 'audio',
      title: 'Audio Only',
      subtitle: 'Extract original audio stream or convert to high-bitrate MP3.',
      badge: 'Audio Only',
      badgeColor: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      icon: Music2,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
          Select Download Mode
        </label>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Mode: <strong className="text-zinc-900 dark:text-zinc-100 capitalize">{mode}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modes.map((item) => {
          const Icon = item.icon;
          const isSelected = mode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectMode(item.id)}
              className={`relative text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-white dark:bg-zinc-850 border-zinc-950 dark:border-zinc-100 shadow-md'
                  : 'bg-white/80 dark:bg-[#121215] border-[#E4DFD5] dark:border-[#222226] hover:border-zinc-400 dark:hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                      {item.title}
                    </span>
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {item.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
