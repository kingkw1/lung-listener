import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { CenterStage } from './components/CenterStage';
import { RightPanel } from './components/RightPanel';
import { PatientContextData, AudioFile, AnalysisStatus } from './types';

const App: React.FC = () => {
  const [patientData, setPatientData] = useState<PatientContextData>({
    id: '',
    location: 'Trachea',
  });
  
  const [currentFile, setCurrentFile] = useState<AudioFile | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 3-Column Layout */}
      
      {/* Left Sidebar: 20% width on large screens */}
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
        />
      </main>

      {/* Right Panel: 25% width or fixed */}
      <aside className="w-96 flex-shrink-0 border-l border-slate-800 bg-slate-900/50 backdrop-blur-sm z-20">
        <RightPanel 
          currentFile={currentFile}
          analysisStatus={analysisStatus}
          setAnalysisStatus={setAnalysisStatus}
        />
      </aside>
    </div>
  );
};

export default App;