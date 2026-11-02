import React from 'react';
import { Clock, User, ExternalLink, Video, Music, Layers } from 'lucide-react';

export default function VideoPreview({ metadata }) {
  if (!metadata) return null;

  const maxRes = metadata.videoFormats?.[0]?.qualityLabel || 'Standard';
  const audioCount = metadata.audioFormats?.length || 0;
  const totalFormats = metadata.formats?.length || 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl transition-all">
      <div className="flex flex-col md:flex-row gap-5 items-start">
        {/* Thumbnail Container */}
        <div className="relative w-full md:w-72 lg:w-80 flex-shrink-0 aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group shadow-md">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Video className="w-12 h-12 stroke-[1.5]" />
            </div>
          )}

          {metadata.durationFormatted && (
            <div className="absolute bottom-2 right-2 bg-slate-950/80 backdrop-blur-md text-slate-100 text-xs font-mono font-medium px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-700/50 shadow">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{metadata.durationFormatted}</span>
            </div>
          )}
        </div>

        {/* Video Information */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 line-clamp-2 leading-snug">
              {metadata.title}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-300 truncate max-w-[200px]">
                  {metadata.uploader}
                </span>
              </div>

              {metadata.webpage_url && (
                <a
                  href={metadata.webpage_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Source</span>
                </a>
              )}
            </div>

            {metadata.description && (
              <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {metadata.description}
              </p>
            )}
          </div>

          {/* Quick Metrics Pills */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
              <Video className="w-3.5 h-3.5" />
              <span>Max Quality: {maxRes}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Music className="w-3.5 h-3.5" />
              <span>Audio Tracks: {audioCount}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-3.5 h-3.5" />
              <span>Available Formats: {totalFormats}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

