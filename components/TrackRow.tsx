import React from 'react';

interface TrackRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  controls?: React.ReactNode;
  children: React.ReactNode;
  height?: number | string;
  isExpanded?: boolean;
  className?: string;
  isDarkMode?: boolean;
}

export const TrackRow: React.FC<TrackRowProps> = ({ 
  title, 
  subtitle,
  icon, 
  controls, 
  children, 
  height = 'auto', 
  isExpanded = true,
  className = '',
  isDarkMode = true
}) => {
  if (!isExpanded) return null;

  return (
    <div className={`flex w-full border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white'} ${className}`}>
      {/* Header Column: Fixed Width */}
      <div className={`w-56 flex-shrink-0 border-r flex flex-col justify-between p-3 z-10 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
        <div>
          <div className={`flex items-center space-x-2 mb-1 font-bold text-xs uppercase tracking-wider ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {icon && <span className="text-slate-500">{icon}</span>}
            <span className="truncate">{title}</span>
          </div>
          {subtitle && <div className="text-[10px] text-slate-500 font-mono truncate">{subtitle}</div>}
        </div>
        
        {controls && (
          <div className="mt-2">
            {controls}
          </div>
        )}
      </div>

      {/* Viewport Column: Flex Grow */}
      <div className={`flex-1 relative min-w-0 ${isDarkMode ? 'bg-slate-950/50' : 'bg-slate-50/50'}`} style={{ height }}>
        {children}
      </div>
    </div>
  );
};