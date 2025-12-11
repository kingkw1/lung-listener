import React, { useRef, useState, useEffect, DragEvent } from 'react';
import { UploadCloud, FileAudio, X, Loader2 } from 'lucide-react';
import { AudioFile, AIFilterConfig, RegionData } from '../types';
import { DebugLog } from './DebugLog';
import { WaveformBubble } from './WaveformBubble';
import { LabelTimeline } from './LabelTimeline'; // Updated import
import { motion, AnimatePresence } from 'framer-motion';

interface CenterStageProps {
  currentFile: AudioFile | null;
  setCurrentFile: React.Dispatch<React.SetStateAction<AudioFile | null>>;
  aiAnalysisOutput: string;
  aiFilterConfig: AIFilterConfig | null;
}

// Helper: Convert AudioBuffer to WAV Blob
const bufferToWave = (abuffer: AudioBuffer, len: number) => {
  let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0,
      pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded in this example)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < len) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true); // write 16-bit sample
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], {type: "audio/wav"});

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
};

export const CenterStage: React.FC<CenterStageProps> = ({ 
  currentFile, 
  setCurrentFile, 
  aiAnalysisOutput, 
  aiFilterConfig
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Region State
  const [aiRegions, setAiRegions] = useState<RegionData[]>([]);
  const [clinicalRegions, setClinicalRegions] = useState<RegionData[]>([]);
  const [currentLabelFile, setCurrentLabelFile] = useState<string | null>(null);

  // Filter State
  const [filteredAudioUrl, setFilteredAudioUrl] = useState<string | null>(null);
  const [isProcessingFilter, setIsProcessingFilter] = useState(false);

  // Playback Sync State
  const [duration, setDuration] = useState(0);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  // Logs
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs(prev => [...prev, `${timestamp}: ${msg}`]);
  };

  // Reset when file changes
  useEffect(() => {
      setAiRegions([]);
      setClinicalRegions([]);
      setCurrentLabelFile(null);
      setFilteredAudioUrl(null);
      setDuration(0);
      setSeekTarget(null);
      setLogs([]);
      if(currentFile) addLog(`File loaded: ${currentFile.name}`);
  }, [currentFile]);

  // --- OFFLINE AUDIO PROCESSING ---
  const processOfflineAudio = async () => {
      if (!currentFile || !aiFilterConfig) return;
      
      setIsProcessingFilter(true);
      addLog(`Starting offline filter render: ${aiFilterConfig.type} @ ${aiFilterConfig.frequency}Hz`);

      try {
          // 1. Load Original Audio
          const response = await fetch(currentFile.url);
          const arrayBuffer = await response.arrayBuffer();
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // 2. Setup Offline Context
          const offlineCtx = new OfflineAudioContext(
              audioBuffer.numberOfChannels,
              audioBuffer.length,
              audioBuffer.sampleRate
          );

          // 3. Create Graph
          const source = offlineCtx.createBufferSource();
          source.buffer = audioBuffer;

          const filter = offlineCtx.createBiquadFilter();
          filter.type = aiFilterConfig.type;
          filter.frequency.value = aiFilterConfig.frequency;
          filter.Q.value = aiFilterConfig.Q;

          source.connect(filter);
          filter.connect(offlineCtx.destination);

          // 4. Render
          source.start();
          const renderedBuffer = await offlineCtx.startRendering();
          addLog("Filter render complete. Encoding WAV...");

          // 5. Convert to Blob
          const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
          const wavUrl = URL.createObjectURL(wavBlob);
          
          setFilteredAudioUrl(wavUrl);
          addLog("Filtered audio ready.");

      } catch (error: any) {
          addLog(`Filter Processing Error: ${error.message}`);
          console.error(error);
      } finally {
          setIsProcessingFilter(false);
      }
  };

  // Automatically process filter when config arrives
  useEffect(() => {
    if (aiFilterConfig && currentFile) {
        processOfflineAudio();
    } else {
        setFilteredAudioUrl(null);
    }
  }, [aiFilterConfig]);

  // --- AI REGION PARSING ---
  useEffect(() => {
    if (!aiAnalysisOutput) return;
    const regex = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g;
    let match;
    const newRegions: RegionData[] = [];

    while ((match = regex.exec(aiAnalysisOutput)) !== null) {
        const start = parseInt(match[1]) * 60 + parseInt(match[2]);
        const end = parseInt(match[3]) * 60 + parseInt(match[4]);
        const id = `ai-region-${start}-${end}`;
        
        if (!newRegions.find(r => r.id === id) && !aiRegions.find(r => r.id === id)) {
            newRegions.push({
                id,
                start,
                end,
                content: 'AI Diagnosis',
                color: 'rgba(168, 85, 247, 0.4)'
            });
        }
    }

    if (newRegions.length > 0) {
        setAiRegions(prev => [...prev, ...newRegions]);
    }
  }, [aiAnalysisOutput]);

  // --- HANDLERS ---
  const handleClinicalRegionsLoaded = (regions: RegionData[], fileName: string) => {
      setClinicalRegions(regions);
      setCurrentLabelFile(fileName);
      addLog(`Loaded ${regions.length} labels from ${fileName}`);
  };

  const handleClearClinicalRegions = () => {
      setClinicalRegions([]);
      setCurrentLabelFile(null);
      addLog('Clinical labels cleared.');
  };

  const handleSeek = (time: number) => {
      setSeekTarget(time);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const processFiles = (files: FileList) => {
    const file = files[0];
    if (!file.type.startsWith('audio/') && !file.name.endsWith('.wav')) {
        addLog(`Error: Invalid file type ${file.type}`);
        return;
    }
    const url = URL.createObjectURL(file);
    setCurrentFile({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      url: url
    });
  };

  const clearFile = () => {
    if (currentFile) URL.revokeObjectURL(currentFile.url);
    if (filteredAudioUrl) URL.revokeObjectURL(filteredAudioUrl);
    setCurrentFile(null);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur z-20">
        <div className="flex items-center space-x-6">
            <h2 className="text-slate-200 font-medium">Signal Lab</h2>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 relative p-6 flex flex-col space-y-4 overflow-hidden bg-slate-950">
        <AnimatePresence mode="wait">
          {!currentFile && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${isDragging ? 'border-cyan-500 bg-cyan-900/10' : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 hover:border-slate-600'}`}
              onDragOver={handleDragOver}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="audio/*,.wav,.mp3" onChange={handleFileInput} />
              <div className="p-4 rounded-full bg-slate-800 mb-4 text-cyan-400"><UploadCloud size={48} /></div>
              <h3 className="text-lg font-medium text-slate-200 mb-2">Drag respiratory audio here</h3>
              <p className="text-slate-500 text-sm">Supports .WAV, .MP3</p>
            </motion.div>
          )}

          {currentFile && (
            <motion.div 
              key="viz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 flex flex-col h-full overflow-hidden space-y-2"
            >
              {/* File Info Bubble */}
              <div className="flex-shrink-0 flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                      <div className="p-2 bg-cyan-950/50 border border-cyan-900/50 rounded text-cyan-400">
                          <FileAudio size={18} />
                      </div>
                      <div>
                          <p className="text-sm font-medium text-slate-200">{currentFile.name}</p>
                          <p className="text-xs text-slate-500">{(currentFile.size / 1024 / 1024).toFixed(2)} MB • WAV Audio</p>
                      </div>
                  </div>
                  <button 
                      onClick={clearFile}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors"
                      title="Remove file"
                  >
                      <X size={18} />
                  </button>
              </div>

              {/* Bubble 1: Raw Signal */}
              <div className="flex-1 min-h-0 flex flex-col">
                  <WaveformBubble 
                      audioUrl={currentFile.url}
                      title="Raw Signal Lab"
                      waveColor="#06b6d4"
                      progressColor="#cffafe"
                      onLog={addLog}
                      onReady={(d) => setDuration(d)}
                      seekTo={seekTarget}
                      onSeek={handleSeek}
                      height={90}
                  />
              </div>

              {/* Middle Bubble: Label Timeline Swimlanes */}
              <div className="flex-shrink-0">
                  <LabelTimeline 
                      duration={duration}
                      clinicalRegions={clinicalRegions}
                      aiRegions={aiRegions}
                      onSeek={handleSeek}
                      onRegionsLoaded={handleClinicalRegionsLoaded}
                      onClear={handleClearClinicalRegions}
                      currentLabelFile={currentLabelFile}
                  />
              </div>

              {/* Bubble 2: Filtered Signal (Auto-appears) */}
              {(filteredAudioUrl || isProcessingFilter) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex-1 min-h-0 flex flex-col border-t border-slate-800 pt-2"
                  >
                      {isProcessingFilter ? (
                          <div className="flex-1 flex items-center justify-center bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
                              <div className="flex flex-col items-center space-y-2 text-cyan-500 animate-pulse">
                                  <Loader2 size={24} className="animate-spin" />
                                  <span className="text-xs font-mono tracking-wide uppercase">Applying AI Filter...</span>
                              </div>
                          </div>
                      ) : (
                          filteredAudioUrl && (
                            <WaveformBubble 
                                audioUrl={filteredAudioUrl}
                                title="AI Cleaned Signal (Gemini Filter Applied)"
                                waveColor="#22c55e"
                                progressColor="#86efac"
                                onLog={addLog}
                                seekTo={seekTarget}
                                onSeek={handleSeek}
                                height={90}
                            />
                          )
                      )}
                  </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800 z-20">
        <DebugLog logs={logs} />
      </div>
    </div>
  );
};