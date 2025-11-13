import { loadConfig } from '../core/config';

const recordingState = {
  active: false,
  paused: false,
  regionMode: false,
  audio: {
    mic: true,
    system: true
  }
};

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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message?.type) {
    case 'recorder:status':
      sendResponse(recordingState);
      break;
    case 'recorder:toggle':
      toggleRecording().then(() => sendResponse(recordingState));
      break;
    case 'audio:toggle':
      if (message.channel === 'mic' || message.channel === 'system') {
        recordingState.audio[message.channel] = Boolean(message.enabled);
        chrome.runtime.sendMessage({ type: 'audio:updated', audio: recordingState.audio });
      }
      sendResponse(recordingState.audio);
      break;
    case 'region:toggle':
      recordingState.regionMode = !recordingState.regionMode;
      chrome.runtime.sendMessage({ type: 'region:toggle', enabled: recordingState.regionMode });
      sendResponse({ regionMode: recordingState.regionMode });
      break;
    default:
      break;
  }
  return true;
});

async function toggleRecording() {
  recordingState.active = !recordingState.active;
  chrome.action.setBadgeText({ text: recordingState.active ? 'REC' : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF4D4D' });
  chrome.runtime.sendMessage({ type: 'recorder:toggled', active: recordingState.active });
}
