import { loadConfig } from '../core/config';
import type { CaptureState, RegionBounds } from '../core/types/capture';
import type { RecorderStatus } from '../core/types/recorder';
import { createRecorderController } from '../recorder/controller';

const recordingState = {
  active: false,
  paused: false,
  regionMode: false,
  audio: {
    mic: true,
    system: true
  }
};

const captureState: CaptureState = {
  mode: 'tab'
};

const recorder = createRecorderController({
  onStatusChange: (status: RecorderStatus) => {
    recordingState.active = status !== 'idle';
    recordingState.paused = status === 'paused';
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
    chrome.downloads.download(
      {
        url: result.url,
        filename: `OnlyRecoder-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`,
        saveAs: false
      },
      () => {
        URL.revokeObjectURL(result.url);
      }
    );
  },
  onError: (error) => {
    chrome.runtime.sendMessage({ type: 'recorder:error', message: error.message });
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await loadConfig();
  console.info('[OnlyRecoder] extension installed');
});

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
      break;
    }
    case 'region:clear': {
      captureState.region = undefined;
      captureState.mode = 'tab';
      chrome.runtime.sendMessage({ type: 'region:cleared' });
      sendResponse({ regionCleared: true });
      break;
    }
    case 'capture:request': {
      const streamId = await requestTabCapture();
      sendResponse({ ok: Boolean(streamId), streamId });
      break;
    }
    case 'capture:stop': {
      await stopCapture();
      sendResponse({ stopped: true });
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
    const started = await recorder.start({
      mode: captureState.mode,
      region: captureState.region,
      captureAudio
    });
    if (!started) {
      chrome.runtime.sendMessage({ type: 'recorder:error', message: 'Failed to start recording.' });
    }
  } else {
    await recorder.stop();
  }
  chrome.action.setBadgeBackgroundColor({ color: '#FF4D4D' });
  chrome.runtime.sendMessage({ type: 'recorder:toggled', active: recorder.status() !== 'idle' });
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
    if (!captureState.tabId) {
      resolve(null);
      return;
    }
    chrome.tabCapture.getMediaStreamId({ targetTabId: captureState.tabId }, (streamId) => {
      if (chrome.runtime.lastError) {
        console.warn('[capture] getMediaStreamId failed', chrome.runtime.lastError);
        resolve(null);
        return;
      }
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
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  refreshActiveTab(windowId);
});

chrome.runtime.onStartup.addListener(() => {
  refreshActiveTab();
});

refreshActiveTab();

function refreshActiveTab(windowId?: number) {
  const query: chrome.tabs.QueryInfo =
    windowId && windowId !== chrome.windows.WINDOW_ID_NONE
      ? { active: true, windowId }
      : { active: true, currentWindow: true };

  chrome.tabs.query(query, (tabs) => {
    const tab = tabs[0];
    if (tab?.id) {
      captureState.tabId = tab.id;
      captureState.windowId = tab.windowId;
    }
  });
}
