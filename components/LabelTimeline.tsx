import React from 'react';
import { RegionData } from '../types';
import { LabelControlZone } from './LabelControlZone';

interface LabelTimelineProps {
  duration: number;
  clinicalRegions: RegionData[];
  aiRegions: RegionData[];
  onSeek: (time: number) => void;
  onRegionsLoaded: (regions: RegionData[], fileName: string) => void;
  onClear: () => void;
  currentLabelFile: string | null;
}

const SwimlaneTrack: React.FC<{
  label: string;
  regions: RegionData[];
  duration: number;
  colorClass: string;
  onSeek: (time: number) => void;
  textColor?: string;
}> = ({ label, regions, duration, colorClass, onSeek, textColor = "text-slate-400" }) => {
  return (
    <div className="flex items-center h-8 border-b border-slate-800/50 last:border-0">
      {/* Label */}
      <div className={`w-32 flex-shrink-0 text-[10px] font-medium ${textColor} uppercase tracking-wider px-3 border-r border-slate-800/50 h-full flex items-center bg-slate-900/50`}>
        {label}
      </div>
      
      {/* Track */}
      <div className="flex-1 relative h-full bg-slate-900/30">
        {regions.map((region) => {
          const left = (region.start / duration) * 100;
          const width = Math.max(0.5, ((region.end - region.start) / duration) * 100); // Min width visibility
          
          return (
            <div
              key={region.id}
              onClick={() => onSeek(region.start)}
              className={`absolute top-1.5 bottom-1.5 rounded-sm cursor-pointer hover:brightness-110 transition-all ${colorClass}`}
              style={{ 
                left: `${left}%`, 
                width: `${width}%`,
                backgroundColor: region.color 
              }}
              title={`${region.content} (${region.start.toFixed(1)}s - ${region.end.toFixed(1)}s)`}
            />
          );
        })}
      </div>
    </div>
  );
};

export const LabelTimeline: React.FC<LabelTimelineProps> = ({
  duration,
  clinicalRegions,
  aiRegions,
  onSeek,
  onRegionsLoaded,
  onClear,
  currentLabelFile
}) => {
  
  const wheezeRegions = clinicalRegions.filter(r => r.content.toLowerCase().includes('wheeze'));
  const crackleRegions = clinicalRegions.filter(r => r.content.toLowerCase().includes('crackle'));
  
  // Show Drop Zone if no clinical labels are loaded
  const showDropZone = clinicalRegions.length === 0;

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden my-2 select-none">
      
      {/* Header / Info */}
      <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Temporal Analysis Swimlanes</span>
        {duration > 0 && <span className="text-[10px] text-slate-600 font-mono">Total Duration: {duration.toFixed(1)}s</span>}
      </div>

      <div className="relative">
        {/* Human Lanes */}
        {showDropZone ? (
             <div className="p-1">
                 <LabelControlZone 
                    onRegionsLoaded={onRegionsLoaded}
                    onClear={onClear}
                    hasLabels={false}
                    currentLabelFile={null}
                 />
             </div>
        ) : (
             <div className="relative">
                 {/* Close button for labels */}
                 <div className="absolute top-0 left-0 z-10 w-full h-full pointer-events-none">
                    {/* Just visual structure, the logic is in tracks */}
                 </div>
                 
                 <SwimlaneTrack 
                    label="Human: Wheezes" 
                    regions={wheezeRegions} 
                    duration={duration} 
                    colorClass="opacity-80 hover:opacity-100" 
                    onSeek={onSeek}
                    textColor="text-red-400"
                 />
                 <SwimlaneTrack 
                    label="Human: Crackles" 
                    regions={crackleRegions} 
                    duration={duration} 
                    colorClass="opacity-80 hover:opacity-100" 
                    onSeek={onSeek}
                    textColor="text-amber-400"
                 />
                 
                 {/* Small overlay to clear labels if needed */}
                 <div className="absolute top-1 right-2 z-20">
                    <LabelControlZone 
                        onRegionsLoaded={onRegionsLoaded}
                        onClear={onClear}
                        hasLabels={true}
                        currentLabelFile={currentLabelFile}
                    />
                 </div>
             </div>
        )}

        {/* AI Lane - Only show if data exists or if we want a placeholder */}
        <SwimlaneTrack 
            label="AI Diagnosis" 
            regions={aiRegions} 
            duration={duration} 
            colorClass="opacity-90 hover:opacity-100 shadow-[0_0_10px_rgba(168,85,247,0.3)]" 
            onSeek={onSeek}
            textColor="text-purple-400"
        />
      </div>
    </div>
  );
};