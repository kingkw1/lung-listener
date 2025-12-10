import React, { useRef, useState, useEffect, DragEvent } from 'react';
import { UploadCloud, FileAudio, X, FileText, Tag, Eye, EyeOff } from 'lucide-react';
import { AudioFile } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { DebugLog } from './DebugLog';
import { motion, AnimatePresence } from 'framer-motion';

// Imports from the import map
import WaveSurfer from 'wavesurfer.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface CenterStageProps {
  currentFile: AudioFile | null;
  setCurrentFile: React.Dispatch<React.SetStateAction<AudioFile | null>>;
  aiAnalysisOutput: string;
}

// --- SCIENTIFIC HELPER FUNCTIONS ---

// Generate a Plasma-like colormap (Blue -> Purple -> Red -> Yellow)
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

export const CenterStage: React.FC<CenterStageProps> = ({ currentFile, setCurrentFile, aiAnalysisOutput }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Single container ref for both Waveform and Spectrogram
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<any>(null); // Keep reference to regions plugin

  // Audio State for the Player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Clinical Data State
  const [hasLabels, setHasLabels] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

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
    setHasLabels(false);
    
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

        // Create Regions Plugin Instance
        const wsRegions = RegionsPlugin.create();
        regionsPluginRef.current = wsRegions;

        // 4. Create Instance
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
              colorMap: getPlasmaColormap(), 
            }),
            Timeline.create({
              height: 20,
              timeInterval: 1,
              primaryLabelInterval: 5,
              style: {
                  fontSize: '10px',
                  color: '#64748b',
              }
            }),
            wsRegions
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

          // --- CSS HACK FOR FULL HEIGHT CURSOR & REGIONS ---
          const wrapper = ws!.getWrapper();
          if (wrapper) {
             wrapper.style.overflow = 'visible';
             wrapper.style.zIndex = '10'; 
             
             const styleId = 'wavesurfer-overrides';
             if (!document.getElementById(styleId)) {
                 const style = document.createElement('style');
                 style.id = styleId;
                 style.innerHTML = `
                    /* Force cursor to span full height */
                    #viz-container ::part(cursor) {
                        height: 300px !important;
                        top: 0 !important;
                        background-color: rgba(255, 255, 255, 0.8) !important;
                    }
                    #viz-container .wavesurfer-cursor {
                        height: 300px !important; 
                        top: 0 !important;
                    }

                    /* Force regions to span full height and look nice */
                    #viz-container ::part(region) {
                        height: 300px !important;
                        top: 0 !important;
                        z-index: 4 !important; /* Above spectro, below cursor */
                        border-left: 1px solid rgba(255,255,255,0.4);
                        border-right: 1px solid rgba(255,255,255,0.4);
                    }
                    #viz-container .wavesurfer-region {
                        height: 300px !important;
                        top: 0 !important;
                        z-index: 4 !important;
                        border-left: 1px solid rgba(255,255,255,0.4);
                        border-right: 1px solid rgba(255,255,255,0.4);
                    }
                    
                    /* Region Labels */
                    #viz-container ::part(region-content) {
                        color: white;
                        font-family: monospace;
                        font-size: 10px;
                        padding: 4px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        background: rgba(0,0,0,0.5);
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
      regionsPluginRef.current = null;
    };
  }, [currentFile]); 

  // --- REGION / LABELS HANDLING ---

  useEffect(() => {
    // Toggle visibility of regions
    if (regionsPluginRef.current) {
        const regions = regionsPluginRef.current.getRegions();
        regions.forEach((r: any) => {
             if (r.element) {
                 r.element.style.display = showLabels ? 'block' : 'none';
             }
        });
    }
  }, [showLabels, hasLabels]);

  // --- AI REGION PARSING ---
  
  useEffect(() => {
    if (!aiAnalysisOutput || !regionsPluginRef.current || !showLabels) return;

    // Regex to find timestamps: e.g. "0:02 - 0:05" or "1:15 - 1:20"
    const regex = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g;
    
    let match;
    const existingRegions = regionsPluginRef.current.getRegions();

    while ((match = regex.exec(aiAnalysisOutput)) !== null) {
        const startMin = parseInt(match[1]);
        const startSec = parseInt(match[2]);
        const endMin = parseInt(match[3]);
        const endSec = parseInt(match[4]);

        const start = startMin * 60 + startSec;
        const end = endMin * 60 + endSec;

        // Check if this AI region already exists to avoid duplicates
        // We look for a region with roughly same start/end and content "AI Diagnosis"
        const alreadyExists = existingRegions.some((r: any) => {
            return (
                r.content?.innerText === 'AI Diagnosis' &&
                Math.abs(r.start - start) < 0.1 && 
                Math.abs(r.end - end) < 0.1
            );
        });

        if (!alreadyExists) {
            addLog(`AI Detection found: ${match[0]} (${start}s - ${end}s)`);
            regionsPluginRef.current.addRegion({
                start,
                end,
                content: 'AI Diagnosis',
                color: 'rgba(168, 85, 247, 0.4)', // Purple
                drag: false,
                resize: false,
            });
            // Ensure labels are on
            if (!hasLabels) setHasLabels(true);
        }
    }

  }, [aiAnalysisOutput, hasLabels, showLabels]);


  const handleLabelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      addLog(`Reading labels file: ${file.name}`);
      const reader = new FileReader();
      
      reader.onload = (event) => {
          const text = event.target?.result as string;
          if (!text || !regionsPluginRef.current) return;

          addLog("Parsing ICBHI clinical data...");
          // We intentionally do NOT clear existing AI regions here, only clinical ones if needed, 
          // but for now, let's clear everything to avoid mess, or filter.
          // Requirement says "Clear existing regions (if any) to prevent duplicates".
          // But we also want to keep AI regions. 
          // Let's remove only clinical regions (Wheeze/Crackle) before import?
          // For simplicity complying to previous prompt, we clear all or none. 
          // Let's clear all to be safe as per "Clear existing regions" instruction.
          regionsPluginRef.current.clearRegions(); 

          const lines = text.split('\n');
          let count = 0;

          lines.forEach(line => {
              if (!line.trim()) return;
              // Format: Start \t End \t Crackles \t Wheezes
              const parts = line.split('\t').map(s => s.trim());
              if (parts.length < 4) return;

              const start = parseFloat(parts[0]);
              const end = parseFloat(parts[1]);
              const crackles = parseInt(parts[2]);
              const wheezes = parseInt(parts[3]);

              if (isNaN(start) || isNaN(end)) return;

              if (wheezes === 1) {
                  regionsPluginRef.current.addRegion({
                      start,
                      end,
                      content: 'Wheeze',
                      color: 'rgba(239, 68, 68, 0.3)', // Red
                      drag: false,
                      resize: false,
                  });
                  count++;
              }
              if (crackles === 1) {
                  regionsPluginRef.current.addRegion({
                      start,
                      end,
                      content: 'Crackle',
                      color: 'rgba(234, 179, 8, 0.3)', // Yellow
                      drag: false,
                      resize: false,
                  });
                  count++;
              }
          });

          addLog(`Imported ${count} clinical regions.`);
          setHasLabels(true);
          setShowLabels(true);
      };

      reader.readAsText(file);
      // Reset input
      e.target.value = '';
  };


  // --- AUDIO CONTROLS ---

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
    // Basic check for audio
    if (!file.type.startsWith('audio/') && !file.name.endsWith('.wav')) {
        addLog(`Error: Invalid file type ${file.type}`);
        return;
    }
    
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
    setHasLabels(false);
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur z-20">
        <div className="flex items-center space-x-6">
            <h2 className="text-slate-200 font-medium">Signal Lab</h2>
            
            {/* Clinical Labels Control Group */}
            {currentFile && isReady && (
                <div className="flex items-center space-x-3 pl-6 border-l border-slate-800">
                    <input 
                        type="file" 
                        ref={labelInputRef} 
                        className="hidden" 
                        accept=".txt"
                        onChange={handleLabelImport}
                    />
                    <button 
                        onClick={() => labelInputRef.current?.click()}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors border border-slate-700"
                        title="Import ICBHI .txt file"
                    >
                        <FileText size={14} />
                        <span>Import Labels</span>
                    </button>

                    {hasLabels && (
                        <button 
                            onClick={() => setShowLabels(!showLabels)}
                            className={`flex items-center space-x-2 px-3 py-1.5 text-xs rounded transition-colors border ${
                                showLabels 
                                ? 'bg-cyan-900/30 border-cyan-700 text-cyan-400' 
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                        >
                            {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
                            <span>{showLabels ? 'Labels Visible' : 'Labels Hidden'}</span>
                        </button>
                    )}
                </div>
            )}
        </div>

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
                  
                  {/* Legend Overlay */}
                  {hasLabels && showLabels && (
                    <div className="absolute top-2 right-2 z-20 pointer-events-none flex flex-col items-end space-y-1">
                        <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-[10px] text-slate-300">WHEEZE</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-[10px] text-slate-300">CRACKLE</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-[10px] text-slate-300">AI DIAGNOSIS</span>
                        </div>
                    </div>
                  )}

                  {/* The Main Container */}
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