import { useEffect, useState } from 'react';
import { Check, Search, Tag, X } from 'lucide-react';
import type { DiyCategory, RepoWithMeta } from '../types';

interface EditRepoModalProps {
  repo: RepoWithMeta;
  categories: DiyCategory[];
  onClose: () => void;
  onSave: (data: { desc: string; tags: string[]; categoryIds: string[] }) => Promise<void>;
}

export function EditRepoModal({ repo, categories, onClose, onSave }: EditRepoModalProps) {
  const [desc, setDesc] = useState(repo.custom_description);
  const [tagInput, setTagInput] = useState(repo.tags.join(', '));
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>(() =>
    categories.filter(c => repo.diy_categories.includes(c.name)).map(c => c.id),
  );
  const [catQuery, setCatQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => setOpen(true));
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const filteredCats = categories.filter(c =>
    c.name.toLowerCase().includes(catQuery.trim().toLowerCase()),
  );

  const toggleCat = (id: string) => {
    setSelectedCatIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id],
    );
  };

  const handleClose = () => {
    setOpen(false);
    window.setTimeout(onClose, 200);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = tagInput.split(/[,，]/).map(t => t.trim()).filter(Boolean);
      await onSave({ desc, tags, categoryIds: selectedCatIds });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end bg-black/40 transition-opacity duration-200 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <aside
        className={`h-full w-full max-w-md bg-surface border-l border-border shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="font-semibold text-sm truncate">{repo.full_name}</h2>
            <p className="text-xs text-muted mt-0.5">编辑仓库</p>
          </div>
          <button onClick={handleClose} className="p-1 rounded-md hover:bg-surface-2 text-muted shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col px-5 py-4 gap-4 overflow-hidden">
          {repo.description && (
            <section className="shrink-0">
              <label className="text-xs text-muted mb-1 block">仓库描述</label>
              <p className="text-xs text-muted px-3 py-2 rounded-md bg-bg border border-border leading-relaxed line-clamp-3">
                {repo.description}
              </p>
            </section>
          )}

          <section className="shrink-0">
            <label className="text-xs text-muted mb-1 block">我的笔记</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={3}
              placeholder="在此添加你的笔记..."
              className="w-full px-3 py-2 rounded-md bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
          </section>

          <section className="shrink-0">
            <label className="text-xs text-muted mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3" /> 标签
            </label>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="逗号分隔，如：工具, 前端"
              className="w-full px-3 py-2 rounded-md bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </section>

          {categories.length > 0 && (
            <section className="flex flex-col flex-1 min-h-0">
              <label className="text-xs text-muted mb-1 block">分类</label>
              <div className="relative mb-2 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                <input
                  value={catQuery}
                  onChange={e => setCatQuery(e.target.value)}
                  placeholder="搜索分类..."
                  className="w-full pl-8 pr-3 py-2 rounded-md bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <ul className="flex-1 min-h-0 overflow-y-auto rounded-md border border-border divide-y divide-border">
                {filteredCats.length === 0 ? (
                  <li className="px-3 py-3 text-xs text-muted text-center">无匹配分类</li>
                ) : (
                  filteredCats.map(cat => {
                    const checked = selectedCatIds.includes(cat.id);
                    return (
                      <li key={cat.id}>
                        <button
                          type="button"
                          onClick={() => toggleCat(cat.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-surface-2 transition-colors"
                        >
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              checked ? 'bg-accent border-accent' : 'border-border'
                            }`}
                          >
                            {checked && <Check className="w-3 h-3 text-white" />}
                          </span>
                          <span className="truncate flex-1">{cat.name}</span>
                          <span className="text-xs text-muted tabular-nums">{cat.repoCount}</span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>
          )}
        </div>

        <div className="flex gap-2 justify-end px-5 py-4 border-t border-border shrink-0 bg-surface">
          <button
            onClick={handleClose}
            className="flex-1 max-w-[120px] py-2 text-sm text-muted hover:text-text rounded-md border border-border hover:bg-surface-2"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 max-w-[120px] py-2 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </aside>
    </div>
  );
}
