import React from 'react';
import { Film, Video, Music2, Sparkles, Check } from 'lucide-react';

export default function DownloadModeSelector({ mode, onSelectMode }) {
  const modes = [
    {
      id: 'merged',
      title: 'Video + Audio',
      subtitle: 'Highest quality video stream automatically merged with best audio via FFmpeg.',
      badge: 'Recommended',
      badgeColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
      icon: Film,
      iconColor: 'text-blue-400',
    },
    {
      id: 'video',
      title: 'Video Only',
      subtitle: 'Original video stream without an embedded audio track.',
      badge: 'Silent',
      badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700',
      icon: Video,
      iconColor: 'text-purple-400',
    },
    {
      id: 'audio',
      title: 'Audio Only',
      subtitle: 'Extract original audio stream or convert to high-bitrate MP3.',
      badge: 'Music / Podcast',
      badgeColor: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50',
      icon: Music2,
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200">
          Select Download Mode
        </label>
        <span className="text-xs text-slate-400">
          Mode: <strong className="text-slate-200 capitalize">{mode}</strong>
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
              className={`relative text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-blue-500 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-805'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 ${item.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-slate-100 text-sm">
                      {item.title}
                    </span>
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
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

