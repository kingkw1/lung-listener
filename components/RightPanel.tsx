import React, { useState } from 'react';
import { Sparkles, Activity, AlertTriangle, CheckCircle2, ChevronRight, BrainCircuit, Loader2, Copy, Check, Terminal, FileCode, Sliders, ToggleLeft, ToggleRight, Download } from 'lucide-react';
import { AudioFile, AnalysisStatus, AIFilterConfig, PatientContextData } from '../types';
import { motion } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- AI INFRASTRUCTURE SETUP ---

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
  aiAnalysisOutput: string;
  setAiAnalysisOutput: React.Dispatch<React.SetStateAction<string>>;
  setAiFilterConfig: React.Dispatch<React.SetStateAction<AIFilterConfig | null>>;
  aiFilterConfig: AIFilterConfig | null;
  isFilterActive: boolean;
  setIsFilterActive: React.Dispatch<React.SetStateAction<boolean>>;
  patientData: PatientContextData;
}

// --- HELPER COMPONENTS ---

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 mb-4 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-slate-400">
           <Terminal size={14} />
           <span className="text-xs font-mono font-medium text-cyan-500">Generated Research Tool: Audio Filter</span>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center space-x-1 text-[10px] text-slate-500 hover:text-cyan-400 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy Code'}</span>
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-xs text-slate-300 leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

// Simple Markdown parser to handle code blocks
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  // Split by triple backticks
  const parts = content.split(/```/);

  return (
    <div className="w-full">
      {parts.map((part, index) => {
        // Even indices are text, Odd indices are code (assuming standard markdown)
        if (index % 2 === 1) {
          // Extract language (if any) and code
          const lines = part.split('\n');
          const language = lines[0].trim() || 'python';
          const code = lines.slice(1).join('\n');
          return <CodeBlock key={index} language={language} code={code} />;
        } else {
          // Render regular text
          if (!part.trim()) return null;
          return (
             <div key={index} className="prose prose-invert prose-sm max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed mb-2">
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
  patientData
}) => {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [progressMessage, setProgressMessage] = useState("Initializing...");

  // Phase 3: Real Gemini API Integration
  const handleDeepAnalysis = async () => {
    if (!currentFile) return;
    
    // Initialize Stable AI client
    const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');

    setAnalysisStatus(AnalysisStatus.ANALYZING);
    setProgressMessage("Securely uploading buffer...");
    setMessages([]); // Clear previous analysis
    setAiAnalysisOutput(""); // Reset shared state
    setAiFilterConfig(null);
    setIsFilterActive(false);

    try {
        // 1. Retrieve the Blob from the local ObjectURL
        const response = await fetch(currentFile.url);
        const blob = await response.blob();

        // 2. Convert to GenAI Format
        const audioPart = await fileToGenerativePart(blob);
        
        setProgressMessage("Gemini 1.5 Pro is reasoning...");

        // 3. Construct System Prompt & User Prompt
        const systemInstruction = `You are an expert Pulmonologist. Analyze this audio waveform.
1. Quality Check: Briefly assess signal-to-noise ratio.
2. Timeline Analysis: You MUST provide specific timestamps (e.g., '0:02 - 0:05') for the most distinct anomalies. If a sound is continuous, mark the start and end of the most intense segment.
3. Diagnosis: Brief, bulleted potential causes.
4. Remediation Code: Based on the anomalies found (e.g., Low-frequency heartbeats or High-frequency hiss), generate a robust Python function using \`scipy.signal\` to filter this specific audio. Include comments explaining why you chose these cutoff frequencies. Label this section "Generated Research Tool: Audio Filter".
5. Filter Parameters: You MUST output a JSON object at the very end of your response for the recommended filter settings to be used in a Web Audio API BiquadFilterNode. Format: {"recommendedFilter": {"type": "highpass" | "lowpass" | "bandpass", "frequency": number, "Q": number}}. Do not use markdown for this JSON block, just the raw JSON string at the end.`;
        
        const userPrompt = "Analyze this audio. Locate the exact start/end time of the clearest Wheeze or Crackle.";

        // 4. Initialize Model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro",
            systemInstruction: systemInstruction 
        });

        // 5. Generate Stream
        const result = await model.generateContentStream([
            audioPart,
            userPrompt
        ]);

        setProgressMessage("Receiving diagnostic stream...");

        // 6. Process Stream
        let fullResponse = "";
        
        // Initialize the message in UI
        setMessages([{ role: 'assistant', content: '' }]);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                fullResponse += chunkText;
                setMessages([{ role: 'assistant', content: fullResponse }]);
                setAiAnalysisOutput(fullResponse); // Update shared state for visualization

                // Attempt to parse JSON filter config from the accumulating tail
                const jsonRegex = /\{"recommendedFilter":\s*\{[\s\S]*?\}\}/;
                const match = fullResponse.match(jsonRegex);
                if (match) {
                    try {
                        const json = JSON.parse(match[0]);
                        if (json.recommendedFilter) {
                             setAiFilterConfig(json.recommendedFilter);
                        }
                    } catch (e) {
                        // Ignore partial JSON parse errors as the stream continues
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

## AI DIAGNOSTIC FINDINGS (GEMINI 1.5 PRO)
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
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
              <Sparkles size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider">Gemini 1.5 Pro Analysis</h2>
          </div>
          <p className="text-xs text-slate-500">Multimodal Diagnostic Engine</p>
        </div>
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
                    <div className="flex items-center space-x-2 text-xs text-red-400 py-2 font-mono bg-red-900/20 px-3 rounded w-full">
                         <AlertTriangle size={12} />
                         <span>{msg.content}</span>
                    </div>
                )}
                
                {msg.role === 'assistant' && (
                    <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 w-full shadow-sm">
                        <MessageContent content={msg.content} />
                    </div>
                )}
            </motion.div>
        ))}
        
        {/* Loading Indicator inside chat */}
        {analysisStatus === AnalysisStatus.ANALYZING && messages.length === 0 && (
             <div className="flex items-center space-x-2 text-xs text-cyan-500 animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                <span>Establishing connection to Gemini...</span>
             </div>
        )}
      </div>

      {/* Footer / Action Area */}
      <div className="p-5 border-t border-slate-800 bg-slate-900 space-y-3">
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
                className="w-full py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
             >
                <Download size={16} />
                <span>Download Clinical Report</span>
             </button>
         )}
      </div>

    </div>
  );
};