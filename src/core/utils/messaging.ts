type RuntimeLike = typeof chrome | undefined;
type RuntimeAPI = typeof chrome.runtime | undefined;

const getRuntime = (): RuntimeAPI => {
  const runtimeLike: RuntimeLike =
    typeof chrome !== 'undefined' && chrome?.runtime ? chrome : undefined;
  return runtimeLike?.runtime;
};

export const safeSendMessage = (message: any): void => {
  const runtime = getRuntime();
  if (!runtime?.sendMessage) return;
  try {
    runtime.sendMessage(message, () => {
      const err = runtime.lastError;
      if (!err) return;
      const messageText = err.message ?? '';
      const ignored = [
        'Receiving end does not exist',
        'The message port closed before a response was received.'
      ];
      if (ignored.some((snippet) => messageText.includes(snippet))) return;
      console.warn('[messaging]', err.message);
    });
  } catch (error) {
    console.warn('[messaging/sendMessage]', error);
  }
};
