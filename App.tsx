import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CenterStage } from './components/CenterStage';
import { RightPanel } from './components/RightPanel';
import { PatientContextData, AudioFile, AnalysisStatus, AIFilterConfig, RecordingLocation } from './types';

// --- UTILITY: SMART METADATA PARSER ---
const parseICBHIMetadata = (fileName: string): Partial<PatientContextData> | null => {
  // ICBHI Standard: [PatientID]_[Index]_[Location]_[Mode]_[Equipment].wav
  // Example: 157_1b1_Al_sc_Meditron.wav
  
  // Remove extension
  const nameClean = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  const parts = nameClean.split('_');

  // Basic validation: ICBHI filenames usually have 5 parts
  if (parts.length < 5) return null;

  const patientId = parts[0];
  const locationCode = parts[2];
  const equipment = parts[4];

  // Map Code to RecordingLocation Enum
  const locationMap: Record<string, string> = {
    'Tc': RecordingLocation.TRACHEA,
    'Al': RecordingLocation.ANTERIOR_LEFT,
    'Ar': RecordingLocation.ANTERIOR_RIGHT,
    'Pl': RecordingLocation.POSTERIOR_LEFT,
    'Pr': RecordingLocation.POSTERIOR_RIGHT,
    'Ll': RecordingLocation.LATERAL_LEFT,
    'Lr': RecordingLocation.LATERAL_RIGHT,
  };

  // If code is valid, use it; otherwise default to existing or 'Unknown' logic
  const location = locationMap[locationCode];

  if (!location) return null; // If strictly following standard, we only auto-fill if we recognize the location code

  return {
    id: patientId,
    location: location,
    equipment: equipment
  };
};

const App: React.FC = () => {
  const [patientData, setPatientData] = useState<PatientContextData>({
    id: '',
    location: 'Trachea',
    equipment: ''
  });
  
  const [currentFile, setCurrentFile] = useState<AudioFile | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  
  // Shared state for AI text stream
  const [aiAnalysisOutput, setAiAnalysisOutput] = useState<string>("");

  // Shared state for AI Filter
  const [aiFilterConfig, setAiFilterConfig] = useState<AIFilterConfig | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false); // Used locally in CenterStage usually, but state kept here just in case

  // --- EFFECT: AUTO-FILL METADATA ---
  useEffect(() => {
    if (currentFile) {
      const metadata = parseICBHIMetadata(currentFile.name);
      if (metadata) {
        setPatientData(prev => ({
          ...prev,
          id: metadata.id || prev.id,
          location: metadata.location || prev.location,
          equipment: metadata.equipment || prev.equipment
        }));
      }
    }
  }, [currentFile]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 3-Column Layout */}
      
      {/* Left Sidebar: Fixed width */}
      <aside className="w-80 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm z-20">
        <Sidebar 
          patientData={patientData} 
          setPatientData={setPatientData} 
        />
      </aside>

      {/* Center Stage: Flex grow */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        <CenterStage 
          currentFile={currentFile} 
          setCurrentFile={setCurrentFile}
          aiAnalysisOutput={aiAnalysisOutput}
          aiFilterConfig={aiFilterConfig}
        />
      </main>

      {/* Right Panel: Wider width (approx 50% wider than previous w-96) */}
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