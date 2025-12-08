import React, { useRef, useState, DragEvent } from 'react';
import { UploadCloud, FileAudio, X } from 'lucide-react';
import { AudioFile } from '../types';
import { SpectrogramPlaceholder } from './SpectrogramPlaceholder';
import { AudioPlayer } from './AudioPlayer';
import { motion, AnimatePresence } from 'framer-motion';

interface CenterStageProps {
  currentFile: AudioFile | null;
  setCurrentFile: React.Dispatch<React.SetStateAction<AudioFile | null>>;
}

export const CenterStage: React.FC<CenterStageProps> = ({ currentFile, setCurrentFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const files = e.dataTransfer.files;
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (files: FileList) => {
    if (files.length > 0) {
      const file = files[0];
      // Create a local URL for the file to play it
      const url = URL.createObjectURL(file);
      setCurrentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        url: url
      });
    }
  };

  const clearFile = () => {
    if (currentFile) {
      URL.revokeObjectURL(currentFile.url); // Cleanup
    }
    setCurrentFile(null);
  };

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Top: Header/Status */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur">
        <h2 className="text-slate-200 font-medium">Signal Lab</h2>
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${currentFile ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></span>
          <span className="text-xs text-slate-500 uppercase tracking-wider">{currentFile ? 'System Ready' : 'Awaiting Signal'}</span>
        </div>
      </header>

      {/* Middle: Workspace */}
      <div className="flex-1 relative p-6 flex flex-col space-y-4 overflow-hidden">
        
        {/* Upload/Drop Zone - Shows only when no file is present */}
        <AnimatePresence>
          {!currentFile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer
                ${isDragging ? 'border-cyan-500 bg-cyan-900/10' : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 hover:border-slate-600'}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="audio/*,.wav,.mp3"
                onChange={handleFileInput}
              />
              <div className="p-4 rounded-full bg-slate-800 mb-4 text-cyan-400">
                <UploadCloud size={48} />
              </div>
              <h3 className="text-lg font-medium text-slate-200 mb-2">Drag respiratory audio here</h3>
              <p className="text-slate-500 text-sm">Supports .WAV, .MP3 (Max 50MB)</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visualization Stage - Shows when file IS present */}
        <AnimatePresence>
          {currentFile && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col space-y-4"
            >
              {/* File Info Bar */}
              <div className="flex items-center justify-between bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-700">
                <div className="flex items-center space-x-3">
                  <FileAudio className="text-cyan-400" size={20} />
                  <div>
                    <div className="text-sm font-medium text-slate-200">{currentFile.name}</div>
                    <div className="text-xs text-slate-500">{(currentFile.size / 1024 / 1024).toFixed(2)} MB • 44.1kHz</div>
                  </div>
                </div>
                <button 
                  onClick={clearFile}
                  className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Spectrogram Container */}
              <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 relative overflow-hidden flex flex-col">
                <div className="absolute top-2 left-2 z-10 bg-black/40 px-2 py-1 rounded text-[10px] text-slate-400 font-mono">
                  SPECTROGRAM ANALYSIS
                </div>
                <SpectrogramPlaceholder />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: Player Controls */}
      <div className="h-24 bg-slate-900 border-t border-slate-800 p-4">
        <AudioPlayer fileUrl={currentFile?.url} />
      </div>

    </div>
  );
};