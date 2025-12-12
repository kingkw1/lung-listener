import React, { useRef, useState, useEffect, DragEvent } from 'react';
import { UploadCloud, FileAudio, X, Loader2, Activity, ListMusic, Wand2, Headphones } from 'lucide-react';
import { AudioFile, AIFilterConfig, RegionData } from '../types';
import { DebugLog } from './DebugLog';
import { WaveformTrack } from './WaveformTrack'; 
import { TimelineTrack } from './TimelineTrack';
import { TrackRow } from './TrackRow';
import { MasterControls } from './MasterControls';
import { motion, AnimatePresence } from 'framer-motion';

interface CenterStageProps {
  currentFile: AudioFile | null;
  setCurrentFile: React.Dispatch<React.SetStateAction<AudioFile | null>>;
  aiAnalysisOutput: string;
  aiFilterConfig: AIFilterConfig | null;
  // Lifted state props
  clinicalRegions: RegionData[];
  setClinicalRegions: React.Dispatch<React.SetStateAction<RegionData[]>>;
  currentLabelFile: string | null;
  setCurrentLabelFile: React.Dispatch<React.SetStateAction<string | null>>;
}

const bufferToWave = (abuffer: AudioBuffer, len: number) => {
  let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0,
      pos = 0;

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
  setUint16(16);                                 // 16-bit
  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < len) {
    for(i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0;
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], {type: "audio/wav"});

  function setUint16(data: number) { view.setUint16(pos, data, true); pos += 2; }
  function setUint32(data: number) { view.setUint32(pos, data, true); pos += 4; }
};

export const CenterStage: React.FC<CenterStageProps> = ({ 
  currentFile, 
  setCurrentFile, 
  aiAnalysisOutput, 
  aiFilterConfig,
  clinicalRegions,
  setClinicalRegions,
  currentLabelFile,
  setCurrentLabelFile
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Region State (AI Regions are still local as they are derived from AI output)
  const [aiRegions, setAiRegions] = useState<RegionData[]>([]);
  
  // Filter State
  const [filteredAudioUrl, setFilteredAudioUrl] = useState<string | null>(null);
  const [isProcessingFilter, setIsProcessingFilter] = useState(false);
  
  // Audio Source State (Solo/Monitor Logic)
  const [activeAudioSource, setActiveAudioSource] = useState<'raw' | 'filtered'>('raw');

  // --- MASTER CLOCK STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  // Zoom State (Pixels Per Second)
  const [zoomLevel, setZoomLevel] = useState(50);
  
  // Controls seek updates propagated to children
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  // Logs
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs(prev => [...prev, `${timestamp}: ${msg}`]);
  };

  useEffect(() => {
      setAiRegions([]);
      setFilteredAudioUrl(null);
      setDuration(0);
      setSeekTarget(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setActiveAudioSource('raw');
      setZoomLevel(50); // Reset zoom on file load
      setLogs([]);
      if(currentFile) addLog(`File loaded: ${currentFile.name}`);
  }, [currentFile]);

  // --- PLAYBACK CONTROLLERS ---
  const handleTogglePlay = () => setIsPlaying(!isPlaying);
  
  const handleSeek = (time: number) => {
      setSeekTarget(time);
      setCurrentTime(time);
  };

  const handleTimeUpdate = (time: number) => {
      setCurrentTime(time);
  };
  
  // --- ZOOM CONTROLLERS ---
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 50, 500));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 50, 10));

  // --- OFFLINE AUDIO PROCESSING ---
  const processOfflineAudio = async () => {
      if (!currentFile || !aiFilterConfig) return;
      setIsProcessingFilter(true);
      addLog(`Render: ${aiFilterConfig.type} @ ${aiFilterConfig.frequency}Hz`);

      try {
          const response = await fetch(currentFile.url);
          const arrayBuffer = await response.arrayBuffer();
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          const offlineCtx = new OfflineAudioContext(
              audioBuffer.numberOfChannels,
              audioBuffer.length,
              audioBuffer.sampleRate
          );

          const source = offlineCtx.createBufferSource();
          source.buffer = audioBuffer;

          const filter = offlineCtx.createBiquadFilter();
          filter.type = aiFilterConfig.type;
          filter.frequency.value = aiFilterConfig.frequency;
          filter.Q.value = aiFilterConfig.Q;

          source.connect(filter);
          filter.connect(offlineCtx.destination);

          source.start();
          const renderedBuffer = await offlineCtx.startRendering();

          const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
          const wavUrl = URL.createObjectURL(wavBlob);
          setFilteredAudioUrl(wavUrl);
          setActiveAudioSource('filtered'); // Auto-switch to hearing the result
          addLog("Filter applied. Switched active source.");

      } catch (error: any) {
          addLog(`Error: ${error.message}`);
          console.error(error);
      } finally {
          setIsProcessingFilter(false);
      }
  };

  useEffect(() => {
    if (aiFilterConfig && currentFile) {
        processOfflineAudio();
    } else {
        setFilteredAudioUrl(null);
    }
  }, [aiFilterConfig]);

  // --- AI REGION PARSING ---
  useEffect(() => {
    if (!aiAnalysisOutput) {
        if (aiRegions.length > 0) setAiRegions([]);
        return;
    }
    
    // Improved Regex for timestamps
    const regex = /(\d{1,2}):(\d{2})\s*(?:[-–—]|to)\s*(\d{1,2}):(\d{2})/gi;
    
    let match;
    const parsedRegions: RegionData[] = [];

    while ((match = regex.exec(aiAnalysisOutput)) !== null) {
        const startMin = parseInt(match[1], 10);
        const startSec = parseInt(match[2], 10);
        const endMin = parseInt(match[3], 10);
        const endSec = parseInt(match[4], 10);

        const start = startMin * 60 + startSec;
        const end = endMin * 60 + endSec;

        if (end <= start) continue;

        const id = `ai-region-${start}-${end}`;
        
        if (!parsedRegions.find(r => r.id === id)) {
            parsedRegions.push({
                id,
                start,
                end,
                content: 'AI Diagnosis',
                color: 'rgba(168, 85, 247, 0.9)'
            });
        }
    }
    
    const isDifferent = JSON.stringify(parsedRegions) !== JSON.stringify(aiRegions);
    if (isDifferent) {
        setAiRegions(parsedRegions);
        if (parsedRegions.length > aiRegions.length) {
            addLog(`Gemini found ${parsedRegions.length} temporal anomalies.`);
        }
    }
  }, [aiAnalysisOutput, aiRegions]);

  const handleClinicalRegionsLoaded = (regions: RegionData[], fileName: string) => {
      setClinicalRegions(regions);
      setCurrentLabelFile(fileName);
      addLog(`Labels: ${fileName}`);
  };

  const handleClearClinicalRegions = () => {
      setClinicalRegions([]);
      setCurrentLabelFile(null);
      addLog('Labels cleared.');
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) processFiles(e.target.files); };

  const processFiles = (files: FileList) => {
    const file = files[0];
    if (!file.type.startsWith('audio/') && !file.name.endsWith('.wav')) {
        addLog(`Invalid file: ${file.type}`);
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
    // Reset regions when manually uploading a new file
    setClinicalRegions([]);
    setCurrentLabelFile(null);
  };

  const clearFile = () => {
    if (currentFile) URL.revokeObjectURL(currentFile.url);
    if (filteredAudioUrl) URL.revokeObjectURL(filteredAudioUrl);
    setCurrentFile(null);
    setClinicalRegions([]);
    setCurrentLabelFile(null);
  };

  const isFilteredDriver = activeAudioSource === 'filtered' && !!filteredAudioUrl;

  return (
    <div className="flex flex-col h-full relative bg-slate-950">
      
      {/* 1. Header Area */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950 z-20">
        <div className="flex items-center space-x-2">
            <Activity className="text-cyan-500" size={20} />
            <h2 className="text-slate-200 font-bold uppercase tracking-widest text-sm">Multi-Track Editor</h2>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {!currentFile && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex-1 flex flex-col items-center justify-center p-8 transition-colors ${isDragging ? 'bg-cyan-900/20' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="audio/*,.wav,.mp3" onChange={handleFileInput} />
              <div className="p-6 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-slate-900 transition-all group">
                  <div className="p-4 rounded-full bg-slate-800 text-cyan-400 mb-4 group-hover:scale-110 transition-transform"><UploadCloud size={48} /></div>
                  <h3 className="text-xl font-medium text-slate-200 mb-1">Drop Audio File</h3>
                  <p className="text-slate-500 text-sm">WAV, MP3 (Max 50MB)</p>
              </div>
            </motion.div>
          )}

          {currentFile && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col min-h-0 bg-black/20"
            >
               {/* File Info Bar */}
               <div className="flex items-center justify-between px-6 py-2 bg-slate-900/50 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                      <FileAudio size={16} className="text-slate-500" />
                      <span className="text-sm font-mono text-slate-300">{currentFile.name}</span>
                      <span className="text-xs text-slate-600 font-mono">{(currentFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button onClick={clearFile} className="p-1 hover:text-red-400 text-slate-500"><X size={16} /></button>
               </div>

               {/* Track 1: Raw Signal */}
               <TrackRow 
                  title="Raw Signal" 
                  subtitle="Primary Source"
                  icon={<Activity size={14} />} 
                  height="260px"
                  controls={
                      <div className="flex space-x-2">
                          <button 
                            onClick={() => setActiveAudioSource('raw')}
                            className={`px-2 py-1 text-[10px] flex items-center rounded border transition-colors ${
                                activeAudioSource === 'raw' 
                                ? 'bg-cyan-600 text-white border-cyan-500' 
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                            }`}
                          >
                             <Headphones size={12} className="mr-1.5" />
                             Monitor
                          </button>
                      </div>
                  }
               >
                  <WaveformTrack 
                      audioUrl={currentFile.url}
                      waveColor="#06b6d4"
                      progressColor="#cffafe"
                      onReady={(d) => setDuration(d)}
                      seekTo={seekTarget}
                      onSeek={handleSeek}
                      isPlaying={isPlaying}
                      volume={activeAudioSource === 'raw' ? (isMuted ? 0 : volume) : 0}
                      onTimeUpdate={activeAudioSource === 'raw' ? handleTimeUpdate : undefined}
                      zoomLevel={zoomLevel}
                  />
               </TrackRow>

               {/* Track 2: Annotations (Timeline) */}
               <TrackRow 
                  title="Annotations" 
                  subtitle="Human & AI Labels"
                  icon={<ListMusic size={14} />} 
                  height="140px"
               >
                  <TimelineTrack 
                      duration={duration}
                      clinicalRegions={clinicalRegions}
                      aiRegions={aiRegions}
                      onSeek={handleSeek}
                      onRegionsLoaded={handleClinicalRegionsLoaded}
                      onClear={handleClearClinicalRegions}
                      currentLabelFile={currentLabelFile}
                      currentTime={currentTime}
                      zoomLevel={zoomLevel}
                  />
               </TrackRow>

               {/* Track 3: Filtered Signal (Conditional) */}
               <AnimatePresence>
                 {(filteredAudioUrl || isProcessingFilter) && (
                    <motion.div
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 'auto', opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       className="overflow-hidden"
                    >
                        <TrackRow 
                            title="AI Cleaned" 
                            subtitle={aiFilterConfig ? `${aiFilterConfig.type} @ ${aiFilterConfig.frequency}Hz` : 'Processing...'}
                            icon={<Wand2 size={14} />} 
                            height="260px"
                            className="bg-emerald-950/10"
                            controls={
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => setActiveAudioSource('filtered')}
                                        disabled={isProcessingFilter}
                                        title="Apply AI-Recommended Cleaning Filter"
                                        className={`px-2 py-1 text-[10px] flex items-center rounded border transition-colors ${
                                            activeAudioSource === 'filtered'
                                            ? 'bg-emerald-600 text-white border-emerald-500' 
                                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                                        }`}
                                    >
                                        <Headphones size={12} className="mr-1.5" />
                                        Monitor
                                    </button>
                                </div>
                            }
                        >
                            {isProcessingFilter ? (
                                <div className="w-full h-full flex items-center justify-center space-x-2 text-emerald-500/50">
                                    <Loader2 className="animate-spin" />
                                    <span className="text-sm font-mono uppercase">Rendering Offline Filter...</span>
                                </div>
                            ) : (
                                filteredAudioUrl && (
                                    <WaveformTrack 
                                        audioUrl={filteredAudioUrl}
                                        waveColor="#22c55e"
                                        progressColor="#86efac"
                                        seekTo={seekTarget}
                                        onSeek={handleSeek}
                                        isPlaying={isPlaying}
                                        volume={activeAudioSource === 'filtered' ? (isMuted ? 0 : volume) : 0}
                                        onTimeUpdate={activeAudioSource === 'filtered' ? handleTimeUpdate : undefined}
                                        zoomLevel={zoomLevel}
                                    />
                                )
                            )}
                        </TrackRow>
                    </motion.div>
                 )}
               </AnimatePresence>

               {/* Spacer for scroll */}
               <div className="flex-1 bg-slate-950 min-h-[50px]"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Controls & Logs */}
      {currentFile && (
          <MasterControls 
             isPlaying={isPlaying}
             currentTime={currentTime}
             duration={duration}
             volume={volume}
             isMuted={isMuted}
             onTogglePlay={handleTogglePlay}
             onSeek={handleSeek}
             onVolumeChange={setVolume}
             onToggleMute={() => setIsMuted(!isMuted)}
             onZoomIn={handleZoomIn}
             onZoomOut={handleZoomOut}
          />
      )}
      
      <div className="flex-shrink-0 bg-slate-900 border-t border-slate-800">
        <DebugLog logs={logs} />
      </div>
    </div>
  );
};