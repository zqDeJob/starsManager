import { useEffect } from 'react';
import { useAppStore } from '../store';
import { RepoCard } from './RepoCard';
import { SearchBar, EmptyState } from './ui/SearchBar';

export function GitHubStarsView() {
  const { stars, searchQuery, setSearchQuery, loadStars, syncStatus } = useAppStore();

  useEffect(() => { loadStars(); }, [loadStars]);

  useEffect(() => {
    const timer = setTimeout(() => loadStars(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadStars]);

  if (!syncStatus?.hasToken) {
    return <EmptyState message="配置 Token 后点击同步" />;
  }
  if (syncStatus.starsCount === 0) {
    return <EmptyState message="点击右上角同步按钮拉取 Stars" />;
  }

  return (
    <div className="space-y-3">
      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="搜索仓库..." />
      <div className="rounded-lg border border-border bg-surface divide-y divide-border">
        {stars.length === 0 ? (
          <p className="text-center text-muted text-sm py-12">没有匹配结果</p>
        ) : (
          stars.map(repo => <RepoCard key={repo.node_id} repo={repo} />)
        )}
      </div>
    </div>
  );
}
