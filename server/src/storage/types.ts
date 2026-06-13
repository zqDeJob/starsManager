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
