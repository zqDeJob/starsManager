import { createHttpApi } from '@app/api';

export function createLocalServerApi(): ReturnType<typeof createHttpApi> {
  return createHttpApi('http://127.0.0.1:3001');
}

export async function requestLocalServerPermission(): Promise<boolean> {
  return chrome.permissions.request({ origins: ['http://127.0.0.1:3001/*'] });
}

export async function getUseLocalServer(): Promise<boolean> {
  const result = await chrome.storage.local.get('useLocalServer');
  return Boolean(result.useLocalServer);
}

export async function setUseLocalServer(value: boolean): Promise<void> {
  await chrome.storage.local.set({ useLocalServer: value });
}
