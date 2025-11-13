import type { RecordingResult } from '../core/types/recorder';
import type { AppConfig } from '../core/types/config';

type ExportStatus = 'idle' | 'processing';

const jobQueue: RecordingResult[] = [];

let status: ExportStatus = 'idle';

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
    return;
  }

  status = 'processing';
  chrome.runtime.sendMessage({ type: 'export:status', status });

  const job = jobQueue.shift()!;

  // Placeholder for future ffmpeg.wasm processing
  // We could feed job.blob into FFmpeg when export format differs.
  await download(job, config);

  processQueue(config);
}

async function download(result: RecordingResult, config: AppConfig) {
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
