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
}

const PIXELS_PER_SECOND = 50; // Matches WaveSurfer default minPxPerSec

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
  currentTime = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

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
  
  // Show Drop Zone overlay ONLY if no human labels AND no AI labels are present.
  // This allows AI labels to "unlock" the view even if human labels aren't uploaded yet.
  const showDropZone = clinicalRegions.length === 0 && aiRegions.length === 0;

  // Calculate Scroll Position (Centered Playhead)
  // We want the currentTime to be roughly in the center of the container
  // scrollX = (currentTime * PPS) - (containerWidth / 2)
  const currentPixel = currentTime * PIXELS_PER_SECOND;
  const scrollLeft = Math.max(0, currentPixel - (containerWidth / 2));
  
  // Total width of the scrollable track
  const totalTrackWidth = Math.max(containerWidth, duration * PIXELS_PER_SECOND);

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

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-900/20 relative overflow-hidden group">
      
      {showDropZone ? (
         <div className="absolute inset-0 z-50 p-2 bg-slate-900/50 backdrop-blur-[1px]">
            <LabelControlZone 
                onRegionsLoaded={onRegionsLoaded}
                onClear={onClear}
                hasLabels={false}
                currentLabelFile={null}
            />
         </div>
      ) : (
        <>
            {/* --- SCROLLING LAYER --- */}
            <div 
                className="absolute top-0 h-full will-change-transform"
                style={{ 
                    width: `${totalTrackWidth}px`,
                    transform: `translateX(-${scrollLeft}px)` 
                }}
            >
                {/* Background Grid (1s intervals) */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-10" 
                    style={{ 
                        backgroundImage: 'linear-gradient(90deg, #475569 1px, transparent 1px)', 
                        backgroundSize: `${PIXELS_PER_SECOND}px 100%` 
                    }}
                />

                {/* Swimlanes Data */}
                {lanes.map((lane, index) => (
                    <div 
                        key={lane.id} 
                        className="absolute w-full border-b border-slate-800/30"
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
                                    left: `${region.start * PIXELS_PER_SECOND}px`,
                                    width: `${Math.max(2, (region.end - region.start) * PIXELS_PER_SECOND)}px`,
                                    backgroundColor: region.color
                                }}
                                title={`${region.content} (${region.start.toFixed(2)}s - ${region.end.toFixed(2)}s)`}
                            />
                        ))}
                    </div>
                ))}

                {/* Playhead Cursor (Absolute Position in Track) */}
                <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white z-40 pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                    style={{ left: `${currentPixel}px` }}
                />
            </div>

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
                         <div className={`px-1.5 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm text-[9px] font-bold uppercase tracking-wider shadow-sm border border-slate-800 ${lane.badgeColor}`}>
                             {lane.label}
                         </div>
                    </div>
                ))}
            </div>

            {/* Clear Button Overlay */}
            <div className="absolute top-2 right-2 z-50 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end space-y-2">
                
                {/* Always provide access to label uploader even if AI lane is driving the view */}
                <div className="w-64 scale-90 origin-top-right">
                    <LabelControlZone 
                        onRegionsLoaded={onRegionsLoaded}
                        onClear={onClear}
                        hasLabels={clinicalRegions.length > 0}
                        currentLabelFile={currentLabelFile}
                    />
                </div>
            </div>

            {/* File Source Indicator */}
            {currentLabelFile && (
                <div className="absolute bottom-2 right-2 z-40 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100">
                    <div className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-slate-900/80 border border-slate-800 backdrop-blur-sm shadow-sm">
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