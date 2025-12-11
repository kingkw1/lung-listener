import React from 'react';
import { RegionData } from '../types';
import { LabelControlZone } from './LabelControlZone';

interface TimelineTrackProps {
  duration: number;
  clinicalRegions: RegionData[];
  aiRegions: RegionData[];
  onSeek: (time: number) => void;
  onRegionsLoaded: (regions: RegionData[], fileName: string) => void;
  onClear: () => void;
  currentLabelFile: string | null;
}

const SwimlaneRow: React.FC<{
  label: string;
  regions: RegionData[];
  duration: number;
  colorClass: string;
  onSeek: (time: number) => void;
  heightClass?: string;
  badgeColor?: string;
}> = ({ label, regions, duration, colorClass, onSeek, heightClass = "h-8", badgeColor = "bg-slate-700 text-slate-300" }) => {
  return (
    <div className={`relative ${heightClass} border-b border-slate-800/50 w-full`}>
       {/* Badge Label (Inside Viewport) */}
       <div className={`absolute top-1 left-2 z-20 pointer-events-none px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider opacity-50 ${badgeColor}`}>
          {label}
       </div>

       {/* Regions */}
       <div className="absolute inset-0 top-1 bottom-1">
        {regions.map((region) => {
            const left = (region.start / duration) * 100;
            const width = Math.max(0.2, ((region.end - region.start) / duration) * 100); // Min width
            
            return (
                <div
                key={region.id}
                onClick={() => onSeek(region.start)}
                className={`absolute top-0 bottom-0 rounded-sm cursor-pointer hover:brightness-110 hover:z-30 transition-all border-l border-white/20 ${colorClass}`}
                style={{ 
                    left: `${left}%`, 
                    width: `${width}%`,
                    backgroundColor: region.color 
                }}
                title={`${region.content} (${region.start.toFixed(2)}s - ${region.end.toFixed(2)}s)`}
                />
            );
        })}
       </div>
    </div>
  );
};

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
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
  
  const showDropZone = clinicalRegions.length === 0;

  return (
    <div className="w-full h-full flex flex-col justify-center bg-slate-900/20 relative">
      
      {/* Background Grid Lines (1 sec intervals) - Simulation */}
      <div className="absolute inset-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'linear-gradient(90deg, #475569 1px, transparent 1px)', backgroundSize: `${(1/duration)*100}% 100%` }}>
      </div>

      {showDropZone ? (
         <div className="p-2 h-full">
            <LabelControlZone 
                onRegionsLoaded={onRegionsLoaded}
                onClear={onClear}
                hasLabels={false}
                currentLabelFile={null}
            />
         </div>
      ) : (
        <>
            <SwimlaneRow 
                label="Wheezes" 
                regions={wheezeRegions} 
                duration={duration} 
                colorClass="opacity-90" 
                onSeek={onSeek}
                badgeColor="bg-red-900/50 text-red-400"
            />
            <SwimlaneRow 
                label="Crackles" 
                regions={crackleRegions} 
                duration={duration} 
                colorClass="opacity-90" 
                onSeek={onSeek}
                badgeColor="bg-amber-900/50 text-amber-400"
            />
            
            {/* Overlay Control to clear */}
            <div className="absolute top-1 right-2 z-30 opacity-0 hover:opacity-100 transition-opacity">
                <button 
                  onClick={onClear}
                  className="px-2 py-1 text-[10px] bg-slate-800 text-red-400 border border-slate-700 rounded hover:bg-slate-700"
                >
                  Clear Labels
                </button>
            </div>
        </>
      )}

      {/* AI Lane - Always visible if data exists */}
      {aiRegions.length > 0 && (
          <SwimlaneRow 
            label="Gemini AI" 
            regions={aiRegions} 
            duration={duration} 
            colorClass="opacity-80 shadow-[0_0_8px_rgba(168,85,247,0.2)]" 
            onSeek={onSeek}
            badgeColor="bg-purple-900/50 text-purple-400"
          />
      )}
    </div>
  );
};