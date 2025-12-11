import React from 'react';
import { Stethoscope, History, User, MapPin, Mic2, FileDigit, Settings2 } from 'lucide-react';
import { PatientContextData, RecordingLocation, AnalysisSession } from '../types';
import { motion } from 'framer-motion';

interface SidebarProps {
  patientData: PatientContextData;
  setPatientData: React.Dispatch<React.SetStateAction<PatientContextData>>;
}

// Mock history data
const RECENT_SESSIONS: AnalysisSession[] = [
  { id: '101', date: '2023-10-24', patientId: '157', fileName: '157_1b1_Al_sc_Meditron.wav', resultSummary: 'Wheeze detected' },
  { id: '102', date: '2023-10-23', patientId: '122', fileName: '122_2b1_Tc_mc_LittC2SE.wav', resultSummary: 'Normal vesicular' },
  { id: '103', date: '2023-10-22', patientId: '109', fileName: '109_1b1_Ll_sc_Meditron.wav', resultSummary: 'Crackles (fine)' },
];

const DEVICE_OPTIONS = [
  'AKG C417L Microphone',
  'Littmann Classic II SE',
  'Littmann 3200 Electronic',
  'WelchAllyn Meditron Master Elite',
  'Other / Unknown'
];

export const Sidebar: React.FC<SidebarProps> = ({ patientData, setPatientData }) => {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatientData(prev => ({ ...prev, [name]: value }));
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

      {/* Session History */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center space-x-2 text-slate-400 mb-4">
          <History size={16} />
          <h2 className="text-sm font-semibold uppercase tracking-wide">Session History</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {RECENT_SESSIONS.map((session, index) => (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-colors group"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-slate-300">PT-{session.patientId}</span>
                <span className="text-[10px] text-slate-500">{session.date}</span>
              </div>
              <p className="text-xs text-slate-400 truncate mb-1.5">{session.fileName}</p>
              <div className="flex items-center">
                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${session.resultSummary.includes('Normal') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-cyan-400 transition-colors">{session.resultSummary}</span>
              </div>
            </motion.div>
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