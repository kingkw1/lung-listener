import React, { useState } from 'react';
import { Sparkles, Activity, AlertTriangle, CheckCircle2, ChevronRight, BrainCircuit } from 'lucide-react';
import { AudioFile, AnalysisStatus } from '../types';
import { motion } from 'framer-motion';

interface RightPanelProps {
  currentFile: AudioFile | null;
  analysisStatus: AnalysisStatus;
  setAnalysisStatus: React.Dispatch<React.SetStateAction<AnalysisStatus>>;
}

export const RightPanel: React.FC<RightPanelProps> = ({ currentFile, analysisStatus, setAnalysisStatus }) => {
  const [messages, setMessages] = useState<Array<{role: string, content: React.ReactNode}>>([]);

  const runAnalysis = () => {
    if (!currentFile) return;
    
    setAnalysisStatus(AnalysisStatus.ANALYZING);
    setMessages([]); // Clear previous

    // Simulation of AI process steps
    setTimeout(() => {
        addMessage('system', 'Preprocessing audio signal (Noise Reduction)...');
    }, 500);

    setTimeout(() => {
        addMessage('system', 'Generating mel-spectrogram features...');
    }, 1500);

    setTimeout(() => {
        addMessage('system', 'Sending data to Gemini 3 Pro (Multimodal)...');
    }, 3000);

    setTimeout(() => {
        setAnalysisStatus(AnalysisStatus.COMPLETED);
        addMessage('assistant', (
            <div className="space-y-3">
                <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start space-x-3">
                    <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                        <h4 className="text-sm font-bold text-red-200">Abnormality Detected</h4>
                        <p className="text-xs text-red-300 mt-1">Confidence: 94.2%</p>
                    </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                    The audio exhibits distinctive <span className="text-cyan-300 font-semibold">high-pitched wheezing</span> during the expiratory phase, consistent with mild bronchial obstruction.
                </p>
                <div className="text-xs text-slate-500 pt-2 border-t border-slate-700 mt-2">
                    <span className="font-semibold text-slate-400">Recommendation:</span> Consider spirometry to rule out early-stage asthma.
                </div>
            </div>
        ));
    }, 5000);
  };

  const addMessage = (role: string, content: React.ReactNode) => {
    setMessages(prev => [...prev, { role, content }]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
        <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <Sparkles size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider">Gemini 3 Pro Analysis</h2>
        </div>
        <p className="text-xs text-slate-500">Multimodal Diagnostic Engine</p>
      </div>

      {/* Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        
        {/* Empty State */}
        {analysisStatus === AnalysisStatus.IDLE && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <BrainCircuit size={48} className="mb-4 text-slate-400" />
                <p className="text-sm text-slate-400 font-medium">Ready to Analyze</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Upload a recording and run deep analysis to detect anomalies.</p>
            </div>
        )}

        {/* Live Feed */}
        {messages.map((msg, idx) => (
            <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'assistant' ? 'items-start' : 'items-start'}`}
            >
                {msg.role === 'system' && (
                    <div className="flex items-center space-x-2 text-xs text-slate-500 py-1 font-mono">
                         <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></div>
                         <span>{msg.content}</span>
                    </div>
                )}
                
                {msg.role === 'assistant' && (
                    <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 w-full shadow-sm">
                        {msg.content}
                    </div>
                )}
            </motion.div>
        ))}

        {analysisStatus === AnalysisStatus.ANALYZING && (
            <div className="flex items-center justify-center py-4">
                <Activity className="animate-spin text-cyan-500" size={24} />
            </div>
        )}
      </div>

      {/* Footer / Action Area */}
      <div className="p-5 border-t border-slate-800 bg-slate-900">
         <button
            onClick={runAnalysis}
            disabled={!currentFile || analysisStatus === AnalysisStatus.ANALYZING}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 font-medium transition-all duration-200
                ${!currentFile 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : analysisStatus === AnalysisStatus.ANALYZING
                        ? 'bg-slate-800 text-cyan-400 cursor-wait'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/20'
                }
            `}
         >
            {analysisStatus === AnalysisStatus.ANALYZING ? (
                <>
                    <span className="text-sm">Processing Signal...</span>
                </>
            ) : (
                <>
                    <span className="text-sm">Run Deep Analysis</span>
                    <ChevronRight size={16} />
                </>
            )}
         </button>
      </div>

    </div>
  );
};