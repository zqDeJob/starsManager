async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
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

export const api = {
  saveToken: (token: string) => request<{ ok: boolean }>('/api/github/token', { method: 'POST', body: JSON.stringify({ token }) }),
  clearToken: () => request<{ ok: boolean }>('/api/github/token', { method: 'DELETE' }),
  getUser: () => request<{ login: string; avatar_url: string }>('/api/github/user'),
  sync: () => request<{ starsCount: number; listsCount: number; syncedAt: string }>('/api/github/sync', { method: 'POST' }),
  getSyncStatus: () => request<import('./types').SyncStatus>('/api/github/sync-status'),
  getStars: (q?: string) => request<import('./types').Repo[]>(`/api/github/stars${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getStarLists: () => request<import('./types').StarList[]>('/api/github/star-lists'),

  getCategories: () => request<import('./types').DiyCategory[]>('/api/diy/categories'),
  createCategory: (name: string, color?: string) =>
    request<import('./types').DiyCategory>('/api/diy/categories', { method: 'POST', body: JSON.stringify({ name, color }) }),
  updateCategory: (id: string, data: { name?: string; color?: string }) =>
    request<import('./types').DiyCategory>(`/api/diy/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request<{ ok: boolean }>(`/api/diy/categories/${id}`, { method: 'DELETE' }),
  addRepoToCategory: (categoryId: string, repoNodeId: string) =>
    request<{ ok: boolean }>(`/api/diy/categories/${categoryId}/repos`, { method: 'POST', body: JSON.stringify({ repoNodeId }) }),
  removeRepoFromCategory: (categoryId: string, repoNodeId: string) =>
    request<{ ok: boolean }>(`/api/diy/categories/${categoryId}/repos/${repoNodeId}`, { method: 'DELETE' }),
  getReposWithMeta: (q?: string, categoryId?: string, uncategorized?: boolean) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoryId) params.set('categoryId', categoryId);
    if (uncategorized) params.set('uncategorized', 'true');
    const qs = params.toString();
    return request<import('./types').RepoWithMeta[]>(`/api/diy/repos-with-meta${qs ? `?${qs}` : ''}`);
  },
  updateRepoMeta: (repoNodeId: string, data: { custom_description?: string; tags?: string[] }) =>
    request<{ repoNodeId: string; custom_description: string; tags: string[] }>(
      `/api/diy/repo-meta/${repoNodeId}`,
      { method: 'PUT', body: JSON.stringify(data) },
    ),
  getTags: () => request<string[]>('/api/diy/tags'),
  getDataInfo: () => request<{
    dataDir: string;
    files: { starsData: string; githubCache: string; local: string };
    syncHint: string;
  }>('/api/data/info'),
};
