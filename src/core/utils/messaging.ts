type RuntimeLike = typeof chrome | undefined;

const getRuntime = (): chrome.runtime.Runtime | undefined => {
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
      if (err.message?.includes('Receiving end does not exist')) return;
      console.warn('[messaging]', err.message);
    });
  } catch (error) {
    console.warn('[messaging/sendMessage]', error);
  }
};
