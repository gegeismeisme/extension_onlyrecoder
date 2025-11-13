// Placeholder offscreen entry: responsible for region overlay + encoding tasks.
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'region:toggle') {
    console.info('[offscreen] region mode', message.enabled);
  }
});
