import React from 'react';
import { Check, Sparkles, Music, HardDrive, Info } from 'lucide-react';

export default function QualitySelector({
  mode,
  metadata,
  selectedFormat,
  onSelectFormat,
  convertToMp3,
  setConvertToMp3,
}) {
  if (!metadata) return null;

  // Mode C: Audio Only Cards
  if (mode === 'audio') {
    const audioList = metadata.audioFormats || [];

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-sm font-semibold text-slate-200">
            Select Audio Stream
          </label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="convertMp3"
              checked={convertToMp3}
              onChange={(e) => setConvertToMp3(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="convertMp3" className="text-xs font-medium text-slate-300 cursor-pointer select-none">
              Convert to MP3 (Universal playback)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {audioList.map((audio) => {
            const isSelected = selectedFormat?.format_id === audio.format_id;
            return (
              <button
                key={audio.format_id}
                type="button"
                onClick={() => onSelectFormat(audio)}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-md shadow-blue-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-100 text-sm">
                    {audio.qualityLabel}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {convertToMp3 ? 'MP3' : audio.ext}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Codec: {audio.acodec?.split('.')[0] || 'audio'}</span>
                  <span>{audio.sizeFormatted}</span>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Mode A or B: Video Qualities
  const videoList = metadata.videoFormats || [];

  // Group by distinct resolutions (keep the highest bitrate format for each quality level)
  const uniqueResolutions = [];
  const seenHeights = new Set();

  for (const v of videoList) {
    const key = v.height || v.resolution;
    if (!seenHeights.has(key)) {
      seenHeights.add(key);
      uniqueResolutions.push(v);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200">
          Available Resolutions
        </label>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          {mode === 'merged' ? 'Auto-combining with highest bitrate audio' : 'Video only (no audio)'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {uniqueResolutions.map((video) => {
          const isSelected = selectedFormat?.format_id === video.format_id;
          const is4K = video.height >= 2160;
          const is1080p = video.height === 1080;

          return (
            <button
              key={video.format_id}
              type="button"
              onClick={() => onSelectFormat(video)}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-100 text-base">
                  {video.qualityLabel}
                </span>
                {video.fps && video.fps > 30 && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded">
                    {video.fps}fps
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-400 mb-1">
                <span>{video.ext?.toUpperCase()}</span>
                {video.vcodec && (
                  <span className="text-slate-500 ml-1">
                    ({video.vcodec.split('.')[0]})
                  </span>
                )}
              </div>

              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Size:</span>
                <span className="text-slate-300">{video.sizeFormatted}</span>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

