import type { CachedStarList } from '@stars-manager/shared';

export function buildGitHubListsByRepoNodeId(starLists: CachedStarList[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const list of starLists) {
    for (const nodeId of list.repo_node_ids) {
      const names = map.get(nodeId) ?? [];
      names.push(list.name);
      map.set(nodeId, names);
    }
  }
  return map;
}

export interface RepoSearchFields {
  full_name: string;
  description: string | null;
  custom_description: string;
  tags: string[];
  github_lists?: string[];
}

export function repoMatchesSearchQuery(repo: RepoSearchFields, q: string): boolean {
  const query = q.trim().toLowerCase();
  if (!query) return true;

  return (
    repo.full_name.toLowerCase().includes(query) ||
    (repo.description ?? '').toLowerCase().includes(query) ||
    repo.custom_description.toLowerCase().includes(query) ||
    repo.tags.some(t => t.toLowerCase().includes(query)) ||
    (repo.github_lists ?? []).some(name => name.toLowerCase().includes(query))
  );
}
