import type { ApiRequest } from '../background/handlers';

export async function apiRequest<T>(req: ApiRequest): Promise<T> {
  const res = await chrome.runtime.sendMessage(req) as { ok: boolean; data?: T; error?: string };
  if (!res.ok) throw new Error(res.error ?? '请求失败');
  return res.data as T;
}
