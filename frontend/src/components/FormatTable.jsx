import React, { useState, useMemo } from 'react';
import { Filter, ArrowUpDown, Check, Music, Video, HardDrive, AlertTriangle } from 'lucide-react';

export default function FormatTable({ formats = [], selectedFormat, onSelectFormat, mode }) {
  // Filters
  const [resFilter, setResFilter] = useState('all');
  const [extFilter, setExtFilter] = useState('all');
  const [codecFilter, setCodecFilter] = useState('all');
  const [audioFilter, setAudioFilter] = useState('all');
  const [sortField, setSortField] = useState('height');
  const [sortAsc, setSortAsc] = useState(false);

  // Available filter options derived from data
  const extensions = useMemo(() => {
    return Array.from(new Set(formats.map(f => f.ext))).filter(Boolean);
  }, [formats]);

  const filteredFormats = useMemo(() => {
    return formats.filter(f => {
      // Resolution filter
      if (resFilter !== 'all') {
        if (resFilter === 'audio' && f.hasVideo) return false;
        if (resFilter === '4k' && (!f.height || f.height < 2160)) return false;
        if (resFilter === '1080p' && f.height !== 1080) return false;
        if (resFilter === '720p' && f.height !== 720) return false;
        if (resFilter === 'sd' && (f.height > 720 || !f.height)) return false;
      }

      // Extension filter
      if (extFilter !== 'all' && f.ext !== extFilter) return false;

      // Codec filter
      if (codecFilter !== 'all') {
        const v = (f.vcodec || '').toLowerCase();
        if (codecFilter === 'avc' && !v.includes('avc') && !v.includes('h264')) return false;
        if (codecFilter === 'vp9' && !v.includes('vp09') && !v.includes('vp9')) return false;
        if (codecFilter === 'av1' && !v.includes('av01') && !v.includes('av1')) return false;
      }

      // Audio filter
      if (audioFilter !== 'all') {
        if (audioFilter === 'muxed' && f.type !== 'muxed') return false;
        if (audioFilter === 'separate' && (f.type !== 'video_only')) return false;
        if (audioFilter === 'audio_only' && f.type !== 'audio_only') return false;
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'size') {
        valA = a.filesize || 0;
        valB = b.filesize || 0;
      } else if (sortField === 'height') {
        valA = a.height || 0;
        valB = b.height || 0;
      } else if (sortField === 'fps') {
        valA = a.fps || 0;
        valB = b.fps || 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [formats, resFilter, extFilter, codecFilter, audioFilter, sortField, sortAsc]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Filters:</span>
          </div>

          {/* Resolution Filter */}
          <select
            value={resFilter}
            onChange={(e) => setResFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Resolutions</option>
            <option value="4k">4K Ultra HD (≥2160p)</option>
            <option value="1080p">1080p Full HD</option>
            <option value="720p">720p HD</option>
            <option value="sd">Standard Def (≤480p)</option>
            <option value="audio">Audio Only</option>
          </select>

          {/* Extension Filter */}
          <select
            value={extFilter}
            onChange={(e) => setExtFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 uppercase font-mono"
          >
            <option value="all">All Extensions</option>
            {extensions.map(ext => (
              <option key={ext} value={ext}>{ext.toUpperCase()}</option>
            ))}
          </select>

          {/* Codec Filter */}
          <select
            value={codecFilter}
            onChange={(e) => setCodecFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Video Codecs</option>
            <option value="avc">H.264 / AVC</option>
            <option value="vp9">VP9</option>
            <option value="av1">AV1</option>
          </select>

          {/* Audio Availability */}
          <select
            value={audioFilter}
            onChange={(e) => setAudioFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Stream Types</option>
            <option value="muxed">Muxed (Video+Audio)</option>
            <option value="separate">Video Only (Separate Audio)</option>
            <option value="audio_only">Audio Only</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono">
          Showing <strong>{filteredFormats.length}</strong> of <strong>{formats.length}</strong> formats
        </div>
      </div>

      {/* Formats Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800 select-none">
            <tr>
              <th
                onClick={() => toggleSort('height')}
                className="px-4 py-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Quality</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3">Format / Ext</th>
              <th className="px-4 py-3">Video Codec</th>
              <th className="px-4 py-3">Audio Track</th>
              <th
                onClick={() => toggleSort('fps')}
                className="px-4 py-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>FPS</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('size')}
                className="px-4 py-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>File Size</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3">Stream Type</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredFormats.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                  No media formats match the active filters.
                </td>
              </tr>
            ) : (
              filteredFormats.map((f) => {
                const isSelected = selectedFormat?.format_id === f.format_id;
                const requiresMerge = f.type === 'video_only' && mode === 'merged';

                return (
                  <tr
                    key={f.format_id}
                    onClick={() => onSelectFormat(f)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-600/15 text-white'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Quality */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">
                          {f.qualityLabel}
                        </span>
                        {f.format_id && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            #{f.format_id}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Container Extension */}
                    <td className="px-4 py-3 uppercase font-mono text-slate-400">
                      {f.ext}
                    </td>

                    {/* Video Codec */}
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {f.hasVideo ? f.vcodec : <span className="text-slate-600">None</span>}
                    </td>

                    {/* Audio Track */}
                    <td className="px-4 py-3">
                      {f.hasAudio ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                          <Music className="w-3 h-3" />
                          <span>{f.acodec?.split('.')[0] || 'Available'}</span>
                        </span>
                      ) : requiresMerge ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-[11px]" title="FFmpeg will automatically merge with best audio stream">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Auto-Merged</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">None</span>
                      )}
                    </td>

                    {/* FPS */}
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {f.fps ? `${f.fps}` : '—'}
                    </td>

                    {/* File Size */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className={f.filesize ? 'text-slate-200' : 'text-slate-400'}>
                          {f.sizeFormatted}
                        </span>
                        {f.isEstimate && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Estimated based on stream bitrate and duration">
                            Est.
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stream Type */}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        f.type === 'muxed'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : f.type === 'video_only'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {f.type.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFormat(f);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

