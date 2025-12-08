import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';

interface AudioPlayerProps {
  fileUrl?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ fileUrl }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      if (fileUrl) {
        audioRef.current.load();
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      }
    }
  }, [fileUrl]);

  const togglePlay = () => {
    if (!fileUrl || !audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(current);
      setDuration(dur);
      if (dur > 0) {
        setProgress((current / dur) * 100);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = (Number(e.target.value) / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setProgress(Number(e.target.value));
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col justify-center space-y-2">
      <audio 
        ref={audioRef} 
        src={fileUrl} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={() => setIsPlaying(false)}
      />

      {/* Progress Bar */}
      <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
        <span className="w-10 text-right">{formatTime(currentTime)}</span>
        <div className="flex-1 relative h-1.5 bg-slate-700 rounded-full group">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress} 
            onChange={handleSeek}
            disabled={!fileUrl}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div 
            className="absolute left-0 top-0 h-full bg-cyan-500 rounded-full pointer-events-none transition-all duration-100" 
            style={{ width: `${progress}%` }} 
          />
          {fileUrl && (
             <div 
                className="absolute h-3 w-3 bg-white rounded-full -top-[3px] shadow pointer-events-none transition-all duration-100" 
                style={{ left: `calc(${progress}% - 6px)` }}
             />
          )}
        </div>
        <span className="w-10">{formatTime(duration)}</span>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between px-1">
        
        {/* Left Spacing (Volume placeholder for balance) */}
        <div className="flex items-center space-x-2 w-24">
           <button onClick={toggleMute} disabled={!fileUrl} className="text-slate-400 hover:text-slate-200 disabled:opacity-30">
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
           </button>
           <input 
             type="range" min="0" max="1" step="0.1" 
             value={volume}
             onChange={(e) => {
               const val = Number(e.target.value);
               setVolume(val);
               if(audioRef.current) audioRef.current.volume = val;
             }}
             disabled={!fileUrl}
             className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-slate-300 [&::-webkit-slider-thumb]:rounded-full"
           />
        </div>

        {/* Center: Playback */}
        <div className="flex items-center space-x-6">
           <button disabled={!fileUrl} className="text-slate-500 hover:text-slate-300 disabled:opacity-20 transition-colors">
              <SkipBack size={20} />
           </button>
           
           <button 
             onClick={togglePlay}
             disabled={!fileUrl}
             className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
               fileUrl 
                ? 'bg-slate-100 text-slate-900 hover:scale-105 hover:bg-cyan-400 hover:text-slate-900 shadow-lg shadow-cyan-900/20' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
             }`}
           >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
           </button>

           <button disabled={!fileUrl} className="text-slate-500 hover:text-slate-300 disabled:opacity-20 transition-colors">
              <SkipForward size={20} />
           </button>
        </div>

        {/* Right Spacing */}
        <div className="w-24 text-right">
           <span className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">1.0x Speed</span>
        </div>
      </div>
    </div>
  );
};