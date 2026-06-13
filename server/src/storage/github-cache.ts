import { readYamlFile, writeYamlFile } from './io.js';

export interface CachedRepo {
  id: number;
  node_id: string;
  full_name: string;
  owner_login: string;
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stargazers_count: number;
  fork: boolean;
  topics: string[];
  starred_at: string | null;
  synced_at: string;
}

export interface CachedStarList {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  repo_count: number;
  synced_at: string;
  repo_node_ids: string[];
}

export interface GitHubCacheFile {
  version: 1;
  syncedAt: string | null;
  stars: CachedRepo[];
  starLists: CachedStarList[];
}

function emptyCache(): GitHubCacheFile {
  return { version: 1, syncedAt: null, stars: [], starLists: [] };
}

const FILE = 'github-cache.yaml';

function load(): GitHubCacheFile {
  return readYamlFile(FILE, emptyCache());
}

function save(data: GitHubCacheFile): void {
  writeYamlFile(FILE, data);
}

export function getRepoByNodeId(nodeId: string): CachedRepo | null {
  return load().stars.find(r => r.node_id === nodeId) ?? null;
}

export function getRepoMap(): Map<string, CachedRepo> {
  const map = new Map<string, CachedRepo>();
  for (const repo of load().stars) {
    map.set(repo.node_id, repo);
  }
  return map;
}

export function listStars(): CachedRepo[] {
  return load().stars.slice().sort((a, b) => {
    if (!a.starred_at && !b.starred_at) return a.full_name.localeCompare(b.full_name);
    if (!a.starred_at) return 1;
    if (!b.starred_at) return -1;
    return b.starred_at.localeCompare(a.starred_at);
  });
}

export function listStarLists(): CachedStarList[] {
  return load().starLists.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function getSyncStats(): { starsCount: number; listsCount: number; lastSyncedAt: string | null } {
  const data = load();
  return {
    starsCount: data.stars.length,
    listsCount: data.starLists.length,
    lastSyncedAt: data.syncedAt,
  };
}

export function replaceCache(
  stars: CachedRepo[],
  starLists: CachedStarList[],
  syncedAt: string,
): void {
  save({ version: 1, syncedAt, stars, starLists });
}
