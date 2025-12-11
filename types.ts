export interface PatientContextData {
  id: string;        // Patient ID (e.g., 157)
  index: string;     // Recording Index (e.g., 1b1)
  location: string;  // Chest Location (e.g., Anterior Left)
  mode: string;      // Acquisition Mode (e.g., Single Channel)
  equipment: string; // Equipment (e.g., Meditron)
}

export interface AudioFile {
  name: string;
  url: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface AnalysisSession {
  id: string;
  date: string;
  patientId: string;
  fileName: string;
  resultSummary: string;
}

export interface AIFilterConfig {
  type: 'lowpass' | 'highpass' | 'bandpass';
  frequency: number;
  Q: number;
}

export interface RegionData {
  id: string;
  start: number;
  end: number;
  content: string;
  color: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum RecordingLocation {
  TRACHEA = 'Trachea',
  ANTERIOR_LEFT = 'Anterior Left',
  ANTERIOR_RIGHT = 'Anterior Right',
  POSTERIOR_LEFT = 'Posterior Left',
  POSTERIOR_RIGHT = 'Posterior Right',
  LATERAL_LEFT = 'Lateral Left',
  LATERAL_RIGHT = 'Lateral Right',
  AXILLARY = 'Axillary',
  UNKNOWN = 'Unknown'
}