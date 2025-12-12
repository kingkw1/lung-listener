import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ZoomIn, ZoomOut } from 'lucide-react';

interface MasterControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const MasterControls: React.FC<MasterControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onZoomIn,
  onZoomOut
}) => {
  
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00.00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(e.target.value);
    const newTime = (percent / 100) * duration;
    onSeek(newTime);
  };

  return (
    <div className="h-16 border-t border-slate-800 bg-slate-950 flex items-center justify-between px-6 z-30 flex-shrink-0">
        
        {/* Left: Playback Controls */}
        <div className="flex items-center space-x-4">
             <button 
               onClick={() => onSeek(Math.max(0, currentTime - 5))}
               className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all active:scale-95"
             >
                <SkipBack size={18} />
             </button>
             <button 
               onClick={onTogglePlay}
               title="Start/Stop Synchronized Playback"
               className={`p-3 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 ${
                 isPlaying 
                 ? 'bg-slate-100 text-slate-900 shadow-slate-900/20' 
                 : 'bg-cyan-600 text-white shadow-cyan-900/50 hover:bg-cyan-500'
               }`}
             >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
             </button>
             <button 
               onClick={() => onSeek(Math.min(duration, currentTime + 5))}
               className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all active:scale-95"
             >
                <SkipForward size={18} />
             </button>
        </div>
        
        {/* Center: Time Display & Scrubber */}
        <div className="flex items-center space-x-4 w-1/3">
            <span className="text-xs font-mono text-cyan-500 w-20 text-right">{formatTime(currentTime)}</span>
            
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full relative group">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="0.01"
                  value={progress} 
                  onChange={handleSeekChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div 
                  className="absolute inset-y-0 left-0 bg-cyan-600/50 group-hover:bg-cyan-500 transition-colors rounded-full pointer-events-none"
                  style={{ width: `${progress}%` }}
                ></div>
                {/* Scrubber handle */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow shadow-cyan-900/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                  style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
                ></div>
            </div>
            
            <span className="text-xs font-mono text-slate-500 w-20">{formatTime(duration)}</span>
        </div>

        {/* Right: Tools */}
        <div className="flex items-center space-x-6">
             {/* Volume */}
             <div className="flex items-center space-x-2 group">
                 <button onClick={onToggleMute} className="text-slate-500 hover:text-slate-300">
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                 </button>
                 <div className="w-20 h-1 bg-slate-800 rounded-full cursor-pointer relative">
                    <input 
                      type="range" min="0" max="1" step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                     <div 
                       className="absolute inset-y-0 left-0 bg-slate-600 group-hover:bg-slate-400 rounded-full transition-colors"
                       style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                     ></div>
                 </div>
             </div>

             {/* Divider */}
             <div className="h-6 w-px bg-slate-800"></div>

             {/* Zoom */}
             <div className="flex items-center space-x-2">
                 <button 
                    onClick={onZoomOut} 
                    title="Zoom Out (Time Axis)"
                    className="text-slate-500 hover:text-slate-300 active:scale-90 transition-transform"
                 >
                     <ZoomOut size={18} />
                 </button>
                 <span className="text-[10px] text-slate-600 font-mono uppercase">Zoom</span>
                 <button 
                    onClick={onZoomIn} 
                    title="Zoom In (Time Axis)"
                    className="text-slate-500 hover:text-slate-300 active:scale-90 transition-transform"
                 >
                     <ZoomIn size={18} />
                 </button>
             </div>
        </div>
    </div>
  );
};