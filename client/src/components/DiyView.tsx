import { useEffect, useMemo, useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../store';
import { RepoCard } from './RepoCard';
import { SearchBar, EmptyState } from './ui/SearchBar';
import { EditRepoModal } from './EditRepoModal';
import { UNCATEGORIZED_ID } from '../types';
import { api } from '../api';

export function DiyView() {
  const {
    categories, starLists, diyRepos, selectedCategoryId, searchQuery,
    loadCategories, loadStarLists, loadDiyRepos, setSelectedCategoryId, setSearchQuery,
    createCategory, deleteCategory, syncStatus,
  } = useAppStore();

  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);

  useEffect(() => {
    loadCategories();
    loadStarLists();
    loadDiyRepos();
  }, [loadCategories, loadStarLists, loadDiyRepos]);

  const githubListsByRepo = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const list of starLists) {
      for (const item of list.repos) {
        if (!item.repo_node_id) continue;
        const names = map.get(item.repo_node_id) ?? [];
        names.push(list.name);
        map.set(item.repo_node_id, names);
      }
    }
    return map;
  }, [starLists]);

  useEffect(() => {
    if (!syncStatus?.hasToken) return;
    api.getReposWithMeta(undefined, undefined, true).then(repos => {
      setUncategorizedCount(repos.length);
    }).catch(() => {});
  }, [syncStatus?.hasToken, syncStatus?.lastSyncedAt, categories]);

  useEffect(() => {
    const timer = setTimeout(() => loadDiyRepos(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadDiyRepos]);

  const emptyMessage = selectedCategoryId === UNCATEGORIZED_ID
    ? '暂无未分类仓库'
    : selectedCategoryId
      ? '此分类暂无仓库'
      : '暂无仓库，请先同步';

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createCategory(newName.trim());
    setNewName('');
    setAdding(false);
  };

  if (!syncStatus?.hasToken) {
    return <EmptyState message="请先配置 Token 并同步" />;
  }

  return (
    <div className="flex gap-4">
      <aside className="w-44 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted">分类</span>
          <button
            onClick={() => setAdding(true)}
            className="p-0.5 rounded text-muted hover:text-accent transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-0.5">
          <CatBtn active={!selectedCategoryId} onClick={() => setSelectedCategoryId(null)}>
            <span className="truncate flex-1 text-left">全部</span>
          </CatBtn>
          <CatBtn
            active={selectedCategoryId === UNCATEGORIZED_ID}
            onClick={() => setSelectedCategoryId(UNCATEGORIZED_ID)}
          >
            <span className="truncate flex-1 text-left">未分类</span>
            <span className="text-muted text-xs shrink-0 tabular-nums">{uncategorizedCount}</span>
          </CatBtn>
          {categories.map(cat => (
            <div key={cat.id} className="group relative">
              <CatBtn
                active={selectedCategoryId === cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                <span className="truncate flex-1 text-left pr-5">{cat.name}</span>
                <span className="text-muted text-xs shrink-0 tabular-nums">{cat.repoCount}</span>
              </CatBtn>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {adding && (
          <div className="mt-3 p-2.5 rounded-md border border-border bg-surface space-y-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="名称"
              className="w-full px-2 py-1 rounded-md bg-bg border border-border text-xs focus:outline-none focus:ring-1 focus:ring-accent/30"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="flex-1 py-1 rounded-md bg-accent text-white text-xs">确定</button>
              <button onClick={() => setAdding(false)} className="flex-1 py-1 rounded-md border border-border text-xs text-muted hover:bg-surface-2">取消</button>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 min-w-0 space-y-3">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="搜索仓库、描述、标签、GitHub Lists..." />
        <div className="rounded-lg border border-border bg-surface divide-y divide-border">
          {diyRepos.length === 0 ? (
            <p className="text-center text-muted text-sm py-12">{emptyMessage}</p>
          ) : (
            diyRepos.map(repo => (
              <DiyRepoRow
                key={repo.node_id}
                repo={repo}
                githubLists={githubListsByRepo.get(repo.node_id) ?? []}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CatBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-start gap-1.5 px-2 py-1.5 rounded-md text-xs text-left transition-colors ${
        active ? 'bg-tag text-accent font-medium' : 'text-muted hover:bg-surface-2 hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}

function DiyRepoRow({
  repo,
  githubLists,
}: {
  repo: import('../types').RepoWithMeta;
  githubLists: string[];
}) {
  const { categories, addRepoToCategory, removeRepoFromCategory, updateRepoMeta } = useAppStore();
  const [editing, setEditing] = useState(false);

  const handleSave = async (data: { desc: string; tags: string[]; categoryIds: string[] }) => {
    await updateRepoMeta(repo.node_id, { custom_description: data.desc, tags: data.tags });

    const currentIds = categories.filter(c => repo.diy_categories.includes(c.name)).map(c => c.id);
    await Promise.all([
      ...data.categoryIds.filter(id => !currentIds.includes(id)).map(id => addRepoToCategory(id, repo.node_id)),
      ...currentIds.filter(id => !data.categoryIds.includes(id)).map(id => removeRepoFromCategory(id, repo.node_id)),
    ]);
  };

  return (
    <>
      <RepoCard
        repo={repo}
        showMeta
        githubLists={githubLists}
        actions={
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded-md hover:bg-surface-2 text-muted"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        }
      />

      {editing && (
        <EditRepoModal
          repo={repo}
          categories={categories}
          onClose={() => setEditing(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
