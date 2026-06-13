const GITHUB_API = 'https://api.github.com';
const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

export interface GitHubRepo {
  id: number;
  node_id: string;
  full_name: string;
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stargazers_count: number;
  fork: boolean;
  topics?: string[];
  owner: { login: string };
  starred_at?: string;
}

export interface StarList {
  id: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  repoCount: number;
  repos: { nodeId: string; fullName: string }[];
}

async function githubFetch(url: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...init?.headers,
    },
  });
}

export async function fetchAllStars(token: string): Promise<GitHubRepo[]> {
  const stars: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const res = await githubFetch(
      `${GITHUB_API}/user/starred?per_page=100&page=${page}&sort=updated`,
      token
    );

    if (res.status === 401) throw new Error('GitHub Token 无效或已过期');
    if (res.status === 403) {
      const remaining = res.headers.get('X-RateLimit-Remaining');
      throw new Error(`GitHub API 速率限制，剩余: ${remaining ?? '0'}`);
    }
    if (!res.ok) throw new Error(`拉取 Stars 失败: ${res.status} ${await res.text()}`);

    const batch = (await res.json()) as GitHubRepo[];
    if (batch.length === 0) break;
    stars.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  return stars;
}

const STAR_LISTS_QUERY = `
  query($cursor: String) {
    viewer {
      lists(first: 50, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          name
          description
          isPrivate
          items(first: 100) {
            totalCount
            pageInfo { hasNextPage endCursor }
            nodes {
              ... on Repository {
                id
                nameWithOwner
              }
            }
          }
        }
      }
    }
  }
`;

const LIST_ITEMS_QUERY = `
  query($listId: ID!, $cursor: String) {
    node(id: $listId) {
      ... on UserList {
        items(first: 100, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            ... on Repository {
              id
              nameWithOwner
            }
          }
        }
      }
    }
  }
`;

async function graphqlRequest<T>(token: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(GITHUB_GRAPHQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`GraphQL 请求失败: ${res.status}`);
  const json = await res.json() as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join('; '));
  return json.data as T;
}

async function fetchListItems(token: string, listId: string): Promise<{ nodeId: string; fullName: string }[]> {
  const repos: { nodeId: string; fullName: string }[] = [];
  let cursor: string | null = null;

  type ListItemsData = {
    node: {
      items: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: { id: string; nameWithOwner: string }[];
      };
    } | null;
  };

  while (true) {
    const data: ListItemsData = await graphqlRequest<ListItemsData>(token, LIST_ITEMS_QUERY, { listId, cursor });

    const items = data.node?.items;
    if (!items) break;

    for (const node of items.nodes) {
      repos.push({ nodeId: node.id, fullName: node.nameWithOwner });
    }

    if (!items.pageInfo.hasNextPage) break;
    cursor = items.pageInfo.endCursor;
  }

  return repos;
}

type StarListsData = {
  viewer: {
    lists: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: {
        id: string;
        name: string;
        description: string | null;
        isPrivate: boolean;
        items: { totalCount: number; nodes: { id: string; nameWithOwner: string }[] };
      }[];
    };
  };
};

export async function fetchStarLists(token: string): Promise<StarList[]> {
  const lists: StarList[] = [];
  let cursor: string | null = null;

  while (true) {
    const data: StarListsData = await graphqlRequest<StarListsData>(token, STAR_LISTS_QUERY, { cursor });

    for (const node of data.viewer.lists.nodes) {
      let repos = node.items.nodes.map((n: { id: string; nameWithOwner: string }) => ({
        nodeId: n.id,
        fullName: n.nameWithOwner,
      }));

      if (node.items.totalCount > repos.length) {
        repos = await fetchListItems(token, node.id);
      }

      lists.push({
        id: node.id,
        name: node.name,
        description: node.description,
        isPrivate: node.isPrivate,
        repoCount: node.items.totalCount,
        repos,
      });
    }

    if (!data.viewer.lists.pageInfo.hasNextPage) break;
    cursor = data.viewer.lists.pageInfo.endCursor;
  }

  return lists;
}

export async function verifyToken(token: string): Promise<{ login: string; avatar_url: string }> {
  const res = await githubFetch(`${GITHUB_API}/user`, token);
  if (!res.ok) throw new Error('Token 验证失败');
  const user = await res.json() as { login: string; avatar_url: string };
  return user;
}
