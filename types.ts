export interface PatientContextData {
  id: string;
  location: string;
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
  AXILLARY = 'Axillary'
}