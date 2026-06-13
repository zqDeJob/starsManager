import { handleApiRequest, type ApiRequest } from './handlers.js';

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
});

chrome.action.onClicked.addListener(() => {
  const url = chrome.runtime.getURL('src/app/index.html');
  void chrome.tabs.create({ url });
});

chrome.runtime.onMessage.addListener((message: ApiRequest, _sender, sendResponse) => {
  handleApiRequest(message)
    .then(data => sendResponse({ ok: true, data }))
    .catch(err => sendResponse({ ok: false, error: (err as Error).message }));
  return true;
});
