export type CaptureMode = 'tab' | 'window' | 'screen' | 'region';

export interface RegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CaptureState {
  streamId?: string;
  mode: CaptureMode;
  region?: RegionBounds;
  tabId?: number;
  windowId?: number;
}
