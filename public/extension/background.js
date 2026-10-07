// Background service worker — keeps extension alive, no-op for now.
chrome.runtime.onInstalled.addListener(() => {
  console.log('Hush extension installed.');
});
