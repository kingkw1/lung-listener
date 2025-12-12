import React, { useRef, useState, useEffect } from 'react';
import { RegionData } from '../types';
import { LabelControlZone } from './LabelControlZone';
import { FileText } from 'lucide-react';

interface TimelineTrackProps {
  duration: number;
  clinicalRegions: RegionData[];
  aiRegions: RegionData[];
  onSeek: (time: number) => void;
  onRegionsLoaded: (regions: RegionData[], fileName: string) => void;
  onClear: () => void;
  currentLabelFile: string | null;
  currentTime?: number;
  zoomLevel: number;
  isDarkMode: boolean;
}

interface SwimlaneData {
  id: string;
  label: string;
  regions: RegionData[];
  colorClass: string;
  badgeColor: string;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  duration,
  clinicalRegions,
  aiRegions,
  onSeek,
  onRegionsLoaded,
  onClear,
  currentLabelFile,
  currentTime = 0,
  zoomLevel,
  isDarkMode
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Drag State for visibility
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);

  // Resize Observer to handle responsive width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const wheezeRegions = clinicalRegions.filter(r => r.content.toLowerCase().includes('wheeze'));
  const crackleRegions = clinicalRegions.filter(r => r.content.toLowerCase().includes('crackle'));
  
  // Show Drop Zone overlay ONLY if no human labels file is loaded AND no AI labels are present.
  const showDropZone = !currentLabelFile && aiRegions.length === 0;

  // --- NEW ROBUST SCROLLING LOGIC ---
  const currentPixel = currentTime * zoomLevel;
  const contentWidth = duration * zoomLevel;
  
  // Ensure the track fills the container at minimum
  const totalScrollableWidth = Math.max(containerWidth, contentWidth);
  const maxScroll = Math.max(0, totalScrollableWidth - containerWidth);
  const halfWidth = containerWidth / 2;

  let scrollLeft = 0;
  let cursorLeft = 0;

  if (currentPixel < halfWidth) {
      // Phase 1: Beginning (Cursor moves, Viewport fixed at 0)
      scrollLeft = 0;
      cursorLeft = currentPixel;
  } else if (currentPixel > totalScrollableWidth - halfWidth) {
      // Phase 3: End (Cursor moves, Viewport fixed at max)
      scrollLeft = maxScroll;
      cursorLeft = currentPixel - maxScroll;
  } else {
      // Phase 2: Middle (Cursor fixed at center, Viewport scrolls)
      scrollLeft = currentPixel - halfWidth;
      cursorLeft = halfWidth; 
  }

  scrollLeft = Math.round(scrollLeft);
  
  // Define Swimlanes
  const lanes: SwimlaneData[] = [
    { id: 'wheeze', label: 'Wheezes', regions: wheezeRegions, colorClass: 'border-l border-white/20 opacity-90', badgeColor: 'text-red-400' },
    { id: 'crackle', label: 'Crackles', regions: crackleRegions, colorClass: 'border-l border-white/20 opacity-90', badgeColor: 'text-amber-400' },
  ];

  if (aiRegions.length > 0) {
    lanes.push({ id: 'ai', label: 'Gemini AI', regions: aiRegions, colorClass: 'shadow-[0_0_8px_rgba(168,85,247,0.3)] opacity-80', badgeColor: 'text-purple-400' });
  }

  // Row Height Calculation
  const rowHeight = 36; // px

  // --- Drag & Drop Visibility Handlers ---
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); 
  };

  return (
    <div 
        ref={containerRef} 
        className={`w-full h-full relative overflow-hidden group ${isDarkMode ? 'bg-slate-900/20' : 'bg-slate-100/50'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
    >
      
      {showDropZone ? (
         <div className={`absolute inset-0 z-50 p-2 backdrop-blur-[1px] ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
            <LabelControlZone 
                onRegionsLoaded={onRegionsLoaded}
                onClear={onClear}
                hasLabels={false}
                currentLabelFile={null}
            />
         </div>
      ) : (
        <>
            {/* --- SCROLLING CONTENT LAYER --- */}
            <div 
                className="absolute top-0 h-full will-change-transform"
                style={{ 
                    width: `${totalScrollableWidth}px`,
                    transform: `translateX(-${scrollLeft}px)` 
                }}
            >
                {/* Background Grid (1s intervals) */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-10" 
                    style={{ 
                        backgroundImage: `linear-gradient(90deg, ${isDarkMode ? '#475569' : '#94a3b8'} 1px, transparent 1px)`, 
                        backgroundSize: `${zoomLevel}px 100%` 
                    }}
                />

                {/* Swimlanes Data */}
                {lanes.map((lane, index) => (
                    <div 
                        key={lane.id} 
                        className={`absolute w-full border-b ${isDarkMode ? 'border-slate-800/30' : 'border-slate-200/50'}`}
                        style={{ 
                            top: index * rowHeight, 
                            height: rowHeight 
                        }}
                    >
                        {lane.regions.map(region => (
                            <div
                                key={region.id}
                                onClick={(e) => { e.stopPropagation(); onSeek(region.start); }}
                                className={`absolute top-1 bottom-1 rounded-sm cursor-pointer hover:brightness-125 transition-all ${lane.colorClass}`}
                                style={{
                                    left: `${region.start * zoomLevel}px`,
                                    width: `${Math.max(2, (region.end - region.start) * zoomLevel)}px`,
                                    backgroundColor: region.color
                                }}
                                title={lane.id === 'ai' ? 'Gemini 3 Pro Prediction' : `${region.content} (${region.start.toFixed(2)}s - ${region.end.toFixed(2)}s)`}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* --- INDEPENDENT PLAYHEAD LAYER --- */}
            <div 
                className={`absolute top-0 bottom-0 w-0.5 z-40 pointer-events-none ${isDarkMode ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'bg-teal-600 shadow-[0_0_4px_rgba(13,148,136,0.4)]'}`}
                style={{ left: `${cursorLeft}px` }}
            />

            {/* --- FIXED OVERLAY LAYER (Labels) --- */}
            <div className="absolute inset-0 pointer-events-none">
                {lanes.map((lane, index) => (
                    <div 
                        key={lane.id}
                        className="absolute left-0 w-full flex items-center px-2 border-b border-transparent"
                        style={{ 
                            top: index * rowHeight, 
                            height: rowHeight 
                        }}
                    >
                         <div className={`px-1.5 py-0.5 rounded backdrop-blur-sm text-[9px] font-bold uppercase tracking-wider shadow-sm border ${lane.badgeColor} ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
                             {lane.label}
                         </div>
                    </div>
                ))}
            </div>

            {/* Clear Button / Upload Overlay */}
            <div className={`absolute top-2 right-2 z-50 pointer-events-auto transition-opacity duration-200 flex flex-col items-end space-y-2 ${isDraggingOver ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className="w-64 scale-90 origin-top-right">
                    <LabelControlZone 
                        onRegionsLoaded={onRegionsLoaded}
                        onClear={onClear}
                        hasLabels={!!currentLabelFile}
                        currentLabelFile={currentLabelFile}
                    />
                </div>
            </div>

            {/* File Source Indicator */}
            {currentLabelFile && (
                <div className="absolute bottom-2 right-2 z-40 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100">
                    <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-md border backdrop-blur-sm shadow-sm ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
                        <FileText size={10} className="text-slate-500" />
                        <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mr-1">Source:</span>
                        <span className="text-[9px] text-slate-300 font-mono">{currentLabelFile}</span>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};