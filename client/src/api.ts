import type { DiyCategory, Repo, RepoWithMeta, StarList, SyncStatus } from './types';

export interface StarsApi {
  saveToken(token: string): Promise<{ ok: boolean }>;
  clearToken(): Promise<{ ok: boolean }>;
  getUser(): Promise<{ login: string; avatar_url: string }>;
  sync(): Promise<{ starsCount: number; listsCount: number; syncedAt: string }>;
  getSyncStatus(): Promise<SyncStatus>;
  getStars(q?: string): Promise<Repo[]>;
  getStarLists(): Promise<StarList[]>;
  getCategories(): Promise<DiyCategory[]>;
  createCategory(name: string, color?: string): Promise<DiyCategory>;
  updateCategory(id: string, data: { name?: string; color?: string }): Promise<DiyCategory>;
  deleteCategory(id: string): Promise<{ ok: boolean }>;
  addRepoToCategory(categoryId: string, repoNodeId: string): Promise<{ ok: boolean }>;
  removeRepoFromCategory(categoryId: string, repoNodeId: string): Promise<{ ok: boolean }>;
  getReposWithMeta(q?: string, categoryId?: string, uncategorized?: boolean): Promise<RepoWithMeta[]>;
  updateRepoMeta(
    repoNodeId: string,
    data: { custom_description?: string; tags?: string[] },
  ): Promise<{ repoNodeId: string; custom_description: string; tags: string[] }>;
  getTags(): Promise<string[]>;
  getDataInfo(): Promise<{
    dataDir: string;
    files?: { starsData: string; githubCache: string; local: string };
    syncHint: string;
  }>;
  exportStarsData?(): Promise<string>;
  importStarsData?(content: string): Promise<{ ok: boolean }>;
}

let client: StarsApi = createHttpApi();

export function setApiClient(api: StarsApi): void {
  client = api;
}

export function getApiClient(): StarsApi {
  return client;
}

export function createHttpApi(baseUrl = ''): StarsApi {
  async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${url}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `请求失败: ${res.status}`);
    return data as T;
  }

  return {
    saveToken: token => request('/api/github/token', { method: 'POST', body: JSON.stringify({ token }) }),
    clearToken: () => request('/api/github/token', { method: 'DELETE' }),
    getUser: () => request('/api/github/user'),
    sync: () => request('/api/github/sync', { method: 'POST' }),
    getSyncStatus: () => request('/api/github/sync-status'),
    getStars: q => request(`/api/github/stars${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    getStarLists: () => request('/api/github/star-lists'),
    getCategories: () => request('/api/diy/categories'),
    createCategory: (name, color) =>
      request('/api/diy/categories', { method: 'POST', body: JSON.stringify({ name, color }) }),
    updateCategory: (id, data) =>
      request(`/api/diy/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteCategory: id => request(`/api/diy/categories/${id}`, { method: 'DELETE' }),
    addRepoToCategory: (categoryId, repoNodeId) =>
      request(`/api/diy/categories/${categoryId}/repos`, {
        method: 'POST',
        body: JSON.stringify({ repoNodeId }),
      }),
    removeRepoFromCategory: (categoryId, repoNodeId) =>
      request(`/api/diy/categories/${categoryId}/repos/${repoNodeId}`, { method: 'DELETE' }),
    getReposWithMeta: (q, categoryId, uncategorized) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (categoryId) params.set('categoryId', categoryId);
      if (uncategorized) params.set('uncategorized', 'true');
      const qs = params.toString();
      return request(`/api/diy/repos-with-meta${qs ? `?${qs}` : ''}`);
    },
    updateRepoMeta: (repoNodeId, data) =>
      request(`/api/diy/repo-meta/${repoNodeId}`, { method: 'PUT', body: JSON.stringify(data) }),
    getTags: () => request('/api/diy/tags'),
    getDataInfo: () => request('/api/data/info'),
  };
}

export const api: StarsApi = {
  saveToken: (...args) => client.saveToken(...args),
  clearToken: (...args) => client.clearToken(...args),
  getUser: (...args) => client.getUser(...args),
  sync: (...args) => client.sync(...args),
  getSyncStatus: (...args) => client.getSyncStatus(...args),
  getStars: (...args) => client.getStars(...args),
  getStarLists: (...args) => client.getStarLists(...args),
  getCategories: (...args) => client.getCategories(...args),
  createCategory: (...args) => client.createCategory(...args),
  updateCategory: (...args) => client.updateCategory(...args),
  deleteCategory: (...args) => client.deleteCategory(...args),
  addRepoToCategory: (...args) => client.addRepoToCategory(...args),
  removeRepoFromCategory: (...args) => client.removeRepoFromCategory(...args),
  getReposWithMeta: (...args) => client.getReposWithMeta(...args),
  updateRepoMeta: (...args) => client.updateRepoMeta(...args),
  getTags: (...args) => client.getTags(...args),
  getDataInfo: (...args) => client.getDataInfo(...args),
  exportStarsData: () => {
    if (!client.exportStarsData) throw new Error('当前环境不支持导出');
    return client.exportStarsData();
  },
  importStarsData: content => {
    if (!client.importStarsData) throw new Error('当前环境不支持导入');
    return client.importStarsData(content);
  },
};

export function isExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);
}
