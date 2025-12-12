import React, { useState } from 'react';
import { Sparkles, Activity, AlertTriangle, CheckCircle2, ChevronRight, BrainCircuit, Loader2, Copy, Check, Terminal, FileCode, Sliders, ToggleLeft, ToggleRight, Download, Moon, Sun } from 'lucide-react';
import { AudioFile, AnalysisStatus, AIFilterConfig, PatientContextData } from '../types';
import { motion } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CONFIGURATION ---
const ACTIVE_MODEL_STRING = "gemini-3-pro-preview";

// --- AI INFRASTRUCTURE SETUP ---
const fileToGenerativePart = async (file: File | Blob): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
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
  aiAnalysisOutput: string;
  setAiAnalysisOutput: React.Dispatch<React.SetStateAction<string>>;
  setAiFilterConfig: React.Dispatch<React.SetStateAction<AIFilterConfig | null>>;
  aiFilterConfig: AIFilterConfig | null;
  isFilterActive: boolean;
  setIsFilterActive: React.Dispatch<React.SetStateAction<boolean>>;
  patientData: PatientContextData;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

interface CodeBlockProps {
  language: string;
  code: string;
  isDarkMode: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, isDarkMode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`mt-4 mb-4 rounded-lg overflow-hidden border shadow-lg ${isDarkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
        <div className="flex items-center space-x-2 text-slate-400">
           <Terminal size={14} />
           <span className={`text-xs font-mono font-medium ${isDarkMode ? 'text-cyan-500' : 'text-teal-600'}`}>Generated Research Tool: Audio Filter</span>
        </div>
        <button 
          onClick={handleCopy}
          className={`flex items-center space-x-1 text-[10px] transition-colors ${isDarkMode ? 'text-slate-500 hover:text-cyan-400' : 'text-slate-500 hover:text-teal-600'}`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy Code'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className={`font-mono text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const MessageContent: React.FC<{ content: string, isDarkMode: boolean }> = ({ content, isDarkMode }) => {
  const parts = content.split(/```/);

  return (
    <div className="w-full">
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          const lines = part.split('\n');
          const language = lines[0].trim() || 'python';
          const code = lines.slice(1).join('\n');
          return <CodeBlock key={index} language={language} code={code} isDarkMode={isDarkMode} />;
        } else {
          if (!part.trim()) return null;
          return (
             <div key={index} className={`prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed mb-2 ${isDarkMode ? 'prose-invert text-slate-300' : 'text-slate-700'}`}>
                {part}
             </div>
          );
        }
      })}
    </div>
  );
};


export const RightPanel: React.FC<RightPanelProps> = ({ 
  currentFile, 
  analysisStatus, 
  setAnalysisStatus, 
  aiAnalysisOutput,
  setAiAnalysisOutput,
  setAiFilterConfig,
  aiFilterConfig,
  isFilterActive,
  setIsFilterActive,
  patientData,
  isDarkMode,
  setIsDarkMode
}) => {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [progressMessage, setProgressMessage] = useState("Initializing...");

  const handleDeepAnalysis = async () => {
    if (!currentFile) return;
    
    const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');

    setAnalysisStatus(AnalysisStatus.ANALYZING);
    setProgressMessage("Securely uploading buffer...");
    setMessages([]); 
    setAiAnalysisOutput("");
    setAiFilterConfig(null);
    setIsFilterActive(false);

    try {
        const response = await fetch(currentFile.url);
        const blob = await response.blob();
        const audioPart = await fileToGenerativePart(blob);
        
        setProgressMessage("Gemini 3 Pro is reasoning...");

        const systemInstruction = `You are a specialized Lung Sound Analyzer. You are expert at distinguishing the 'musical' quality of a wheeze from the 'scratchy' quality of friction. You prioritize finding pathology over dismissing data.

**CRITICAL RULES:**
1. **No Hallucinations:** Do NOT identify 'speech', 'voices', or 'talking' unless distinct, intelligible words are audible. Random broadband noise is NOT speech.
2. **Noise Rejection:** Reject rhythmic thumping (heartbeats).
3. **CONFIDENCE RULE:** If you detect a **continuous, musical, high-frequency sound (>400Hz)**, classify it as a **WHEEZE** with HIGH confidence. Musicality is rarely an artifact.
4. **Frequency Awareness:** Be aware that this recording contains high-amplitude heartbeats (<150Hz). Do not confuse these rhythmic thumps with speech or lung pathology.

**ANALYSIS PROTOCOL:**
1. Quality Check: Briefly assess signal-to-noise ratio.
2. Timeline Analysis: You MUST provide specific timestamps (e.g., '0:02 - 0:05') for the most distinct anomalies.
3. Timestamp Precision: Only mark the *most intense* 0.5 - 1.0 second window of the anomaly. Do not label the entire breath cycle.
4. Diagnosis: Brief, bulleted potential causes.
5. Remediation Code: Based on the anomalies found (e.g., Low-frequency heartbeats or High-frequency hiss), generate a robust Python function using \`scipy.signal\` to filter this specific audio. Include comments explaining why you chose these cutoff frequencies. Label this section "Generated Research Tool: Audio Filter".
6. Filter Parameters: You MUST output a JSON object at the very end of your response for the recommended filter settings to be used in a Web Audio API BiquadFilterNode. Format: {"recommendedFilter": {"type": "highpass" | "lowpass" | "bandpass", "frequency": number, "Q": number}}. Do not use markdown for this JSON block, just the raw JSON string at the end.`;
        
        const userPrompt = "Analyze this raw audio. There is a confirmed respiratory pathology present. Locate the strongest example of it. Do not be overly cautious.";

        const model = genAI.getGenerativeModel({ 
            model: ACTIVE_MODEL_STRING,
            systemInstruction: systemInstruction 
        });

        const result = await model.generateContentStream([
            audioPart,
            userPrompt
        ]);

        setProgressMessage("Receiving diagnostic stream...");

        let fullResponse = "";
        
        setMessages([{ role: 'assistant', content: '' }]);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullResponse += chunkText;
                setMessages([{ role: 'assistant', content: fullResponse }]);
                setAiAnalysisOutput(fullResponse); 

                const jsonRegex = /\{"recommendedFilter":\s*\{[\s\S]*?\}\}/;
                const match = fullResponse.match(jsonRegex);
                if (match) {
                    try {
                        const json = JSON.parse(match[0]);
                        if (json.recommendedFilter) {
                             setAiFilterConfig(json.recommendedFilter);
                        }
                    } catch (e) {
                    }
                }
            }
        }

        setAnalysisStatus(AnalysisStatus.COMPLETED);

    } catch (error: any) {
        console.error("Gemini Analysis Failed:", error);
        setMessages(prev => [
            ...prev, 
            { role: 'system', content: `Analysis Error: ${error.message || 'Unknown error occurred.'}` }
        ]);
        setAnalysisStatus(AnalysisStatus.ERROR);
    }
  };

  const handleDownloadReport = () => {
    if (!currentFile || !aiAnalysisOutput) return;
    const timestamp = new Date().toLocaleString();
    let cleanAnalysis = aiAnalysisOutput.replace(/\{"recommendedFilter":\s*\{[\s\S]*?\}\}/, '');
    
    const reportContent = `
# CLINICAL AUDIO ANALYSIS REPORT
Generated by Lung Listener (DeepMind Health)
Date: ${timestamp}

## PATIENT CONTEXT
- **Patient ID:** ${patientData.id || 'N/A'}
- **Recording Location:** ${patientData.location}
- **File Name:** ${currentFile.name}

---

## AI DIAGNOSTIC FINDINGS (${ACTIVE_MODEL_STRING})
${cleanAnalysis}

---

## RESEARCH TOOL: AUDIO FILTER CONFIGURATION
${aiFilterConfig ? `
- **Filter Type:** ${aiFilterConfig.type}
- **Cutoff Frequency:** ${aiFilterConfig.frequency} Hz
- **Q Factor:** ${aiFilterConfig.Q}
` : 'No filter configuration generated.'}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Patient_${patientData.id || 'Unknown'}_Report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full border-l transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      
      {/* Header */}
      <div className={`p-5 border-b sticky top-0 z-10 flex justify-between items-center transition-colors duration-300 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <div>
          <div className={`flex items-center space-x-3 mb-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>
              <Sparkles size={24} className={isDarkMode ? 'text-cyan-400' : 'text-teal-600'} />
              <h2 className="text-lg font-bold uppercase tracking-wider">
                  Model: <span className={`font-mono ${isDarkMode ? 'text-cyan-400' : 'text-teal-600'}`}>{ACTIVE_MODEL_STRING}</span>
              </h2>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <p className={`text-sm font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Persona: Bio-Acoustic Analyst</p>
          </div>
        </div>
        
        {/* Theme Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-full transition-all duration-200 ${
            isDarkMode 
              ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
          title={isDarkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
        >
          {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        
        {/* Empty State */}
        {analysisStatus === AnalysisStatus.IDLE && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <BrainCircuit size={48} className={`mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-300'}`} />
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Ready to Analyze</p>
                <p className={`text-xs mt-1 max-w-[200px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Upload a recording and run deep analysis to detect anomalies.</p>
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
                    <div className="flex items-center space-x-2 text-xs text-red-400 py-2 font-mono bg-red-900/20 px-3 rounded w-full">
                         <AlertTriangle size={12} />
                         <span>{msg.content}</span>
                    </div>
                )}
                
                {msg.role === 'assistant' && (
                    <div className={`border rounded-lg p-4 w-full shadow-sm transition-colors duration-300 ${
                        isDarkMode 
                            ? 'bg-slate-800/80 border-slate-700' 
                            : 'bg-white border-slate-200 shadow-md'
                    }`}>
                        <MessageContent content={msg.content} isDarkMode={isDarkMode} />
                    </div>
                )}
            </motion.div>
        ))}
        
        {/* Loading Indicator inside chat */}
        {analysisStatus === AnalysisStatus.ANALYZING && messages.length === 0 && (
             <div className={`flex items-center space-x-2 text-xs animate-pulse ${isDarkMode ? 'text-cyan-500' : 'text-teal-600'}`}>
                <Loader2 size={12} className="animate-spin" />
                <span>Establishing connection to Gemini...</span>
             </div>
        )}
      </div>

      {/* Footer / Action Area */}
      <div className={`p-5 border-t space-y-3 transition-colors duration-300 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
         <button
            onClick={handleDeepAnalysis}
            disabled={!currentFile || analysisStatus === AnalysisStatus.ANALYZING}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 font-medium transition-all duration-200
                ${!currentFile 
                    ? (isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400') + ' cursor-not-allowed' 
                    : analysisStatus === AnalysisStatus.ANALYZING
                        ? (isDarkMode ? 'bg-slate-800 text-cyan-400' : 'bg-slate-100 text-teal-600') + ' cursor-wait'
                        : (isDarkMode ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40' : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-900/20') + ' shadow-lg'
                }
            `}
         >
            {analysisStatus === AnalysisStatus.ANALYZING ? (
                <>
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-sm">{progressMessage}</span>
                </>
            ) : (
                <>
                    <span className="text-sm">Run Deep Analysis</span>
                    <ChevronRight size={16} />
                </>
            )}
         </button>

         {aiAnalysisOutput && analysisStatus === AnalysisStatus.COMPLETED && (
             <button 
                onClick={handleDownloadReport}
                className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 text-sm font-medium transition-colors ${
                    isDarkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
             >
                <Download size={16} />
                <span>Download Clinical Report</span>
             </button>
         )}
      </div>

    </div>
  );
};