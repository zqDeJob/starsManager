import { ExternalLink, Star } from 'lucide-react';
import type { Repo, RepoWithMeta } from '../types';

const langColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
};

interface RepoCardProps {
  repo: Repo | RepoWithMeta;
  actions?: React.ReactNode;
  showMeta?: boolean;
  githubLists?: string[];
}

export function RepoCard({ repo, actions, showMeta, githubLists }: RepoCardProps) {
  const meta = showMeta ? (repo as RepoWithMeta) : null;

  return (
    <article className="group flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-surface-2 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm text-text hover:text-accent truncate"
          >
            {repo.full_name}
          </a>
          <ExternalLink className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
        </div>

        {showMeta ? (
          <div className="mt-0.5 space-y-0.5">
            {repo.description && (
              <p className="text-xs text-muted line-clamp-2 leading-relaxed">{repo.description}</p>
            )}
            {meta?.custom_description && (
              <p className="text-xs text-text line-clamp-2 leading-relaxed">{meta.custom_description}</p>
            )}
          </div>
        ) : (
          repo.description && (
            <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">{repo.description}</p>
          )
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted">
          {repo.language && (
            <span className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: langColors[repo.language] ?? '#a1a1aa' }}
              />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Star className="w-3 h-3" />
            {repo.stargazers_count.toLocaleString()}
          </span>
          {meta?.tags?.map((t: string) => (
            <span key={t} className="px-1.5 py-px rounded bg-tag text-tag-text">{t}</span>
          ))}
          {meta?.diy_categories?.map((c: string) => (
            <span key={c} className="px-1.5 py-px rounded border border-border">{c}</span>
          ))}
          {githubLists?.map(name => (
            <span key={name} className="px-1.5 py-px rounded bg-surface-2 border border-dashed border-border text-muted">
              {name}
            </span>
          ))}
        </div>
      </div>
      {actions && <div className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">{actions}</div>}
    </article>
  );
}
