import {
  GITHUB_CACHE_FILE,
  emptyGitHubCache,
  type CachedRepo,
  type CachedStarList,
  type GitHubCacheFile,
} from '@stars-manager/shared';
import type { YamlStore } from './yaml-store.js';

export function createGitHubCacheService(store: YamlStore) {
  async function load(): Promise<GitHubCacheFile> {
    return store.read(GITHUB_CACHE_FILE, emptyGitHubCache());
  }

  async function save(data: GitHubCacheFile): Promise<void> {
    await store.write(GITHUB_CACHE_FILE, data);
  }

  return {
    async getRepoByNodeId(nodeId: string): Promise<CachedRepo | null> {
      return (await load()).stars.find(r => r.node_id === nodeId) ?? null;
    },

    async getRepoMap(): Promise<Map<string, CachedRepo>> {
      const map = new Map<string, CachedRepo>();
      for (const repo of (await load()).stars) {
        map.set(repo.node_id, repo);
      }
      return map;
    },

    async listStars(): Promise<CachedRepo[]> {
      return (await load()).stars.slice().sort((a, b) => {
        if (!a.starred_at && !b.starred_at) return a.full_name.localeCompare(b.full_name);
        if (!a.starred_at) return 1;
        if (!b.starred_at) return -1;
        return b.starred_at.localeCompare(a.starred_at);
      });
    },

    async listStarLists(): Promise<CachedStarList[]> {
      return (await load()).starLists.slice().sort((a, b) => a.name.localeCompare(b.name));
    },

    async getSyncStats(): Promise<{ starsCount: number; listsCount: number; lastSyncedAt: string | null }> {
      const data = await load();
      return {
        starsCount: data.stars.length,
        listsCount: data.starLists.length,
        lastSyncedAt: data.syncedAt,
      };
    },

    async replaceCache(stars: CachedRepo[], starLists: CachedStarList[], syncedAt: string): Promise<void> {
      await save({ version: 1, syncedAt, stars, starLists });
    },

    getCacheFilePath(): string | undefined {
      return store.resolvePath?.(GITHUB_CACHE_FILE);
    },
  };
}

export type GitHubCacheService = ReturnType<typeof createGitHubCacheService>;

export type { CachedRepo, CachedStarList };
