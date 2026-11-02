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
          <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            Select Audio Stream
          </label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="convertMp3"
              checked={convertToMp3}
              onChange={(e) => setConvertToMp3(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-400 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500 cursor-pointer accent-zinc-900 dark:accent-zinc-100"
            />
            <label htmlFor="convertMp3" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              Convert to MP3 (Universal audio compatibility)
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
                className={`p-3.5 rounded-2xl border-2 text-left transition-all relative ${
                  isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 shadow-md'
                    : 'bg-[#F6F4F0]/60 dark:bg-[#09090B]/60 border-[#E4DFD5] dark:border-[#222226] hover:border-zinc-400 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {audio.qualityLabel}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                    {convertToMp3 ? 'MP3' : audio.ext}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Codec: {audio.acodec?.split('.')[0] || 'audio'}</span>
                  <span className="font-mono font-medium">{audio.sizeFormatted}</span>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center">
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

  // Group by distinct resolutions (keep highest bitrate format per resolution)
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
        <label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
          Available Resolutions
        </label>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
          <Info className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
          {mode === 'merged' ? 'Auto-combining with highest bitrate audio' : 'Video only (no audio)'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {uniqueResolutions.map((video) => {
          const isSelected = selectedFormat?.format_id === video.format_id;

          return (
            <button
              key={video.format_id}
              type="button"
              onClick={() => onSelectFormat(video)}
              className={`p-3 rounded-2xl border-2 text-left transition-all relative ${
                isSelected
                  ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 shadow-md'
                  : 'bg-[#F6F4F0]/60 dark:bg-[#09090B]/60 border-[#E4DFD5] dark:border-[#222226] hover:border-zinc-400 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-zinc-900 dark:text-zinc-100 text-base">
                  {video.qualityLabel}
                </span>
                {video.fps && video.fps > 30 && (
                  <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">
                    {video.fps}fps
                  </span>
                )}
              </div>

              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                <span className="font-semibold">{video.ext?.toUpperCase()}</span>
                {video.vcodec && (
                  <span className="text-zinc-400 dark:text-zinc-500 ml-1">
                    ({video.vcodec.split('.')[0]})
                  </span>
                )}
              </div>

              <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                <span>Size:</span>
                <span className="text-zinc-900 dark:text-zinc-200 font-bold">{video.sizeFormatted}</span>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center">
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
