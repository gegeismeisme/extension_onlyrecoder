import { loadConfig } from '../core/config';
import type { CaptureState, RegionBounds } from '../core/types/capture';
import type { RecorderStatus } from '../core/types/recorder';
import type { AppConfig } from '../core/types/config';
import { DEFAULT_CONFIG } from '../core/types/config';
import { mergeConfig, mergeOverrides } from '../core/utils/configMerge';
import { enqueueExport, getExportStatus } from './exporter';
import { createRecorderController } from '../recorder/controller';

const recordingState = {
  active: false,
  paused: false,
  regionMode: false,
  audio: {
    mic: true,
    system: true
  },
  permissions: {
    audio: false,
    screen: false
  },
  timeline: {
    startedAt: null,
    elapsedMs: 0
  }
};

const captureState: CaptureState = {
  mode: 'tab'
};

let timelineInterval: number | null = null;
let baseConfig: AppConfig = DEFAULT_CONFIG;
let configOverrides: Partial<AppConfig> | null = null;
let runtimeConfig: AppConfig = DEFAULT_CONFIG;
let lastCaptureOptions: {
  mode: CaptureState['mode'];
  region?: RegionBounds;
  captureAudio: boolean;
  config: AppConfig;
} | null = null;

const recorder = createRecorderController({
  onStatusChange: (status: RecorderStatus) => {
    recordingState.active = status !== 'idle';
    recordingState.paused = status === 'paused';
    if (status === 'recording' && !timelineInterval) {
      recordingState.timeline.startedAt = Date.now();
      recordingState.timeline.elapsedMs = 0;
      timelineInterval = setInterval(() => {
        if (recordingState.timeline.startedAt) {
          recordingState.timeline.elapsedMs = Date.now() - recordingState.timeline.startedAt;
          chrome.runtime.sendMessage({
            type: 'recorder:timeline',
            timeline: recordingState.timeline
          });
        }
      }, 1000) as unknown as number;
    }
    if (status === 'paused' && recordingState.timeline.startedAt) {
      recordingState.timeline.elapsedMs = Date.now() - recordingState.timeline.startedAt;
      chrome.runtime.sendMessage({ type: 'recorder:timeline', timeline: recordingState.timeline });
    }
    if (status === 'idle') {
      if (timelineInterval) {
        clearInterval(timelineInterval);
        timelineInterval = null;
      }
      recordingState.timeline.startedAt = null;
      recordingState.timeline.elapsedMs = 0;
      chrome.runtime.sendMessage({ type: 'recorder:timeline', timeline: recordingState.timeline });
    }
    chrome.action.setBadgeText({
      text: status === 'idle' ? '' : status === 'paused' ? 'PAU' : 'REC'
    });
    chrome.runtime.sendMessage({ type: 'recorder:status-changed', status });
  },
  onResult: (result) => {
    chrome.runtime.sendMessage({
      type: 'recorder:file-ready',
      mimeType: result.mimeType,
      url: result.url,
      size: result.size,
      durationMs: result.durationMs
    });
    enqueueExport(result, runtimeConfig);
  },
  onError: (error) => {
    chrome.runtime.sendMessage({ type: 'recorder:error', message: error.message });
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  baseConfig = await loadConfig();
  await loadOverridesFromStorage();
  recomputeConfig();
  console.info('[OnlyRecoder] extension installed');
});

(async () => {
  baseConfig = await loadConfig();
  await loadOverridesFromStorage();
  recomputeConfig();
})();

chrome.commands.onCommand.addListener(async (command) => {
  switch (command) {
    case 'toggle-recording':
      await toggleRecording();
      break;
    case 'mark-region':
      recordingState.regionMode = !recordingState.regionMode;
      chrome.runtime.sendMessage({ type: 'region:toggle', enabled: recordingState.regionMode });
      break;
    default:
      break;
  }
});

chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  switch (message?.type) {
    case 'recorder:status':
      sendResponse(recordingState);
      break;
    case 'recorder:toggle':
      toggleRecording().then(() => sendResponse(recordingState));
      break;
    case 'recorder:pause':
      recorder.pause();
      sendResponse(recordingState);
      break;
    case 'recorder:resume':
      recorder.resume();
      sendResponse(recordingState);
      break;
    case 'audio:toggle':
      if (message.channel === 'mic' || message.channel === 'system') {
        recordingState.audio[message.channel] = Boolean(message.enabled);
        chrome.runtime.sendMessage({ type: 'audio:updated', audio: recordingState.audio });
        await restartRecording('audio-toggle');
      }
      sendResponse(recordingState.audio);
      break;
    case 'region:toggle': {
      recordingState.regionMode = !recordingState.regionMode;
      chrome.runtime.sendMessage({ type: 'region:toggle', enabled: recordingState.regionMode });
      if (recordingState.regionMode) {
        captureState.mode = 'region';
        await openRegionOverlay();
      } else {
        if (!captureState.region) {
          captureState.mode = 'tab';
        }
        await closeRegionOverlay();
      }
      sendResponse({ regionMode: recordingState.regionMode });
      break;
    }
    case 'region:selected': {
      captureState.region = message.region as RegionBounds;
      captureState.mode = 'region';
      chrome.runtime.sendMessage({ type: 'region:selected', region: captureState.region });
      await closeRegionOverlay();
      chrome.runtime.sendMessage({ type: 'region:toggle', enabled: false });
      sendResponse({ region: captureState.region });
      await restartRecording('region-selected');
      break;
    }
    case 'region:clear': {
      captureState.region = undefined;
      captureState.mode = 'tab';
      chrome.runtime.sendMessage({ type: 'region:cleared' });
      sendResponse({ regionCleared: true });
      await restartRecording('region-cleared');
      break;
    }
    case 'capture:request': {
      const streamId = await requestTabCapture();
      chrome.runtime.sendMessage({
        type: 'recorder:permissions',
        permissions: recordingState.permissions
      });
      sendResponse({
        ok: Boolean(streamId),
        streamId,
        permissions: recordingState.permissions
      });
      break;
    }
    case 'capture:stop': {
      await stopCapture();
      sendResponse({ stopped: true });
      break;
    }
    case 'config:get': {
      sendResponse({ config: runtimeConfig, overrides: configOverrides });
      break;
    }
    case 'config:update': {
      configOverrides = mergeOverrides(configOverrides, message.patch as Partial<AppConfig>);
      persistOverrides();
      recomputeConfig();
      sendResponse({ config: runtimeConfig });
      await restartRecording('config-update');
      break;
    }
    case 'config:refresh': {
      baseConfig = await loadConfig();
      recomputeConfig();
      sendResponse({ config: runtimeConfig });
      await restartRecording('config-refresh');
      break;
    }
    case 'export:status': {
      sendResponse({ status: getExportStatus() });
      break;
    }
    default:
      break;
  }
  return true;
});

async function toggleRecording() {
  const isIdle = recorder.status() === 'idle';
  if (isIdle) {
    const captureAudio = recordingState.audio.mic || recordingState.audio.system;
    const options = {
      mode: captureState.mode,
      region: captureState.region,
      captureAudio,
      config: runtimeConfig
    };
    const started = await recorder.start(options);
    if (!started) {
      chrome.runtime.sendMessage({ type: 'recorder:error', message: 'Failed to start recording.' });
      lastCaptureOptions = null;
    } else {
      recordingState.permissions.audio = captureAudio;
      lastCaptureOptions = options;
    }
  } else {
    await recorder.stop();
    lastCaptureOptions = null;
  }
  chrome.action.setBadgeBackgroundColor({ color: '#FF4D4D' });
  chrome.runtime.sendMessage({ type: 'recorder:toggled', active: recorder.status() !== 'idle' });
}

async function restartRecording(reason: string) {
  if (recorder.status() !== 'recording' || !lastCaptureOptions) return;
  const captureAudio = recordingState.audio.mic || recordingState.audio.system;
  const options = {
    ...lastCaptureOptions,
    mode: captureState.mode,
    region: captureState.region,
    captureAudio,
    config: runtimeConfig
  };
  lastCaptureOptions = options;
  try {
    await recorder.restart(options);
    chrome.runtime.sendMessage({ type: 'recorder:restart', reason });
  } catch (error) {
    console.warn('[recorder] failed to restart stream', error);
  }
}

async function openRegionOverlay() {
  const hasOffscreen = await chrome.offscreen.hasDocument?.();
  if (!hasOffscreen) {
    await chrome.offscreen.createDocument?.({
      url: 'offscreen/index.html',
      reasons: [chrome.offscreen.Reason.USER_MEDIA],
      justification: 'Region selection overlay'
    });
  }
  chrome.runtime.sendMessage({ type: 'region:overlay-open' });
}

async function closeRegionOverlay() {
  recordingState.regionMode = false;
  const hasOffscreen = await chrome.offscreen.hasDocument?.();
  if (hasOffscreen) {
    await chrome.offscreen.closeDocument?.();
  }
  chrome.runtime.sendMessage({ type: 'region:overlay-close' });
}

async function requestTabCapture(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!chrome.tabCapture || typeof chrome.tabCapture.getMediaStreamId !== 'function') {
      console.warn('[capture] tabCapture API is unavailable in this browser');
      recordingState.permissions.screen = false;
      chrome.runtime.sendMessage({
        type: 'recorder:error',
        message: '当前浏览器不支持 tabCapture，请切换到 Chrome/Edge 或使用桌面捕获。'
      });
      chrome.desktopCapture.chooseDesktopMedia(['window', 'screen', 'tab'], (streamId) => {
        if (!streamId) {
          resolve(null);
        } else {
          resolve(streamId);
        }
      });
      return;
    }

    if (!captureState.tabId) {
      resolve(null);
      return;
    }
    chrome.tabCapture.getMediaStreamId({ targetTabId: captureState.tabId }, (streamId) => {
      if (chrome.runtime.lastError) {
        console.warn('[capture] getMediaStreamId failed', chrome.runtime.lastError);
        recordingState.permissions.screen = false;
        resolve(null);
        return;
      }
      recordingState.permissions.screen = Boolean(streamId);
      resolve(streamId);
    });
  });
}

async function stopCapture() {
  chrome.runtime.sendMessage({ type: 'capture:stopped' });
}

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  captureState.tabId = tabId;
  captureState.windowId = windowId;
  restartRecording('tab-activated');
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  refreshActiveTab(windowId, true);
});

chrome.runtime.onStartup.addListener(() => {
  refreshActiveTab(undefined, true);
});

refreshActiveTab(undefined, true);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.configOverrides) {
    configOverrides = (changes.configOverrides.newValue as Partial<AppConfig>) ?? null;
    recomputeConfig();
    chrome.runtime.sendMessage({ type: 'config:updated', config: runtimeConfig });
  }
});

function refreshActiveTab(windowId?: number, shouldRestart = false) {
  const query: chrome.tabs.QueryInfo =
    windowId && windowId !== chrome.windows.WINDOW_ID_NONE
      ? { active: true, windowId }
      : { active: true, currentWindow: true };

  chrome.tabs.query(query, (tabs) => {
    const tab = tabs[0];
    if (tab?.id) {
      captureState.tabId = tab.id;
      captureState.windowId = tab.windowId;
      if (shouldRestart) {
        restartRecording('focus-changed');
      }
    }
  });
}
async function loadOverridesFromStorage() {
  try {
    const result = await chrome.storage.local.get(['configOverrides']);
    configOverrides = (result.configOverrides as Partial<AppConfig>) ?? null;
  } catch (error) {
    console.warn('[config] failed to load overrides', error);
    configOverrides = null;
  }
}

async function persistOverrides() {
  try {
    await chrome.storage.local.set({ configOverrides });
  } catch (error) {
    console.warn('[config] failed to persist overrides', error);
  }
}

const recomputeConfig = () => {
  runtimeConfig = mergeConfig(baseConfig, configOverrides);
};
