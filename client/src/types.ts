export interface Repo {
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

export interface StarList {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  repo_count: number;
  repos: {
    list_id: string;
    repo_node_id: string;
    full_name: string | null;
    description: string | null;
    language: string | null;
    html_url: string | null;
    stargazers_count: number | null;
  }[];
}

export interface DiyCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
  repoCount: number;
}

export interface RepoWithMeta extends Repo {
  custom_description: string;
  tags: string[];
  diy_categories: string[];
}

export interface SyncStatus {
  hasToken: boolean;
  starsCount: number;
  listsCount: number;
  lastSyncedAt: string | null;
}

export const UNCATEGORIZED_ID = 'uncategorized';

export type Tab = 'github-stars' | 'github-lists' | 'diy';
