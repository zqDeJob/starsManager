import { Router } from 'express';
import { localSettings, githubCache } from '../services.js';
import { fetchAllStars, fetchStarLists, verifyToken } from '@stars-manager/shared';
import type { CachedRepo, CachedStarList } from '@stars-manager/core';

export const githubRouter = Router();

async function requireToken(req: { headers: { authorization?: string } }): Promise<string> {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const stored = await localSettings.getSetting('github_token');
  if (stored) return stored;
  throw new Error('未配置 GitHub Token');
}

githubRouter.get('/user', async (req, res) => {
  try {
    const token = await requireToken(req);
    const user = await verifyToken(token);
    res.json(user);
  } catch (e) {
    res.status(401).json({ error: (e as Error).message });
  }
});

githubRouter.post('/token', async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token?.trim()) {
    res.status(400).json({ error: 'Token 不能为空' });
    return;
  }
  await localSettings.setSetting('github_token', token.trim());
  res.json({ ok: true });
});

githubRouter.delete('/token', async (_req, res) => {
  await localSettings.deleteSetting('github_token');
  res.json({ ok: true });
});

githubRouter.post('/sync', async (req, res) => {
  try {
    const token = await requireToken(req);
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

    res.json({
      starsCount: stars.length,
      listsCount: lists.length,
      syncedAt: now,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

githubRouter.get('/stars', async (req, res) => {
  const q = (req.query.q as string)?.trim().toLowerCase();
  let result = await githubCache.listStars();

  if (q) {
    result = result.filter(r =>
      r.full_name.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q) ||
      (r.language ?? '').toLowerCase().includes(q),
    );
  }

  res.json(result);
});

githubRouter.get('/star-lists', async (_req, res) => {
  const lists = await githubCache.listStarLists();
  const repoMap = await githubCache.getRepoMap();

  res.json(lists.map(l => ({
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
  })));
});

githubRouter.get('/sync-status', async (_req, res) => {
  const stats = await githubCache.getSyncStats();
  res.json({
    hasToken: Boolean(await localSettings.getSetting('github_token')),
    ...stats,
  });
});
