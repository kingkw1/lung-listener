import React from 'react';

export const SpectrogramPlaceholder: React.FC = () => {
  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0" 
             style={{
               backgroundImage: 'linear-gradient(rgba(30, 41, 59, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 41, 59, 0.5) 1px, transparent 1px)',
               backgroundSize: '20px 20px'
             }}>
        </div>
        
        {/* Mock Data Visualization - CSS Generated Heatmap vibes */}
        <div className="absolute inset-0 opacity-60 mix-blend-screen flex items-end justify-between px-1">
            {/* Generate random bars to simulate audio spectrum */}
            {Array.from({ length: 60 }).map((_, i) => {
                const height = 20 + Math.random() * 60; // 20% to 80%
                const colorIntensity = Math.floor(Math.random() * 3); // 0, 1, 2
                let colorClass = 'bg-cyan-900';
                if (colorIntensity === 1) colorClass = 'bg-cyan-700';
                if (colorIntensity === 2) colorClass = 'bg-teal-500';
                
                return (
                    <div 
                        key={i} 
                        className={`w-1.5 rounded-t-sm ${colorClass} transition-all duration-500`}
                        style={{ height: `${height}%`, opacity: 0.3 + Math.random() * 0.5 }}
                    />
                )
            })}
        </div>

        {/* Frequency Labels */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between py-2 text-[10px] text-slate-600 font-mono pl-1 bg-slate-950/50">
           <span>4kHz</span>
           <span>2kHz</span>
           <span>1kHz</span>
           <span>500Hz</span>
           <span>0Hz</span>
        </div>
        
        {/* Time Labels */}
        <div className="absolute left-8 right-0 bottom-0 h-6 flex justify-between px-4 text-[10px] text-slate-600 font-mono items-center bg-slate-950/50">
           <span>00:00</span>
           <span>00:05</span>
           <span>00:10</span>
           <span>00:15</span>
        </div>
    </div>
  );
};