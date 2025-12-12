import React, { useState, useRef, DragEvent } from 'react';
import { FileText, Upload, Check, X, AlertCircle } from 'lucide-react';
import { RegionData } from '../types';

interface LabelControlZoneProps {
  onRegionsLoaded: (regions: RegionData[], fileName: string) => void;
  onClear: () => void;
  hasLabels: boolean;
  currentLabelFile: string | null;
}

// Reusable parser for external use (e.g., Demo loader)
export const parseLabelString = (text: string): RegionData[] => {
    const lines = text.split('\n');
    const newRegions: RegionData[] = [];

    lines.forEach((line, idx) => {
        if (!line.trim()) return;
        // Support tab or space delimited
        const parts = line.split(/[\t\s]+/).map(s => s.trim());
        
        // ICBHI Format: Start | End | Crackles | Wheezes
        // Example: 0.05  0.8  0  1
        if (parts.length < 4) return;

        const start = parseFloat(parts[0]);
        const end = parseFloat(parts[1]);
        const crackles = parseInt(parts[2]);
        const wheezes = parseInt(parts[3]);

        if (isNaN(start) || isNaN(end)) return;

        const idBase = `clinical-${idx}-${start}-${end}`;

        if (wheezes === 1) {
            newRegions.push({
                id: `${idBase}-wheeze`,
                start, end, content: 'Wheeze', color: 'rgba(239, 68, 68, 0.3)'
            });
        }
        if (crackles === 1) {
            newRegions.push({
                id: `${idBase}-crackle`,
                start, end, content: 'Crackle', color: 'rgba(234, 179, 8, 0.3)'
            });
        }
    });
    return newRegions;
};

export const LabelControlZone: React.FC<LabelControlZoneProps> = ({ 
  onRegionsLoaded, 
  onClear, 
  hasLabels, 
  currentLabelFile 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    if (e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.txt')) {
      setError('Invalid format. Please upload a .txt file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const newRegions = parseLabelString(text);

        if (newRegions.length === 0) {
            setError('No valid regions found in file.');
        } else {
            onRegionsLoaded(newRegions, file.name);
        }
      } catch (err) {
        setError('Error parsing file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  if (hasLabels) {
    return (
      <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-lg my-2 group">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-900/30 text-emerald-400 rounded-full">
            <Check size={16} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-300">Clinical Labels Loaded</p>
            <p className="text-[10px] text-slate-500">{currentLabelFile}</p>
          </div>
        </div>
        <button 
          onClick={onClear}
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
          title="Remove Labels"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`relative flex items-center justify-center p-4 border border-dashed rounded-lg my-2 transition-all cursor-pointer group ${
        isDragging 
          ? 'border-cyan-500 bg-cyan-900/10' 
          : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 hover:border-slate-600'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".txt" 
        onChange={handleFileInput} 
      />
      
      <div className="flex flex-col items-center space-y-1">
        <div className="flex items-center space-x-2 text-slate-400 group-hover:text-cyan-400 transition-colors">
          <Upload size={16} />
          <span className="text-xs font-medium uppercase tracking-wide">Drag Clinical Labels (.txt) here</span>
        </div>
        {error ? (
           <div className="flex items-center space-x-1 text-[10px] text-red-400">
             <AlertCircle size={10} />
             <span>{error}</span>
           </div>
        ) : (
           <span className="text-[10px] text-slate-600">Supports ICBHI Tab-Delimited Format</span>
        )}
      </div>
    </div>
  );
};