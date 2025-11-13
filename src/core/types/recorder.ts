export type RecorderStatus = 'idle' | 'recording' | 'paused';

export interface RecordingResult {
  blob: Blob;
  url: string;
  mimeType: string;
  durationMs: number;
  size: number;
}
