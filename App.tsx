import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CenterStage } from './components/CenterStage';
import { RightPanel } from './components/RightPanel';
import { PatientContextData, AudioFile, AnalysisStatus, AIFilterConfig, RecordingLocation, RegionData } from './types';
import { parseLabelString } from './components/LabelControlZone';

// --- UTILITY: SMART METADATA PARSER ---
const parseICBHIMetadata = (fileName: string): Partial<PatientContextData> | null => {
  // ICBHI Standard: [PatientID]_[Index]_[Location]_[Mode]_[Equipment].wav
  // Example: 157_1b1_Al_sc_Meditron.wav
  
  // Remove extension
  const nameClean = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  const parts = nameClean.split('_');

  // Basic validation: ICBHI filenames usually have 5 parts
  if (parts.length < 5) return null;

  const [patientId, index, locCode, modeCode, equipCode] = parts;

  // 1. Map Location Codes
  const locationMap: Record<string, string> = {
    'Tc': RecordingLocation.TRACHEA,
    'Al': RecordingLocation.ANTERIOR_LEFT,
    'Ar': RecordingLocation.ANTERIOR_RIGHT,
    'Pl': RecordingLocation.POSTERIOR_LEFT,
    'Pr': RecordingLocation.POSTERIOR_RIGHT,
    'Ll': RecordingLocation.LATERAL_LEFT,
    'Lr': RecordingLocation.LATERAL_RIGHT,
  };
  const location = locationMap[locCode] || 'Unknown';

  // 2. Map Acquisition Mode
  const modeMap: Record<string, string> = {
    'sc': 'Single Channel',
    'mc': 'Multichannel'
  };
  const mode = modeMap[modeCode] || 'Unknown';

  // 3. Map Equipment Codes
  const equipMap: Record<string, string> = {
    'AKGC417L': 'AKG C417L Microphone',
    'LittC2SE': 'Littmann Classic II SE',
    'Litt3200': 'Littmann 3200 Electronic',
    'Meditron': 'WelchAllyn Meditron Master Elite'
  };
  const equipment = equipMap[equipCode] || equipCode; // Fallback to raw code if unknown

  return {
    id: patientId,
    index: index,
    location: location,
    mode: mode,
    equipment: equipment
  };
};

const App: React.FC = () => {
  const [patientData, setPatientData] = useState<PatientContextData>({
    id: '',
    index: '',
    location: 'Trachea',
    mode: 'Single Channel',
    equipment: ''
  });
  
  const [currentFile, setCurrentFile] = useState<AudioFile | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  
  // Lifted State: Clinical Regions (Shared between Sidebar loader and CenterStage display)
  const [clinicalRegions, setClinicalRegions] = useState<RegionData[]>([]);
  const [currentLabelFile, setCurrentLabelFile] = useState<string | null>(null);

  // Shared state for AI text stream
  const [aiAnalysisOutput, setAiAnalysisOutput] = useState<string>("");

  // Shared state for AI Filter
  const [aiFilterConfig, setAiFilterConfig] = useState<AIFilterConfig | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);

  // --- EFFECT: AUTO-FILL METADATA ---
  useEffect(() => {
    if (currentFile) {
      const metadata = parseICBHIMetadata(currentFile.name);
      if (metadata) {
        setPatientData(prev => ({
          ...prev,
          id: metadata.id || prev.id,
          index: metadata.index || prev.index,
          location: metadata.location || prev.location,
          mode: metadata.mode || prev.mode,
          equipment: metadata.equipment || prev.equipment
        }));
      }
    }
  }, [currentFile]);

  // Handler for loading demo cases from Sidebar
  const handleLoadDemo = (audioFile: File, labelText: string, labelFileName: string) => {
    // 1. Set Audio File
    const url = URL.createObjectURL(audioFile);
    setCurrentFile({
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      lastModified: audioFile.lastModified,
      url: url
    });

    // 2. Parse and Set Labels
    try {
        const regions = parseLabelString(labelText);
        setClinicalRegions(regions);
        setCurrentLabelFile(labelFileName);
    } catch (e) {
        console.error("Failed to parse demo labels", e);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 3-Column Layout */}
      
      {/* Left Sidebar: Fixed width */}
      <aside className="w-80 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm z-20">
        <Sidebar 
          patientData={patientData} 
          setPatientData={setPatientData} 
          onLoadDemo={handleLoadDemo}
        />
      </aside>

      {/* Center Stage: Flex grow */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        <CenterStage 
          currentFile={currentFile} 
          setCurrentFile={setCurrentFile}
          aiAnalysisOutput={aiAnalysisOutput}
          aiFilterConfig={aiFilterConfig}
          // Pass down lifted state and setters
          clinicalRegions={clinicalRegions}
          setClinicalRegions={setClinicalRegions}
          currentLabelFile={currentLabelFile}
          setCurrentLabelFile={setCurrentLabelFile}
        />
      </main>

      {/* Right Panel: Wider width */}
      <aside className="w-[600px] flex-shrink-0 border-l border-slate-800 bg-slate-900/50 backdrop-blur-sm z-20 transition-all duration-300">
        <RightPanel 
          currentFile={currentFile}
          analysisStatus={analysisStatus}
          setAnalysisStatus={setAnalysisStatus}
          aiAnalysisOutput={aiAnalysisOutput}
          setAiAnalysisOutput={setAiAnalysisOutput}
          setAiFilterConfig={setAiFilterConfig}
          isFilterActive={isFilterActive}
          setIsFilterActive={setIsFilterActive}
          aiFilterConfig={aiFilterConfig}
          patientData={patientData}
        />
      </aside>
    </div>
  );
};

export default App;