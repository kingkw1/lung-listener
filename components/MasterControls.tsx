import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ZoomIn, ZoomOut } from 'lucide-react';

export const MasterControls: React.FC = () => {
  return (
    <div className="h-16 border-t border-slate-800 bg-slate-950 flex items-center justify-between px-6 z-30 flex-shrink-0">
        
        {/* Left: Playback Controls */}
        <div className="flex items-center space-x-4">
             <button className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all">
                <SkipBack size={18} />
             </button>
             <button className="p-3 rounded-full bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/50 transition-all hover:scale-105 active:scale-95">
                <Play size={24} fill="currentColor" className="ml-0.5" />
             </button>
             <button className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all">
                <SkipForward size={18} />
             </button>
        </div>
        
        {/* Center: Time Display (Placeholder logic) */}
        <div className="flex items-center space-x-4 w-1/3">
            <span className="text-xs font-mono text-cyan-500 w-16 text-right">00:00.00</span>
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative cursor-pointer group">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-cyan-600/50 group-hover:bg-cyan-500 transition-colors"></div>
                {/* Scrubber handle */}
                <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-2 h-2 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-xs font-mono text-slate-500 w-16">00:00.00</span>
        </div>

        {/* Right: Tools */}
        <div className="flex items-center space-x-6">
             {/* Volume */}
             <div className="flex items-center space-x-2">
                 <Volume2 size={16} className="text-slate-500" />
                 <div className="w-20 h-1 bg-slate-800 rounded-full cursor-pointer relative">
                     <div className="absolute inset-y-0 left-0 w-3/4 bg-slate-600 rounded-full"></div>
                 </div>
             </div>

             {/* Divider */}
             <div className="h-6 w-px bg-slate-800"></div>

             {/* Zoom */}
             <div className="flex items-center space-x-2">
                 <button className="text-slate-500 hover:text-slate-300"><ZoomOut size={18} /></button>
                 <span className="text-[10px] text-slate-600 font-mono uppercase">Zoom</span>
                 <button className="text-slate-500 hover:text-slate-300"><ZoomIn size={18} /></button>
             </div>
        </div>
    </div>
  );
};