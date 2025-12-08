import React, { useEffect, useRef } from 'react';

interface DebugLogProps {
  logs: string[];
}

export const DebugLog: React.FC<DebugLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-32 bg-black border-t border-slate-800 p-2 font-mono text-[10px] overflow-y-auto" ref={scrollRef}>
      <div className="text-slate-500 mb-1">--- SYSTEM LOG & DIAGNOSTICS ---</div>
      {logs.length === 0 && <div className="text-slate-700 italic">No logs generated yet...</div>}
      {logs.map((log, i) => {
        const isError = log.toLowerCase().includes('error') || log.toLowerCase().includes('failed');
        const isSuccess = log.toLowerCase().includes('success') || log.toLowerCase().includes('ready');
        return (
          <div key={i} className={`mb-0.5 ${isError ? 'text-red-400' : isSuccess ? 'text-green-400' : 'text-slate-400'}`}>
            <span className="opacity-50 mr-2">[{i}]</span>
            {log}
          </div>
        );
      })}
    </div>
  );
};