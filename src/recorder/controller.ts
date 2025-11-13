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
  restart: (options: StartOptions) => Promise<void>;
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

  const captureTab = async (captureAudio: boolean, config: AppConfig, region?: RegionBounds) => {
    const stream = await new Promise<MediaStream | null>((resolve) => {
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
        (streamResult) => {
          if (chrome.runtime.lastError) {
            console.warn('[recorder] tab capture failed', chrome.runtime.lastError);
            resolve(null);
            return;
          }
          resolve(streamResult);
        }
      );
    });

    if (stream && region) {
      return applyRegionCrop(stream, region);
    }

    return stream;
  };

  type DesktopCaptureConstraints = {
    audio: boolean;
    video: {
      mandatory: {
        chromeMediaSource: 'desktop';
        chromeMediaSourceId: string;
      };
    };
  };

  const captureDesktop = async (streamId: string, captureAudio: boolean, region?: RegionBounds) => {
    try {
      const constraints: DesktopCaptureConstraints = {
        audio: captureAudio,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId
          }
        }
      };
      const stream = (await (navigator.mediaDevices as any).getUserMedia(
        constraints
      )) as MediaStream;
      if (region) {
        return applyRegionCrop(stream, region);
      }
      return stream;
    } catch (error) {
      console.warn('[recorder] desktop capture fallback failed', error);
      return null;
    }
  };

  const applyRegionCrop = async (stream: MediaStream, region: RegionBounds) => {
    if (
      typeof MediaStreamTrackProcessor === 'undefined' ||
      typeof MediaStreamTrackGenerator === 'undefined'
    ) {
      console.warn(
        '[recorder] region crop is not supported in this browser, fallback to full stream'
      );
      return stream;
    }
    const videoTrack = stream.getVideoTracks()[0];
    const processor = new MediaStreamTrackProcessor({ track: videoTrack });
    const generator = new MediaStreamTrackGenerator({ kind: 'video' });
    const transformer = new TransformStream({
      async transform(videoFrame: VideoFrame, controller) {
        const cropped = new VideoFrame(videoFrame, {
          visibleRect: {
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height
          }
        });
        controller.enqueue(cropped);
        videoFrame.close();
      }
    });

    processor.readable.pipeThrough(transformer).pipeTo(generator.writable);
    const croppedStream = new MediaStream([generator, ...stream.getAudioTracks()]);
    return croppedStream;
  };

  const start: RecorderController['start'] = async ({ captureAudio, mode, config, region }) => {
    if (currentStatus === 'recording') return true;
    try {
      ensureMediaRecorderSupport();
      let stream = await captureTab(captureAudio, config, region);
      if (!stream) {
        const fallbackStreamId = await chrome.runtime.sendMessage({ type: 'capture:request' });
        if (fallbackStreamId?.streamId) {
          stream = await captureDesktop(fallbackStreamId.streamId, captureAudio, region);
        }
      }
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

  const restart: RecorderController['restart'] = async (options) => {
    if (currentStatus === 'recording') {
      await stop();
      await start(options);
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
    restart,
    status: () => currentStatus
  };
}
