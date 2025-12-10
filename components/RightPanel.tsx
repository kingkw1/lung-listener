import React, { useState } from 'react';
import { Sparkles, Activity, AlertTriangle, CheckCircle2, ChevronRight, BrainCircuit, Loader2 } from 'lucide-react';
import { AudioFile, AnalysisStatus } from '../types';
import { motion } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";

// --- AI INFRASTRUCTURE SETUP ---

// Initialize the Google GenAI Client
// We accept NEXT_PUBLIC_GEMINI_API_KEY as requested, falling back to API_KEY if available.
const ai = new GoogleGenAI({ 
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.API_KEY || '' 
});

/**
 * Helper: Convert a File or Blob object to a Google GenAI compatible inlineData part.
 * @param file The audio file or blob to convert.
 * @returns Promise resolving to the inlineData object.
 */
const fileToGenerativePart = async (file: File | Blob): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract the Base64 string (remove the "data:audio/wav;base64," prefix)
      const base64Data = result.split(',')[1];
      
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type || 'audio/wav',
        },
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

interface RightPanelProps {
  currentFile: AudioFile | null;
  analysisStatus: AnalysisStatus;
  setAnalysisStatus: React.Dispatch<React.SetStateAction<AnalysisStatus>>;
}

export const RightPanel: React.FC<RightPanelProps> = ({ currentFile, analysisStatus, setAnalysisStatus }) => {
  const [messages, setMessages] = useState<Array<{role: string, content: React.ReactNode}>>([]);

  // Phase 2: Simplified Handler
  const handleDeepAnalysis = () => {
    if (!currentFile) return;
    
    setAnalysisStatus(AnalysisStatus.ANALYZING);
    
    // Simulating "Listening..." state
    setTimeout(() => {
        setAnalysisStatus(AnalysisStatus.IDLE);
    }, 2000);
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
      </div>

      {/* Footer / Action Area */}
      <div className="p-5 border-t border-slate-800 bg-slate-900">
         <button
            onClick={handleDeepAnalysis}
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
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-sm">Listening...</span>
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