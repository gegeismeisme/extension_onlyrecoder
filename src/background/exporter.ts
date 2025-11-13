import type { RecordingResult } from '../core/types/recorder';
import type { AppConfig } from '../core/types/config';
type FFmpegInstance = Awaited<ReturnType<any>>;
let ffmpegFactory: ((options: { log: boolean }) => FFmpegInstance) | null = null;
let ffmpegInstance: FFmpegInstance | null = null;

type ExportStatus = 'idle' | 'processing';
type ExportStage = 'queued' | 'ffmpeg-loading' | 'ffmpeg-stub' | 'download';

const jobQueue: RecordingResult[] = [];

let status: ExportStatus = 'idle';

let ffmpegLoaded = false;
let ffmpegLoading: Promise<void> | null = null;

const sendStage = (jobId: string, stage: ExportStage) => {
  chrome.runtime.sendMessage({ type: 'export:progress', jobId, stage });
};

export const getExportStatus = () => status;

export async function enqueueExport(result: RecordingResult, config: AppConfig) {
  jobQueue.push(result);
  if (status === 'idle') {
    processQueue(config);
  }
}

async function processQueue(config: AppConfig) {
  if (!jobQueue.length) {
    status = 'idle';
    chrome.runtime.sendMessage({ type: 'export:status', status });
    sendStage('none', 'queued');
    return;
  }

  status = 'processing';
  chrome.runtime.sendMessage({ type: 'export:status', status });

  const job = jobQueue.shift()!;
  const jobId = `${Date.now()}-${Math.random()}`;

  const processed = await maybeTranscode(job, config, jobId);
  await download(processed, config, jobId);

  processQueue(config);
}

async function maybeTranscode(
  job: RecordingResult,
  config: AppConfig,
  jobId: string
): Promise<RecordingResult> {
  if (!config.storage.transcodeToMp4) {
    return job;
  }
  try {
    const ffmpegInstance = await ensureFFmpeg(jobId);
    if (!ffmpegInstance) {
      return job;
    }
    sendStage(jobId, 'ffmpeg-stub');
    const inputName = `input-${jobId}.webm`;
    const outputName = `output-${jobId}.mp4`;
    const inputData = new Uint8Array(await job.blob.arrayBuffer());
    ffmpegInstance.FS('writeFile', inputName, inputData);
    await ffmpegInstance.run(
      '-i',
      inputName,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-pix_fmt',
      'yuv420p',
      outputName
    );
    const outputData = ffmpegInstance.FS('readFile', outputName);
    ffmpegInstance.FS('unlink', inputName);
    ffmpegInstance.FS('unlink', outputName);
    URL.revokeObjectURL(job.url);
    const blob = new Blob([outputData.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    return {
      ...job,
      blob,
      url,
      mimeType: 'video/mp4',
      size: blob.size
    };
  } catch (error) {
    console.warn('[export] ffmpeg stub failed, fallback to original blob', error);
    return job;
  }
}

async function ensureFFmpeg(jobId: string) {
  try {
    if (!ffmpegFactory) {
      sendStage(jobId, 'ffmpeg-loading');
      const mod = (await import('@ffmpeg/ffmpeg')) as any;
      ffmpegFactory = mod.createFFmpeg ?? mod.default?.createFFmpeg;
      if (!ffmpegFactory) {
        throw new Error('createFFmpeg factory missing');
      }
      ffmpegInstance = ffmpegFactory({ log: false });
      ffmpegLoaded = false;
      ffmpegLoading = null;
    }

    if (!ffmpegLoaded) {
      if (!ffmpegLoading) {
        ffmpegLoading = ffmpegInstance!.load().catch((error: unknown) => {
          ffmpegLoading = null;
          throw error;
        });
      }
      await ffmpegLoading;
      ffmpegLoaded = true;
    }

    return ffmpegInstance;
  } catch (error) {
    console.warn('[export] ensureFFmpeg failed', error);
    return null;
  }
}

async function download(result: RecordingResult, config: AppConfig, jobId: string) {
  sendStage(jobId, 'download');
  return new Promise<void>((resolve) => {
    chrome.downloads.download(
      {
        url: result.url,
        filename: `OnlyRecoder-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`,
        saveAs: config.storage.autoExport === 'Picker'
      },
      () => {
        URL.revokeObjectURL(result.url);
        resolve();
      }
    );
  });
}
