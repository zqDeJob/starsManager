import { Router } from 'express';
import { randomUUID } from 'crypto';
import * as starsData from '../storage/stars-data.js';
import * as cache from '../storage/github-cache.js';

export const diyRouter = Router();

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return raw.split(',').map(s => s.trim()).filter(Boolean); }
  }
  return [];
}

function toApiCategory(cat: { id: string; name: string; color: string; createdAt: string; repoCount: number }) {
  return {
    id: cat.id,
    name: cat.name,
    color: cat.color,
    created_at: cat.createdAt,
    repoCount: cat.repoCount,
  };
}

function buildRepoWithMeta(
  repo: ReturnType<typeof cache.listStars>[0],
  diyEntry: { customDescription: string; tags: string[]; categoryIds: string[] } | null,
  categoryMap: Map<string, { name: string }>,
) {
  const diyCategoryNames = (diyEntry?.categoryIds ?? [])
    .map(id => categoryMap.get(id)?.name)
    .filter((n): n is string => Boolean(n));

  return {
    ...repo,
    custom_description: diyEntry?.customDescription ?? '',
    tags: diyEntry?.tags ?? [],
    diy_categories: diyCategoryNames,
  };
}

diyRouter.get('/categories', (_req, res) => {
  res.json(starsData.listCategories().map(toApiCategory));
});

diyRouter.post('/categories', (req, res) => {
  const { name, color } = req.body as { name?: string; color?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: '分类名称不能为空' });
    return;
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const cat = starsData.createCategory(name.trim(), color ?? '#6366f1', id, now);
  res.status(201).json(toApiCategory({ ...cat, repoCount: 0 }));
});

diyRouter.patch('/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body as { name?: string; color?: string };

  const updated = starsData.updateCategory(id, { name: name?.trim(), color });
  if (!updated) {
    res.status(404).json({ error: '分类不存在' });
    return;
  }

  const count = starsData.listCategories().find(c => c.id === id)?.repoCount ?? 0;
  res.json(toApiCategory({ ...updated, repoCount: count }));
});

diyRouter.delete('/categories/:id', (req, res) => {
  starsData.deleteCategory(req.params.id);
  res.json({ ok: true });
});

diyRouter.get('/categories/:id/repos', (req, res) => {
  const { id } = req.params;
  const categoryMap = starsData.getCategoryMap();
  const allRepos = cache.listStars();
  const diyEntries = starsData.getAllRepoEntries();

  const result = allRepos
    .filter(repo => {
      const entry = Object.values(diyEntries).find(e => e.nodeId === repo.node_id)
        ?? diyEntries[repo.full_name];
      return entry?.categoryIds.includes(id);
    })
    .map(repo => {
      const entry = diyEntries[repo.full_name]
        ?? Object.entries(diyEntries).find(([, e]) => e.nodeId === repo.node_id)?.[1]
        ?? null;
      return buildRepoWithMeta(repo, entry, categoryMap);
    });

  res.json(result);
});

diyRouter.post('/categories/:id/repos', (req, res) => {
  const { id } = req.params;
  const { repoNodeId } = req.body as { repoNodeId?: string };

  if (!repoNodeId) {
    res.status(400).json({ error: 'repoNodeId 不能为空' });
    return;
  }

  const repo = cache.getRepoByNodeId(repoNodeId);
  if (!repo) {
    res.status(404).json({ error: '仓库不存在，请先同步 GitHub Stars' });
    return;
  }

  try {
    starsData.addRepoToCategory(repo.full_name, repoNodeId, id);
    res.json({ ok: true });
  } catch (e) {
    res.status(404).json({ error: (e as Error).message });
  }
});

diyRouter.delete('/categories/:categoryId/repos/:repoNodeId', (req, res) => {
  const { categoryId, repoNodeId } = req.params;
  starsData.removeRepoFromCategoryByNodeId(repoNodeId, categoryId);
  res.json({ ok: true });
});

diyRouter.get('/repo-meta/:repoNodeId', (req, res) => {
  const found = starsData.findRepoByNodeId(req.params.repoNodeId);
  if (!found) {
    res.json({ repoNodeId: req.params.repoNodeId, custom_description: '', tags: [] });
    return;
  }

  res.json({
    repoNodeId: req.params.repoNodeId,
    custom_description: found.entry.customDescription,
    tags: found.entry.tags,
    updated_at: found.entry.updatedAt,
  });
});

diyRouter.put('/repo-meta/:repoNodeId', (req, res) => {
  const { repoNodeId } = req.params;
  const { custom_description, tags } = req.body as { custom_description?: string; tags?: string[] };

  const repo = cache.getRepoByNodeId(repoNodeId);
  if (!repo) {
    res.status(404).json({ error: '仓库不存在，请先同步 GitHub Stars' });
    return;
  }

  const tagList = parseTags(tags);
  const entry = starsData.updateRepoMeta(repo.full_name, repoNodeId, {
    customDescription: custom_description ?? '',
    tags: tagList,
  });

  res.json({
    repoNodeId,
    custom_description: entry.customDescription,
    tags: entry.tags,
    updated_at: entry.updatedAt,
  });
});

diyRouter.get('/repos-with-meta', (req, res) => {
  const q = (req.query.q as string)?.trim().toLowerCase();
  const categoryId = req.query.categoryId as string | undefined;
  const categoryMap = starsData.getCategoryMap();
  const diyEntries = starsData.getAllRepoEntries();
  let repos = cache.listStars();

  if (categoryId) {
    repos = repos.filter(repo => {
      const entry = diyEntries[repo.full_name]
        ?? Object.entries(diyEntries).find(([, e]) => e.nodeId === repo.node_id)?.[1];
      return entry?.categoryIds.includes(categoryId);
    });
  } else if (req.query.uncategorized === 'true') {
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
    return buildRepoWithMeta(repo, entry, categoryMap);
  });

  if (q) {
    result = result.filter(r =>
      r.full_name.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q) ||
      r.custom_description.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  res.json(result);
});

diyRouter.get('/tags', (_req, res) => {
  res.json(starsData.getAllTags());
});
