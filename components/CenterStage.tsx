import React, { useRef, useState, useEffect, DragEvent } from 'react';
import { UploadCloud, FileAudio, X } from 'lucide-react';
import { AudioFile } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { DebugLog } from './DebugLog';
import { motion, AnimatePresence } from 'framer-motion';

// Imports from the import map
import WaveSurfer from 'wavesurfer.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';

interface CenterStageProps {
  currentFile: AudioFile | null;
  setCurrentFile: React.Dispatch<React.SetStateAction<AudioFile | null>>;
}

// --- SCIENTIFIC HELPER FUNCTIONS ---

// Generate a Plasma-like colormap (Blue -> Purple -> Red -> Yellow)
// Returns array of [r, g, b, a] (0-1 range for WaveSurfer Spectrogram)
const getPlasmaColormap = () => {
    const colors = [];
    for (let i = 0; i < 256; i++) {
        const t = i / 255;
        let r = 0, g = 0, b = 0;

        if (t < 0.25) {
            // Blue -> Purple
            const localT = t / 0.25;
            r = Math.floor(128 * localT);
            g = 0;
            b = Math.floor(255 - (127 * localT));
        } else if (t < 0.5) {
            // Purple -> Red
            const localT = (t - 0.25) / 0.25;
            r = Math.floor(128 + (127 * localT));
            g = 0;
            b = Math.floor(128 - (128 * localT));
        } else if (t < 0.75) {
            // Red -> Orange
            const localT = (t - 0.5) / 0.25;
            r = 255;
            g = Math.floor(165 * localT);
            b = 0;
        } else {
            // Orange -> Yellow
            const localT = (t - 0.75) / 0.25;
            r = 255;
            g = Math.floor(165 + (90 * localT));
            b = 0;
        }
        colors.push([r / 255, g / 255, b / 255, 1]);
    }
    return colors;
};

export const CenterStage: React.FC<CenterStageProps> = ({ currentFile, setCurrentFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single container ref for both Waveform and Spectrogram
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Audio State for the Player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Logging State
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs(prev => [...prev, `${timestamp}: ${msg}`]);
  };

  // Initialize WaveSurfer when a file is present
  useEffect(() => {
    if (!currentFile) return;

    // Reset UI State
    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    
    addLog(`File loaded: ${currentFile.name} (${currentFile.type})`);

    let ws: WaveSurfer | null = null;
    let initTimer: number;

    const initWaveSurfer = (attempt = 1) => {
      try {
        // 1. Check if Ref is mounted
        if (!containerRef.current) {
          if (attempt <= 10) {
             addLog(`Waiting for DOM container (Attempt ${attempt}/10)...`);
             initTimer = window.setTimeout(() => initWaveSurfer(attempt + 1), 200);
             return;
          } else {
             addLog("Error: DOM container failed to mount.");
             return;
          }
        }

        // 2. Check dimensions
        const width = containerRef.current.clientWidth;
        if (width === 0) {
           if (attempt <= 20) {
             addLog(`Container has 0 width, layout pending (Attempt ${attempt}/20)...`);
             initTimer = window.setTimeout(() => initWaveSurfer(attempt + 1), 100);
             return;
           }
        }

        addLog(`Container ready. Width: ${width}px`);

        // 3. Clean up existing instance
        if (wavesurferRef.current) {
          addLog("Destroying previous instance");
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }

        addLog("Initializing WaveSurfer Engine...");

        // 4. Create Instance
        // We use a single container. WaveSurfer renders the waveform here.
        // Spectrogram will be appended inside this container by the plugin.
        ws = WaveSurfer.create({
          container: containerRef.current,
          waveColor: '#06b6d4',      // Medical Cyan
          progressColor: '#cffafe',  // Bright Cyan for progress
          cursorColor: '#ffffff',    // White cursor
          cursorWidth: 2,
          barWidth: 2,
          barGap: 3,
          height: 100,               // Waveform Height
          normalize: true,
          minPxPerSec: 50,
          fillParent: true,
          autoScroll: true,
          plugins: [
            Spectrogram.create({
              labels: true,
              height: 160,           // Spectrogram Height
              labelsColor: '#94a3b8',
              labelsBackground: 'rgba(2, 6, 23, 0.9)',
              frequencyMin: 0,
              frequencyMax: 4000,    // Optimized for lung sounds
              fftSamples: 1024,
              colorMap: getPlasmaColormap(), // Custom Scientific Color
            }),
            Timeline.create({
              height: 20,
              timeInterval: 1,
              primaryLabelInterval: 5,
              style: {
                  fontSize: '10px',
                  color: '#64748b',
              }
            })
          ],
        });

        // Load Audio
        ws.load(currentFile.url);

        // 5. Setup Listeners
        ws.on('ready', () => {
          addLog("Event: Ready. Signal processed.");
          setIsReady(true);
          setDuration(ws!.getDuration());
          ws!.setVolume(isMuted ? 0 : volume);

          // --- CSS HACK FOR FULL HEIGHT CURSOR ---
          // By default, the cursor sits inside the Waveform wrapper which has overflow:hidden.
          // We need to allow overflow and force the cursor height to cover the spectrogram.
          const wrapper = ws!.getWrapper();
          if (wrapper) {
             wrapper.style.overflow = 'visible';
             wrapper.style.zIndex = '10'; // Ensure cursor sits on top of spectrogram
             
             // Find the cursor element. WaveSurfer doesn't expose it directly easily, 
             // but it's usually part of the shadow DOM or a child div.
             // We inject a style into the container to target it.
             const styleId = 'wavesurfer-cursor-override';
             if (!document.getElementById(styleId)) {
                 const style = document.createElement('style');
                 style.id = styleId;
                 // Target the wrapper's shadow root cursor OR the element if no shadow root
                 // WaveSurfer v7 puts cursor in the wrapper.
                 style.innerHTML = `
                    #viz-container ::part(cursor) {
                        height: 300px !important;
                        top: 0 !important;
                        background-color: rgba(255, 255, 255, 0.8) !important;
                    }
                    /* Fallback if no shadow dom parts used in this version */
                    #viz-container .wavesurfer-cursor {
                        height: 300px !important; 
                        top: 0 !important;
                    }
                 `;
                 document.head.appendChild(style);
             }
          }
        });

        ws.on('timeupdate', (time) => setCurrentTime(time));
        ws.on('finish', () => setIsPlaying(false));
        ws.on('error', (err) => addLog(`WaveSurfer Error: ${err}`));
        
        wavesurferRef.current = ws;

      } catch (error: any) {
        addLog(`CRITICAL INITIALIZATION ERROR: ${error.message}`);
        console.error(error);
      }
    };

    initWaveSurfer(1);

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
      if (isPlaying) {
          wavesurferRef.current.pause();
          setIsPlaying(false);
      } else {
          wavesurferRef.current.play();
          setIsPlaying(true);
      }
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
      wavesurferRef.current.setVolume(newMuteState ? 0 : volume);
    }
  };

  // Drag & Drop
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
    if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (files: FileList) => {
    const file = files[0];
    addLog(`Processing file: ${file.name}`);
    const url = URL.createObjectURL(file);
    setCurrentFile({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      url: url
    });
  };

  const clearFile = () => {
    addLog("Clearing file");
    if (currentFile) {
      URL.revokeObjectURL(currentFile.url);
    }
    setCurrentFile(null);
    setIsReady(false);
    setLogs([]); 
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur z-20">
        <h2 className="text-slate-200 font-medium">Signal Lab</h2>
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${isReady ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'bg-slate-700'}`}></span>
          <span className="text-xs text-slate-500 uppercase tracking-wider">{currentFile ? (isReady ? 'Analysis Ready' : 'Loading Signal...') : 'Awaiting Signal'}</span>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 relative p-6 flex flex-col space-y-4 overflow-hidden bg-slate-950">
        <AnimatePresence mode="wait">
          {!currentFile && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
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

          {currentFile && (
            <motion.div 
              key="viz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              {/* File Info */}
              <div className="flex-shrink-0 flex items-center justify-between bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-700 mb-4">
                <div className="flex items-center space-x-3">
                  <FileAudio className="text-cyan-400" size={20} />
                  <div>
                    <div className="text-sm font-medium text-slate-200">{currentFile.name}</div>
                    <div className="text-xs text-slate-500">{(currentFile.size / 1024 / 1024).toFixed(2)} MB • {(duration).toFixed(1)}s</div>
                  </div>
                </div>
                <button 
                  onClick={clearFile}
                  className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Combined Visualization Container */}
              <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden flex flex-col">
                  {/* Title Overlays */}
                  <div className="absolute top-2 left-2 z-20 pointer-events-none">
                     <span className="bg-slate-950/80 border border-slate-800 text-cyan-500 text-[10px] px-2 py-0.5 rounded font-mono">AMPLITUDE</span>
                  </div>
                  <div className="absolute top-[110px] left-2 z-20 pointer-events-none">
                     <span className="bg-slate-950/80 border border-slate-800 text-amber-500 text-[10px] px-2 py-0.5 rounded font-mono">SPECTROGRAM (0-4kHz)</span>
                  </div>

                  {/* The Main Container: WaveSurfer renders waveform here, and appends Spectrogram below it */}
                  <div id="viz-container" ref={containerRef} className="w-full h-full relative" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 z-20">
        <div className="h-24 p-4">
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
        <DebugLog logs={logs} />
      </div>
    </div>
  );
};