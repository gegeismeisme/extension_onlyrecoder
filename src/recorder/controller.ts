import type { CaptureMode, RegionBounds } from '../core/types/capture';
import type { RecorderStatus, RecordingResult } from '../core/types/recorder';
import type { AppConfig } from '../core/types/config';

interface RecorderCallbacks {
  onStatusChange: (status: RecorderStatus) => void;
  onResult: (result: RecordingResult) => void;
  onError: (error: Error) => void;
}

interface StartOptions {
  mode: CaptureMode;
  region?: RegionBounds;
  captureAudio: boolean;
  config: AppConfig;
}

interface RecorderController {
  start: (options: StartOptions) => Promise<boolean>;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<void>;
  status: () => RecorderStatus;
}

export function createRecorderController(callbacks: RecorderCallbacks): RecorderController {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let currentStream: MediaStream | null = null;
  let currentStatus: RecorderStatus = 'idle';
  let startedAt = 0;
  let currentOnStop: ((event: Event) => void) | null = null;

  const setStatus = (status: RecorderStatus) => {
    currentStatus = status;
    callbacks.onStatusChange(status);
  };

  const cleanupStream = () => {
    currentStream?.getTracks().forEach((track) => track.stop());
    currentStream = null;
  };

  const buildRecorder = (stream: MediaStream, config: AppConfig) => {
    const mimeCandidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    let recorder: MediaRecorder | null = null;
    for (const mimeType of mimeCandidates) {
      if (!MediaRecorder.isTypeSupported(mimeType)) continue;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: config.video.maxBitrate * 1000
        });
        recorder.mimeType = mimeType;
        break;
      } catch {
        continue;
      }
    }
    if (!recorder) {
      recorder = new MediaRecorder(stream);
    }
    return recorder;
  };

  const ensureMediaRecorderSupport = () => {
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('MediaRecorder API is unavailable in this context.');
    }
  };

  const captureTab = (captureAudio: boolean, config: AppConfig) =>
    new Promise<MediaStream | null>((resolve) => {
      const resolutionConstraints: Record<string, { maxWidth?: number; maxHeight?: number }> = {
        auto: {},
        '1080p': { maxWidth: 1920, maxHeight: 1080 },
        '4k': { maxWidth: 3840, maxHeight: 2160 }
      };
      const targetResolution =
        resolutionConstraints[config.video.resolution] ?? resolutionConstraints.auto;

      chrome.tabCapture.capture(
        {
          audio: captureAudio,
          video: true,
          videoConstraints: {
            mandatory: {
              chromeMediaSource: 'tab',
              maxFrameRate: config.video.framerate,
              ...targetResolution
            }
          }
        },
        (stream) => {
          if (chrome.runtime.lastError) {
            console.warn('[recorder] tab capture failed', chrome.runtime.lastError);
            resolve(null);
            return;
          }
          resolve(stream);
        }
      );
    });

  const start: RecorderController['start'] = async ({ captureAudio, mode, config }) => {
    if (currentStatus === 'recording') return true;
    try {
      ensureMediaRecorderSupport();
      const stream = await captureTab(captureAudio, config);
      if (!stream) {
        throw new Error('Unable to capture tab. Check permissions.');
      }
      chunks = [];
      const recorder = buildRecorder(stream, config);
      mediaRecorder = recorder;
      currentStream = stream;
      startedAt = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onerror = (event) => {
        console.error('[recorder] MediaRecorder error', event.error);
        callbacks.onError(event.error);
      };
      recorder.onstop = () => {
        cleanupStream();
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        callbacks.onResult({
          blob,
          url,
          mimeType: blob.type,
          durationMs: Date.now() - startedAt,
          size: blob.size
        });
        chunks = [];
        setStatus('idle');
        currentOnStop = null;
      };
      currentOnStop = recorder.onstop;

      recorder.start(1000);
      setStatus('recording');
      chrome.runtime.sendMessage({ type: 'recorder:capture-mode', mode });
      return true;
    } catch (error) {
      cleanupStream();
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks.onError(err);
      setStatus('idle');
      return false;
    }
  };

  const pause: RecorderController['pause'] = () => {
    if (mediaRecorder && currentStatus === 'recording') {
      mediaRecorder.pause();
      setStatus('paused');
    }
  };

  const resume: RecorderController['resume'] = () => {
    if (mediaRecorder && currentStatus === 'paused') {
      mediaRecorder.resume();
      setStatus('recording');
    }
  };

  const stop: RecorderController['stop'] = async () => {
    if (!mediaRecorder) return;
    const recorder = mediaRecorder;
    if (recorder.state === 'inactive') {
      mediaRecorder = null;
      return;
    }
    await new Promise<void>((resolve) => {
      const originalOnStop = currentOnStop;
      recorder.onstop = (event: Event) => {
        originalOnStop?.(event);
        resolve();
      };
      recorder.stop();
    });
    mediaRecorder = null;
  };

  return {
    start,
    pause,
    resume,
    stop,
    status: () => currentStatus
  };
}
