import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { useAppStore } from '../store';
import { EmptyState } from './ui/SearchBar';

export function GitHubListsView() {
  const { starLists, loadStarLists, syncStatus } = useAppStore();

  useEffect(() => { loadStarLists(); }, [loadStarLists]);

  if (!syncStatus?.hasToken) {
    return <EmptyState message="配置 Token 后点击同步" />;
  }
  if (syncStatus.listsCount === 0) {
    return <EmptyState message="暂无 Star Lists" />;
  }

  return (
    <div className="rounded-lg border border-border bg-surface divide-y divide-border">
      {starLists.map(list => (
        <StarListRow key={list.id} list={list} />
      ))}
    </div>
  );
}

function StarListRow({ list }: { list: import('../types').StarList }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-surface-2 transition-colors"
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-muted shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted shrink-0" />}
        <span className="text-sm font-medium flex-1 truncate">{list.name}</span>
        {list.isPrivate && <Lock className="w-3 h-3 text-muted" />}
        <span className="text-xs text-muted">{list.repo_count}</span>
      </button>

      {open && list.repos.length > 0 && (
        <div className="px-4 pb-3 pl-10 space-y-1">
          {list.repos.map(repo => (
            <div key={repo.repo_node_id} className="flex items-center justify-between text-xs py-1">
              {repo.full_name ? (
                <a
                  href={repo.html_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline truncate"
                >
                  {repo.full_name}
                </a>
              ) : (
                <span className="text-muted truncate">{repo.repo_node_id}</span>
              )}
              {repo.language && <span className="text-muted ml-2 shrink-0">{repo.language}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
