import type { CachedRepo, CachedStarList } from '@stars-manager/core';
import { buildGitHubListsByRepoNodeId, repoMatchesSearchQuery } from '@stars-manager/core';
import { fetchAllStars, fetchStarLists, verifyToken } from '@stars-manager/shared';
import { githubCache, localSettings, starsData } from './services.js';

export type ApiRequest =
  | { type: 'getUser' }
  | { type: 'saveToken'; token: string }
  | { type: 'clearToken' }
  | { type: 'sync' }
  | { type: 'getSyncStatus' }
  | { type: 'getStars'; q?: string }
  | { type: 'getStarLists' }
  | { type: 'getCategories' }
  | { type: 'createCategory'; name: string; color?: string }
  | { type: 'updateCategory'; id: string; name?: string; color?: string }
  | { type: 'deleteCategory'; id: string }
  | { type: 'addRepoToCategory'; categoryId: string; repoNodeId: string }
  | { type: 'removeRepoFromCategory'; categoryId: string; repoNodeId: string }
  | { type: 'getReposWithMeta'; q?: string; categoryId?: string; uncategorized?: boolean }
  | { type: 'updateRepoMeta'; repoNodeId: string; custom_description?: string; tags?: string[] }
  | { type: 'getTags' }
  | { type: 'getDataInfo' }
  | { type: 'exportStarsData' }
  | { type: 'importStarsData'; content: string };

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return raw.split(',').map(s => s.trim()).filter(Boolean); }
  }
  return [];
}

async function buildReposWithMeta(q?: string, categoryId?: string, uncategorized?: boolean) {
  const categoryMap = await starsData.getCategoryMap();
  const githubListsByRepo = buildGitHubListsByRepoNodeId(await githubCache.listStarLists());
  const diyEntries = await starsData.getAllRepoEntries();
  let repos = await githubCache.listStars();

  if (categoryId) {
    repos = repos.filter(repo => {
      const entry = diyEntries[repo.full_name]
        ?? Object.entries(diyEntries).find(([, e]) => e.nodeId === repo.node_id)?.[1];
      return entry?.categoryIds.includes(categoryId);
    });
  } else if (uncategorized) {
    repos = repos.filter(repo => {
      const entry = diyEntries[repo.full_name]
        ?? Object.entries(diyEntries).find(([, e]) => e.nodeId === repo.node_id)?.[1];
      return !entry || entry.categoryIds.length === 0;
    });
  }

  let result = repos.map(repo => {
    const entry = diyEntries[repo.full_name]
      ?? Object.entries(diyEntries).find(([, e]) => e.nodeId === repo.node_id)?.[1]
      ?? null;
    const diyCategoryNames = (entry?.categoryIds ?? [])
      .map(id => categoryMap.get(id)?.name)
      .filter((n): n is string => Boolean(n));
    return {
      ...repo,
      custom_description: entry?.customDescription ?? '',
      tags: entry?.tags ?? [],
      diy_categories: diyCategoryNames,
      github_lists: githubListsByRepo.get(repo.node_id) ?? [],
    };
  });

  if (q?.trim()) {
    result = result.filter(r => repoMatchesSearchQuery(r, q));
  }

  return result;
}

export async function handleApiRequest(req: ApiRequest): Promise<unknown> {
  switch (req.type) {
    case 'getUser': {
      const token = await localSettings.getSetting('github_token');
      if (!token) throw new Error('未配置 GitHub Token');
      return verifyToken(token);
    }
    case 'saveToken':
      await localSettings.setSetting('github_token', req.token.trim());
      return { ok: true };
    case 'clearToken':
      await localSettings.deleteSetting('github_token');
      return { ok: true };
    case 'sync': {
      const token = await localSettings.getSetting('github_token');
      if (!token) throw new Error('未配置 GitHub Token');
      const now = new Date().toISOString();
      const stars = await fetchAllStars(token);
      const lists = await fetchStarLists(token);
      const cachedStars: CachedRepo[] = stars.map(repo => ({
        id: repo.id,
        node_id: repo.node_id,
        full_name: repo.full_name,
        owner_login: repo.owner.login,
        name: repo.name,
        description: repo.description,
        language: repo.language,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        fork: repo.fork,
        topics: repo.topics ?? [],
        starred_at: repo.starred_at ?? null,
        synced_at: now,
      }));
      const cachedLists: CachedStarList[] = lists.map(list => ({
        id: list.id,
        name: list.name,
        description: list.description,
        is_private: list.isPrivate,
        repo_count: list.repoCount,
        synced_at: now,
        repo_node_ids: list.repos.map(r => r.nodeId),
      }));
      await githubCache.replaceCache(cachedStars, cachedLists, now);
      return { starsCount: stars.length, listsCount: lists.length, syncedAt: now };
    }
    case 'getSyncStatus': {
      const stats = await githubCache.getSyncStats();
      return { hasToken: Boolean(await localSettings.getSetting('github_token')), ...stats };
    }
    case 'getStars': {
      const q = req.q?.trim().toLowerCase();
      let result = await githubCache.listStars();
      if (q) {
        result = result.filter(r =>
          r.full_name.toLowerCase().includes(q) ||
          (r.description ?? '').toLowerCase().includes(q) ||
          (r.language ?? '').toLowerCase().includes(q),
        );
      }
      return result;
    }
    case 'getStarLists': {
      const lists = await githubCache.listStarLists();
      const repoMap = await githubCache.getRepoMap();
      return lists.map(l => ({
        id: l.id,
        name: l.name,
        description: l.description,
        is_private: l.is_private,
        repo_count: l.repo_count,
        isPrivate: l.is_private,
        repos: l.repo_node_ids.map(nodeId => {
          const repo = repoMap.get(nodeId);
          return {
            list_id: l.id,
            repo_node_id: nodeId,
            full_name: repo?.full_name ?? null,
            description: repo?.description ?? null,
            language: repo?.language ?? null,
            html_url: repo?.html_url ?? null,
            stargazers_count: repo?.stargazers_count ?? null,
          };
        }),
      }));
    }
    case 'getCategories':
      return (await starsData.listCategories()).map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        created_at: cat.createdAt,
        repoCount: cat.repoCount,
      }));
    case 'createCategory': {
      if (!req.name?.trim()) throw new Error('分类名称不能为空');
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const cat = await starsData.createCategory(req.name.trim(), req.color ?? '#6366f1', id, now);
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        created_at: cat.createdAt,
        repoCount: 0,
      };
    }
    case 'updateCategory': {
      const updated = await starsData.updateCategory(req.id, {
        name: req.name?.trim(),
        color: req.color,
      });
      if (!updated) throw new Error('分类不存在');
      const count = (await starsData.listCategories()).find(c => c.id === req.id)?.repoCount ?? 0;
      return {
        id: updated.id,
        name: updated.name,
        color: updated.color,
        created_at: updated.createdAt,
        repoCount: count,
      };
    }
    case 'deleteCategory':
      await starsData.deleteCategory(req.id);
      return { ok: true };
    case 'addRepoToCategory': {
      const repo = await githubCache.getRepoByNodeId(req.repoNodeId);
      if (!repo) throw new Error('仓库不存在，请先同步 GitHub Stars');
      await starsData.addRepoToCategory(repo.full_name, req.repoNodeId, req.categoryId);
      return { ok: true };
    }
    case 'removeRepoFromCategory':
      await starsData.removeRepoFromCategoryByNodeId(req.repoNodeId, req.categoryId);
      return { ok: true };
    case 'getReposWithMeta':
      return buildReposWithMeta(req.q, req.categoryId, req.uncategorized);
    case 'updateRepoMeta': {
      const repo = await githubCache.getRepoByNodeId(req.repoNodeId);
      if (!repo) throw new Error('仓库不存在，请先同步 GitHub Stars');
      const entry = await starsData.updateRepoMeta(repo.full_name, req.repoNodeId, {
        customDescription: req.custom_description ?? '',
        tags: parseTags(req.tags),
      });
      return {
        repoNodeId: req.repoNodeId,
        custom_description: entry.customDescription,
        tags: entry.tags,
      };
    }
    case 'getTags':
      return starsData.getAllTags();
    case 'getDataInfo':
      return {
        dataDir: 'chrome.storage.local',
        syncHint: '扩展内数据以 YAML 格式保存在浏览器本地。可通过导出/导入 stars-data.yaml 备份；仓库中的 data/demo-data.yaml 为可提交的示例文件。',
      };
    case 'exportStarsData':
      return starsData.exportYaml();
    case 'importStarsData':
      await starsData.importYaml(req.content);
      return { ok: true };
    default:
      throw new Error('未知请求');
  }
}
