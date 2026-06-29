import type { ApiRequest } from '../background/handlers';

export async function apiRequest<T>(req: ApiRequest): Promise<T> {
  const res = await chrome.runtime.sendMessage(req) as { ok: boolean; data?: T; error?: string } | undefined;
  const lastError = chrome.runtime.lastError;
  if (lastError) throw new Error(lastError.message);
  if (!res) throw new Error('扩展后台未响应，请在 chrome://extensions 重新加载扩展后重试');
  if (!res.ok) throw new Error(res.error ?? '请求失败');
  return res.data as T;
}
