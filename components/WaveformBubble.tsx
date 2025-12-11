import React, { useRef, useState, useEffect } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { RegionData } from '../types';

// Imports from the import map
import WaveSurfer from 'wavesurfer.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';

interface WaveformBubbleProps {
  audioUrl: string;
  title: string;
  waveColor: string;
  progressColor: string;
  regions: RegionData[];
  showLabels: boolean;
  onLog: (msg: string) => void;
  onReady?: (duration: number) => void;
  height?: number; // Optional height override
}

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

export const WaveformBubble: React.FC<WaveformBubbleProps> = ({
  audioUrl,
  title,
  waveColor,
  progressColor,
  regions,
  showLabels,
  onLog,
  onReady,
  height = 100
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<any>(null);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!audioUrl) return;

    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    let ws: WaveSurfer | null = null;
    let initTimer: number;

    const initWaveSurfer = (attempt = 1) => {
      try {
        if (!containerRef.current) {
          if (attempt <= 10) {
             initTimer = window.setTimeout(() => initWaveSurfer(attempt + 1), 200);
             return;
          }
          onLog("Error: DOM container failed to mount.");
          return;
        }

        const width = containerRef.current.clientWidth;
        if (width === 0) {
           if (attempt <= 20) {
             initTimer = window.setTimeout(() => initWaveSurfer(attempt + 1), 100);
             return;
           }
        }

        // Clean up previous
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }

        onLog(`Initializing Visualization: ${title}...`);

        const wsRegions = RegionsPlugin.create();
        regionsPluginRef.current = wsRegions;

        ws = WaveSurfer.create({
          container: containerRef.current,
          waveColor: waveColor,
          progressColor: progressColor,
          cursorColor: '#ffffff',
          cursorWidth: 2,
          barWidth: 2,
          barGap: 3,
          height: height,
          normalize: true,
          minPxPerSec: 50,
          fillParent: true,
          autoScroll: true,
          plugins: [
            Spectrogram.create({
              labels: true,
              height: 160,
              labelsColor: '#94a3b8',
              labelsBackground: 'rgba(2, 6, 23, 0.9)',
              frequencyMin: 0,
              frequencyMax: 4000,
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

        ws.load(audioUrl);

        ws.on('ready', () => {
          onLog(`${title} Ready.`);
          setIsReady(true);
          const d = ws!.getDuration();
          setDuration(d);
          if (onReady) onReady(d);
          ws!.setVolume(isMuted ? 0 : volume);
          injectStyles();
        });

        ws.on('timeupdate', (time) => setCurrentTime(time));
        ws.on('finish', () => setIsPlaying(false));
        ws.on('error', (err) => onLog(`WaveSurfer Error: ${err}`));
        
        wavesurferRef.current = ws;

      } catch (error: any) {
        onLog(`Init Error: ${error.message}`);
        console.error(error);
      }
    };

    initWaveSurfer(1);

    return () => {
      window.clearTimeout(initTimer);
      if (ws) ws.destroy();
      wavesurferRef.current = null;
      regionsPluginRef.current = null;
    };
  }, [audioUrl, title, waveColor, progressColor, height]);

  // --- REGIONS SYNC ---
  useEffect(() => {
      if (!regionsPluginRef.current || !isReady) return;
      
      const plugin = regionsPluginRef.current;
      plugin.clearRegions();

      regions.forEach(r => {
          plugin.addRegion({
              id: r.id,
              start: r.start,
              end: r.end,
              content: r.content,
              color: r.color,
              drag: false,
              resize: false
          });
      });
  }, [regions, isReady]);

  // --- VISIBILITY SYNC ---
  useEffect(() => {
      if (!regionsPluginRef.current) return;
      const regs = regionsPluginRef.current.getRegions();
      regs.forEach((r: any) => {
          if (r.element) r.element.style.display = showLabels ? 'block' : 'none';
      });
  }, [showLabels, regions, isReady]);

  const injectStyles = () => {
     const wrapper = wavesurferRef.current?.getWrapper();
     if (wrapper) {
         wrapper.style.overflow = 'visible';
         wrapper.style.zIndex = '10';
         // We use a unique ID for the style tag based on the title to avoid collisions if multiple bubbles
         const styleId = `wavesurfer-overrides-${title.replace(/\s+/g, '-')}`;
         if (!document.getElementById(styleId)) {
             const style = document.createElement('style');
             style.id = styleId;
             const containerId = containerRef.current?.id || 'viz-container';
             // Scope styles to this container if possible, but for ShadowDOM parts it is global-ish
             // We inject globally but target the class logic
             style.innerHTML = `
                .wavesurfer-wrapper ::part(cursor) { height: 100% !important; top: 0 !important; background-color: rgba(255, 255, 255, 0.8) !important; }
                .wavesurfer-region { height: 100% !important; top: 0 !important; z-index: 4 !important; border-left: 1px solid rgba(255,255,255,0.4); border-right: 1px solid rgba(255,255,255,0.4); }
                ::part(region-content) { color: white; font-family: monospace; font-size: 10px; padding: 4px; text-transform: uppercase; letter-spacing: 1px; background: rgba(0,0,0,0.5); }
             `;
             document.head.appendChild(style);
         }
     }
  };

  const handleTogglePlay = () => {
    if (wavesurferRef.current && isReady) {
      isPlaying ? wavesurferRef.current.pause() : wavesurferRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden">
        {/* Viz Container */}
        <div ref={containerRef} className="wavesurfer-wrapper flex-1 relative w-full h-full" />
        
        {/* Title Overlay */}
        <div className="absolute top-2 left-2 z-20 pointer-events-none">
            <span className={`bg-slate-950/80 border border-slate-800 text-[10px] px-2 py-0.5 rounded font-mono ${waveColor === '#22c55e' ? 'text-green-400' : 'text-cyan-500'}`}>
                {title.toUpperCase()}
            </span>
        </div>
        
        {/* Controls Footer */}
        <div className="h-20 px-4 py-2 border-t border-slate-800 bg-slate-900 z-30">
            <AudioPlayer
                disabled={!isReady}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                isMuted={isMuted}
                onTogglePlay={handleTogglePlay}
                onSeek={(t) => wavesurferRef.current?.setTime(t)}
                onVolumeChange={(v) => { setVolume(v); wavesurferRef.current?.setVolume(isMuted ? 0 : v); }}
                onToggleMute={() => { setIsMuted(!isMuted); wavesurferRef.current?.setVolume(!isMuted ? 0 : volume); }}
            />
        </div>
    </div>
  );
};