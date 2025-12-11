import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { CenterStage } from './components/CenterStage';
import { RightPanel } from './components/RightPanel';
import { PatientContextData, AudioFile, AnalysisStatus, AIFilterConfig } from './types';

const App: React.FC = () => {
  const [patientData, setPatientData] = useState<PatientContextData>({
    id: '',
    location: 'Trachea',
  });
  
  const [currentFile, setCurrentFile] = useState<AudioFile | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  
  // Shared state for AI text stream
  const [aiAnalysisOutput, setAiAnalysisOutput] = useState<string>("");

  // Shared state for AI Filter
  const [aiFilterConfig, setAiFilterConfig] = useState<AIFilterConfig | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false); // Used locally in CenterStage usually, but state kept here just in case

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