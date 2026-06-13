export interface DiyCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface DiyRepoEntry {
  nodeId: string;
  customDescription: string;
  tags: string[];
  categoryIds: string[];
  updatedAt: string;
}

export interface StarsDataFile {
  version: 1;
  updatedAt: string;
  categories: DiyCategory[];
  repos: Record<string, DiyRepoEntry>;
}

export function emptyStarsData(): StarsDataFile {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    categories: [],
    repos: {},
  };
}

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

export function emptyGitHubCache(): GitHubCacheFile {
  return { version: 1, syncedAt: null, stars: [], starLists: [] };
}

export interface LocalFile {
  githubToken?: string;
}
