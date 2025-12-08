import React from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';

interface AudioPlayerProps {
  disabled: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  disabled,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onToggleMute
}) => {

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(e.target.value);
    const newTime = (percent / 100) * duration;
    onSeek(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col justify-center space-y-2">
      
      {/* Progress Bar */}
      <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
        <span className="w-10 text-right">{formatTime(currentTime)}</span>
        <div className="flex-1 relative h-1.5 bg-slate-700 rounded-full group">
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="0.1"
            value={progress} 
            onChange={handleSeekChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          />
          <div 
            className="absolute left-0 top-0 h-full bg-cyan-500 rounded-full pointer-events-none transition-all duration-75" 
            style={{ width: `${progress}%` }} 
          />
          {!disabled && (
             <div 
                className="absolute h-3 w-3 bg-white rounded-full -top-[3px] shadow pointer-events-none transition-all duration-75" 
                style={{ left: `calc(${progress}% - 6px)` }}
             />
          )}
        </div>
        <span className="w-10">{formatTime(duration)}</span>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between px-1">
        
        {/* Left: Volume */}
        <div className="flex items-center space-x-2 w-24">
           <button onClick={onToggleMute} disabled={disabled} className="text-slate-400 hover:text-slate-200 disabled:opacity-30">
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
           </button>
           <input 
             type="range" min="0" max="1" step="0.05" 
             value={isMuted ? 0 : volume}
             onChange={(e) => onVolumeChange(Number(e.target.value))}
             disabled={disabled}
             className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-slate-300 [&::-webkit-slider-thumb]:rounded-full"
           />
        </div>

        {/* Center: Playback */}
        <div className="flex items-center space-x-6">
           <button 
             disabled={disabled} 
             onClick={() => onSeek(Math.max(0, currentTime - 5))}
             className="text-slate-500 hover:text-slate-300 disabled:opacity-20 transition-colors"
           >
              <SkipBack size={20} />
           </button>
           
           <button 
             onClick={onTogglePlay}
             disabled={disabled}
             className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
               !disabled
                ? 'bg-slate-100 text-slate-900 hover:scale-105 hover:bg-cyan-400 hover:text-slate-900 shadow-lg shadow-cyan-900/20' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
             }`}
           >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
           </button>

           <button 
             disabled={disabled} 
             onClick={() => onSeek(Math.min(duration, currentTime + 5))}
             className="text-slate-500 hover:text-slate-300 disabled:opacity-20 transition-colors"
           >
              <SkipForward size={20} />
           </button>
        </div>

        {/* Right: Info */}
        <div className="w-24 text-right">
           <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">1.0x Speed</span>
        </div>
      </div>
    </div>
  );
};