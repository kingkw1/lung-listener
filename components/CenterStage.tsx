import React, { useRef, useState, useEffect, DragEvent } from 'react';
import { UploadCloud, FileAudio, X } from 'lucide-react';
import { AudioFile } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { motion, AnimatePresence } from 'framer-motion';

// Imports from the import map
import WaveSurfer from 'wavesurfer.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';

interface CenterStageProps {
  currentFile: AudioFile | null;
  setCurrentFile: React.Dispatch<React.SetStateAction<AudioFile | null>>;
}

export const CenterStage: React.FC<CenterStageProps> = ({ currentFile, setCurrentFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wavesurfer Refs & State
  const waveformRef = useRef<HTMLDivElement>(null);
  const spectrogramRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Audio State for the Player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize WaveSurfer when a file is present
  useEffect(() => {
    if (!currentFile) return;

    // Reset UI State immediately
    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    let ws: WaveSurfer | null = null;
    let initTimer: number;

    // We need a slight delay to allow Framer Motion to mount the refs into the DOM
    // and for the container to have calculated dimensions.
    const initWaveSurfer = () => {
      if (!waveformRef.current || !spectrogramRef.current) return;

      // Clean up existing instance if any (though useEffect cleanup handles this mostly)
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#06b6d4', // Cyan-500
        progressColor: '#0e7490', // Cyan-700
        cursorColor: '#ffffff',
        barWidth: 2,
        barGap: 3,
        height: 100, // Explicit height for waveform
        normalize: true,
        minPxPerSec: 100,
        fillParent: true,
        interact: true,
        hideScrollbar: false,
        autoScroll: true,
        plugins: [
          Spectrogram.create({
            container: spectrogramRef.current!,
            labels: true,
            height: 250, // Height for the spectrogram canvas
            labelsColor: '#94a3b8', // Slate-400
            labelsBackground: 'rgba(2, 6, 23, 0.9)', // Slate-950
            splitChannels: false,
            frequencyMin: 0,
            frequencyMax: 8000,
            fftSamples: 1024,
          }),
        ],
      });

      // Load audio
      ws.load(currentFile.url);

      // Event Listeners
      ws.on('ready', () => {
        setIsReady(true);
        setDuration(ws.getDuration());
        ws.setVolume(isMuted ? 0 : volume);
      });

      // 'timeupdate' is more reliable than 'audioprocess' in v7 for UI sync
      ws.on('timeupdate', (time) => {
        setCurrentTime(time);
      });

      ws.on('interaction', () => {
        const t = ws?.getCurrentTime() || 0;
        setCurrentTime(t);
        // If user interacts, we might want to ensure playing state matches
        if(ws?.isPlaying()) setIsPlaying(true);
      });

      ws.on('play', () => setIsPlaying(true));
      ws.on('pause', () => setIsPlaying(false));
      ws.on('finish', () => setIsPlaying(false));
      
      wavesurferRef.current = ws;
    };

    // 100ms delay to ensure DOM is painted and has width
    initTimer = window.setTimeout(initWaveSurfer, 100);

    return () => {
      window.clearTimeout(initTimer);
      if (ws) {
        ws.destroy();
      }
      wavesurferRef.current = null;
    };
  }, [currentFile]); 

  // Control Handlers
  const handleTogglePlay = () => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.playPause();
    }
  };

  const handleSeek = (time: number) => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.setTime(time);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (wavesurferRef.current && !isMuted) {
      wavesurferRef.current.setVolume(newVol);
    }
  };

  const handleToggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    if (wavesurferRef.current) {
      if (newMuteState) {
        wavesurferRef.current.setVolume(0);
      } else {
        wavesurferRef.current.setVolume(volume);
      }
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (files: FileList) => {
    if (files.length > 0) {
      const file = files[0];
      const url = URL.createObjectURL(file);
      setCurrentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        url: url
      });
    }
  };

  const clearFile = () => {
    if (currentFile) {
      URL.revokeObjectURL(currentFile.url);
    }
    setCurrentFile(null);
    setIsReady(false);
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Top: Header/Status */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur z-20">
        <h2 className="text-slate-200 font-medium">Signal Lab</h2>
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${isReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`}></span>
          <span className="text-xs text-slate-500 uppercase tracking-wider">{currentFile ? (isReady ? 'Analysis Ready' : 'Loading Signal...') : 'Awaiting Signal'}</span>
        </div>
      </header>

      {/* Middle: Workspace */}
      <div className="flex-1 relative p-6 flex flex-col space-y-4 overflow-hidden bg-slate-950">
        
        {/* Upload/Drop Zone - Shows only when no file is present */}
        <AnimatePresence mode="wait">
          {!currentFile && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer
                ${isDragging ? 'border-cyan-500 bg-cyan-900/10' : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 hover:border-slate-600'}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="audio/*,.wav,.mp3"
                onChange={handleFileInput}
              />
              <div className="p-4 rounded-full bg-slate-800 mb-4 text-cyan-400">
                <UploadCloud size={48} />
              </div>
              <h3 className="text-lg font-medium text-slate-200 mb-2">Drag respiratory audio here</h3>
              <p className="text-slate-500 text-sm">Supports .WAV, .MP3 (Max 50MB)</p>
            </motion.div>
          )}

          {/* Visualization Stage - Shows when file IS present */}
          {currentFile && (
            <motion.div 
              key="viz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              {/* File Info Bar */}
              <div className="flex-shrink-0 flex items-center justify-between bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-700 mb-4">
                <div className="flex items-center space-x-3">
                  <FileAudio className="text-cyan-400" size={20} />
                  <div>
                    <div className="text-sm font-medium text-slate-200">{currentFile.name}</div>
                    <div className="text-xs text-slate-500">{(currentFile.size / 1024 / 1024).toFixed(2)} MB • Signal Loaded</div>
                  </div>
                </div>
                <button 
                  onClick={clearFile}
                  className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Visualization Container */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden">
                
                {/* Waveform Area */}
                <div className="h-1/3 relative border-b border-slate-800 bg-slate-900/50">
                    <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded text-[10px] text-cyan-500 font-mono tracking-wider bg-slate-950/80 border border-slate-800 pointer-events-none">
                      AMPLITUDE
                    </div>
                    {/* WAVESURFER CONTAINER */}
                    <div ref={waveformRef} className="w-full h-full" />
                </div>

                {/* Spectrogram Area */}
                <div className="flex-1 relative bg-black">
                     <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded text-[10px] text-amber-500 font-mono tracking-wider bg-slate-950/80 border border-slate-800 pointer-events-none">
                      SPECTROGRAM (Hz)
                    </div>
                    {/* SPECTROGRAM CONTAINER */}
                    {/* Note: Spectrogram plugin generates a canvas that tries to fit. We give it full size. */}
                    <div ref={spectrogramRef} className="w-full h-full overflow-hidden [&>div]:h-full [&>canvas]:w-full [&>canvas]:h-full" />
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: Player Controls */}
      <div className="h-24 bg-slate-900 border-t border-slate-800 p-4 z-20">
        <AudioPlayer 
            disabled={!isReady}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
        />
      </div>

    </div>
  );
};