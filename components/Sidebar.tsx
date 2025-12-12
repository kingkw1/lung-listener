import React, { useState } from 'react';
import { Stethoscope, Library, User, MapPin, Mic2, FileDigit, Settings2, PlayCircle, Loader2 } from 'lucide-react';
import { PatientContextData, RecordingLocation } from '../types';
import { motion } from 'framer-motion';

interface SidebarProps {
  patientData: PatientContextData;
  setPatientData: React.Dispatch<React.SetStateAction<PatientContextData>>;
  onLoadDemo: (audioFile: File, labelText: string, labelFileName: string) => void;
}

const DEMO_CASES = [
  {
    name: "Case 1: Crackles (Pneumonia)",
    audioUrl: "https://raw.githubusercontent.com/kingkw1/geminiKaggleHackathonMedia/main/crackle/218_1b1_Pr_sc_Meditron.wav",
    labelUrl: "https://raw.githubusercontent.com/kingkw1/geminiKaggleHackathonMedia/main/crackle/218_1b1_Pr_sc_Meditron.txt",
    filename: "218_1b1_Pr_sc_Meditron.wav",
    patientId: "218"
  },
  {
    name: "Case 2: Wheeze (Asthma/COPD)",
    audioUrl: "https://raw.githubusercontent.com/kingkw1/geminiKaggleHackathonMedia/main/wheeze/175_1b1_Ll_sc_Litt3200.wav",
    labelUrl: "https://raw.githubusercontent.com/kingkw1/geminiKaggleHackathonMedia/main/wheeze/175_1b1_Ll_sc_Litt3200.txt",
    filename: "175_1b1_Ll_sc_Litt3200.wav",
    patientId: "175"
  },
  {
    name: "Case 3: Healthy Control",
    audioUrl: "https://raw.githubusercontent.com/kingkw1/geminiKaggleHackathonMedia/main/healthy/202_1b1_Ar_sc_Meditron.wav",
    labelUrl: "https://raw.githubusercontent.com/kingkw1/geminiKaggleHackathonMedia/main/healthy/202_1b1_Ar_sc_Meditron.txt",
    filename: "202_1b1_Ar_sc_Meditron.wav",
    patientId: "202"
  }
];

const DEVICE_OPTIONS = [
  'AKG C417L Microphone',
  'Littmann Classic II SE',
  'Littmann 3200 Electronic',
  'WelchAllyn Meditron Master Elite',
  'Other / Unknown'
];

export const Sidebar: React.FC<SidebarProps> = ({ patientData, setPatientData, onLoadDemo }) => {
  const [loadingCase, setLoadingCase] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatientData(prev => ({ ...prev, [name]: value }));
  };

  const loadRemoteCase = async (demoCase: typeof DEMO_CASES[0]) => {
    setLoadingCase(demoCase.name);
    try {
        // Step A: Fetch Audio
        const audioRes = await fetch(demoCase.audioUrl);
        if (!audioRes.ok) throw new Error("Failed to fetch audio");
        const audioBlob = await audioRes.blob();
        const audioFile = new File([audioBlob], demoCase.filename, { type: 'audio/wav' });

        // Step B: Fetch Labels
        const labelRes = await fetch(demoCase.labelUrl);
        if (!labelRes.ok) throw new Error("Failed to fetch labels");
        const labelText = await labelRes.text();

        // Step C: Trigger Load in App
        onLoadDemo(audioFile, labelText, demoCase.filename.replace('.wav', '.txt'));
        
        // Auto-fill Patient ID
        setPatientData(prev => ({ ...prev, id: demoCase.patientId }));

    } catch (e) {
        console.error(e);
        alert("Failed to load demo case. Please check your connection.");
    } finally {
        setLoadingCase(null);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3 text-cyan-400">
        <Stethoscope size={32} strokeWidth={2} />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">Lung Listener</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">DeepMind Health</p>
        </div>
      </div>

      {/* Patient Context Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-slate-400 mb-2">
          <User size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Patient Context</h2>
        </div>
        
        <div className="space-y-4">
          
          {/* Row 1: Patient ID & Index */}
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label htmlFor="id" className="text-[10px] text-slate-500 font-bold uppercase ml-1">Patient No.</label>
                <div className="relative">
                    <input
                      type="text"
                      name="id"
                      id="id"
                      value={patientData.id}
                      onChange={handleInputChange}
                      placeholder="101"
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-slate-600 font-mono"
                    />
                    <User size={12} className="absolute right-2.5 top-2.5 text-slate-600 pointer-events-none" />
                </div>
             </div>
             
             <div className="space-y-1">
                <label htmlFor="index" className="text-[10px] text-slate-500 font-bold uppercase ml-1">Index</label>
                <div className="relative">
                    <input
                      type="text"
                      name="index"
                      id="index"
                      value={patientData.index}
                      onChange={handleInputChange}
                      placeholder="1b1"
                      className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-slate-600 font-mono"
                    />
                    <FileDigit size={12} className="absolute right-2.5 top-2.5 text-slate-600 pointer-events-none" />
                </div>
             </div>
          </div>

          {/* Row 2: Location */}
          <div className="space-y-1">
            <label htmlFor="location" className="text-[10px] text-slate-500 font-bold uppercase ml-1">Chest Location</label>
            <div className="relative">
              <select
                name="location"
                id="location"
                value={patientData.location}
                onChange={handleInputChange}
                className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
              >
                {Object.values(RecordingLocation).map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <MapPin size={12} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Row 3: Acquisition Mode */}
          <div className="space-y-1">
             <label htmlFor="mode" className="text-[10px] text-slate-500 font-bold uppercase ml-1">Acquisition Mode</label>
             <div className="relative">
                <select
                  name="mode"
                  id="mode"
                  value={patientData.mode}
                  onChange={handleInputChange}
                  className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                >
                  <option value="Single Channel">Single Channel (Sequential)</option>
                  <option value="Multichannel">Multichannel (Simultaneous)</option>
                </select>
                <Settings2 size={12} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
             </div>
          </div>

          {/* Row 4: Device */}
          <div className="space-y-1">
             <label htmlFor="equipment" className="text-[10px] text-slate-500 font-bold uppercase ml-1">Recording Equipment</label>
             <div className="relative">
                <select
                  name="equipment"
                  id="equipment"
                  value={patientData.equipment}
                  onChange={handleInputChange}
                  className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                >
                  <option value="" disabled>Select Device...</option>
                  {DEVICE_OPTIONS.map((device) => (
                     <option key={device} value={device}>{device}</option>
                  ))}
                </select>
                <Mic2 size={12} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
             </div>
          </div>

        </div>
      </div>

      {/* Reference Cases Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center space-x-2 text-slate-400 mb-4">
          <Library size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Reference Cases</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {DEMO_CASES.map((demo, index) => (
            <motion.button 
              key={demo.name}
              onClick={() => loadRemoteCase(demo)}
              disabled={!!loadingCase}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group relative overflow-hidden
                  ${loadingCase === demo.name 
                      ? 'bg-slate-800 border-cyan-500/50 cursor-wait' 
                      : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 hover:border-cyan-900/50 cursor-pointer'
                  }
              `}
            >
              <div className="flex justify-between items-center mb-1 relative z-10">
                <span className={`text-xs font-bold transition-colors ${loadingCase === demo.name ? 'text-cyan-400' : 'text-slate-300 group-hover:text-cyan-200'}`}>
                    {demo.name}
                </span>
                {loadingCase === demo.name ? (
                    <Loader2 size={14} className="animate-spin text-cyan-500" />
                ) : (
                    <PlayCircle size={14} className="text-slate-600 group-hover:text-cyan-500 transition-colors" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 truncate font-mono relative z-10">
                 {demo.filename}
              </p>
              
              {/* Active Indicator Bar */}
              <div className={`absolute bottom-0 left-0 h-0.5 bg-cyan-500 transition-all duration-500 ${loadingCase === demo.name ? 'w-full' : 'w-0'}`} />
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Footer info */}
      <div className="text-[10px] text-slate-600 border-t border-slate-800 pt-4">
        v2.5.0-alpha • Research Use Only
      </div>
    </div>
  );
};