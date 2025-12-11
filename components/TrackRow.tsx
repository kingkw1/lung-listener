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
}

export const TrackRow: React.FC<TrackRowProps> = ({ 
  title, 
  subtitle,
  icon, 
  controls, 
  children, 
  height = 'auto', 
  isExpanded = true,
  className = ''
}) => {
  if (!isExpanded) return null;

  return (
    <div className={`flex w-full border-b border-slate-800 bg-slate-900/30 ${className}`}>
      {/* Header Column: Fixed Width */}
      <div className="w-56 flex-shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col justify-between p-3 z-10">
        <div>
          <div className="flex items-center space-x-2 mb-1 text-slate-200 font-bold text-xs uppercase tracking-wider">
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
      <div className="flex-1 relative min-w-0 bg-slate-950/50" style={{ height }}>
        {children}
      </div>
    </div>
  );
};