// firefox/background.ts
browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({ enabled: true });
});
