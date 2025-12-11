import React, { useRef, useState, useEffect } from 'react';

// Imports from the import map
import WaveSurfer from 'wavesurfer.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';

interface WaveformTrackProps {
  audioUrl: string;
  waveColor: string;
  progressColor: string;
  onReady?: (duration: number) => void;
  seekTo?: number | null; 
  onSeek?: (time: number) => void;
  // Master Clock Props
  isPlaying: boolean;
  volume: number;
  onTimeUpdate?: (time: number) => void; // Only provided if this track is the driver
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

export const WaveformTrack: React.FC<WaveformTrackProps> = ({
  audioUrl,
  waveColor,
  progressColor,
  onReady,
  seekTo,
  onSeek,
  isPlaying,
  volume,
  onTimeUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!audioUrl) return;

    setIsReady(false);

    let ws: WaveSurfer | null = null;
    let initTimer: number;

    const initWaveSurfer = (attempt = 1) => {
      try {
        if (!containerRef.current) {
          if (attempt <= 10) {
             initTimer = window.setTimeout(() => initWaveSurfer(attempt + 1), 200);
             return;
          }
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

        ws = WaveSurfer.create({
          container: containerRef.current,
          waveColor: waveColor,
          progressColor: progressColor,
          cursorColor: '#ffffff',
          cursorWidth: 1, // Thinner cursor for track view
          barWidth: 2,
          barGap: 3,
          height: 100, 
          normalize: true,
          minPxPerSec: 50,
          fillParent: true,
          autoScroll: true,
          interact: true, 
          plugins: [
            Spectrogram.create({
              labels: true,
              height: 140, 
              labelsColor: '#64748b',
              labelsBackground: 'transparent',
              frequencyMin: 0,
              frequencyMax: 4000,
              fftSamples: 1024,
              colorMap: getPlasmaColormap(), 
            }),
          ],
        });

        ws.load(audioUrl);

        ws.on('ready', () => {
          setIsReady(true);
          const d = ws!.getDuration();
          if (onReady) onReady(d);
          injectStyles();
          
          // Apply initial volume/state
          ws!.setVolume(volume);
        });

        // If this track is the DRIVER, report time updates
        if (onTimeUpdate) {
            ws.on('timeupdate', (time) => {
                onTimeUpdate(time);
            });
        }
        
        // Report interactions (scrubbing)
        ws.on('interaction', () => {
             const t = ws!.getCurrentTime();
             if (onSeek) onSeek(t);
        });
        
        wavesurferRef.current = ws;

      } catch (error: any) {
        console.error(error);
      }
    };

    initWaveSurfer(1);

    return () => {
      window.clearTimeout(initTimer);
      if (ws) ws.destroy();
      wavesurferRef.current = null;
    };
  }, [audioUrl, waveColor, progressColor]);

  // Master Clock Sync: Play/Pause
  useEffect(() => {
      if (wavesurferRef.current && isReady) {
          if (isPlaying) {
              wavesurferRef.current.play();
          } else {
              wavesurferRef.current.pause();
          }
      }
  }, [isPlaying, isReady]);

  // Master Clock Sync: Volume
  useEffect(() => {
      if (wavesurferRef.current && isReady) {
          wavesurferRef.current.setVolume(volume);
      }
  }, [volume, isReady]);

  // Master Clock Sync: Seeking
  useEffect(() => {
    if (seekTo !== undefined && seekTo !== null && wavesurferRef.current && isReady) {
        // Only seek if the difference is significant (> 0.1s) to prevent jitter loops
        const current = wavesurferRef.current.getCurrentTime();
        if (Math.abs(current - seekTo) > 0.15) {
            wavesurferRef.current.setTime(seekTo);
        }
    }
  }, [seekTo, isReady]);

  const injectStyles = () => {
     const wrapper = wavesurferRef.current?.getWrapper();
     if (wrapper) {
         wrapper.style.overflow = 'visible';
         wrapper.style.zIndex = '10';
         const styleId = `ws-track-style-${waveColor.replace('#', '')}`;
         if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                .wavesurfer-wrapper ::part(cursor) { height: 100% !important; top: 0 !important; background-color: rgba(255, 255, 255, 0.5) !important; }
                .wavesurfer-wrapper ::part(scroll) { scrollbar-width: none; }
                .wavesurfer-wrapper ::part(scroll)::-webkit-scrollbar { display: none; }
            `;
            document.head.appendChild(style);
         }
     }
  };

  return (
    <div className="w-full h-full relative group">
        <div ref={containerRef} className="wavesurfer-wrapper w-full h-full" />
    </div>
  );
};