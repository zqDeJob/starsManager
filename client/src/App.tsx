import { useEffect, useState } from 'react';
import { Key, Moon, RefreshCw, Settings, Star, Sun, X } from 'lucide-react';
import { useAppStore } from './store';
import { api, isExtensionContext } from './api';
import { applyTheme, type Theme } from './theme';
import { GitHubStarsView } from './components/GitHubStarsView';
import { GitHubListsView } from './components/GitHubListsView';
import { DiyView } from './components/DiyView';
import type { Tab } from './types';

const tabs: { id: Tab; label: string }[] = [
  { id: 'github-stars', label: 'Stars' },
  { id: 'github-lists', label: 'Lists' },
  { id: 'diy', label: '分类' },
];

export default function App() {
  const { tab, setTab, loadSyncStatus, syncStatus, user, syncing, sync, error } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [mountedTabs, setMountedTabs] = useState<Set<Tab>>(() => new Set([tab]));
  const [theme, setTheme] = useState<Theme>(() =>
    (document.documentElement.getAttribute('data-theme') as Theme) || 'light',
  );

  useEffect(() => {
    loadSyncStatus();
  }, [loadSyncStatus]);

  const switchTab = (next: Tab) => {
    setMountedTabs(prev => new Set(prev).add(next));
    setTab(next);
  };

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="sticky top-0 z-20 bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-6">
          <div className="flex items-center gap-1.5 shrink-0">
            <Star className="w-4 h-4 text-accent" fill="currentColor" />
            <span className="font-semibold text-sm">Stars</span>
          </div>

          <nav className="flex items-center gap-1 flex-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  tab === t.id
                    ? 'text-accent font-medium bg-tag'
                    : 'text-muted hover:text-text hover:bg-surface-2'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            {syncStatus?.hasToken && (
              <span className="hidden sm:inline text-xs text-muted mr-2">
                {syncStatus.starsCount} stars
              </span>
            )}
            {user && (
              <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full mr-1" />
            )}
            <IconBtn onClick={toggleTheme} title={theme === 'dark' ? '浅色模式' : '深色模式'}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </IconBtn>
            <IconBtn
              onClick={() => sync()}
              disabled={syncing || !syncStatus?.hasToken}
              title="同步"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            </IconBtn>
            <IconBtn onClick={() => setShowSettings(true)} title="设置">
              <Settings className="w-4 h-4" />
            </IconBtn>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 text-red-600 dark:text-red-400 text-sm px-4 py-2 flex items-center justify-between border-b border-red-500/20">
          <span>{error}</span>
          <button onClick={() => useAppStore.setState({ error: null })} className="p-0.5 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!syncStatus?.hasToken && (
        <div className="bg-surface-2 text-muted text-xs text-center py-1.5 border-b border-border">
          请先在设置中配置 GitHub Token
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4">
        {mountedTabs.has('github-stars') && (
          <div className={tab === 'github-stars' ? undefined : 'hidden'}>
            <GitHubStarsView />
          </div>
        )}
        {mountedTabs.has('github-lists') && (
          <div className={tab === 'github-lists' ? undefined : 'hidden'}>
            <GitHubListsView />
          </div>
        )}
        {mountedTabs.has('diy') && (
          <div className={tab === 'diy' ? undefined : 'hidden'}>
            <DiyView />
          </div>
        )}
      </main>

      {showSettings && (
        <SettingsModal
          theme={theme}
          onThemeChange={t => { applyTheme(t); setTheme(t); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface-2 disabled:opacity-30 transition-colors"
    >
      {children}
    </button>
  );
}

function SettingsModal({
  theme,
  onThemeChange,
  onClose,
}: {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onClose: () => void;
}) {
  const { saveToken, clearToken, syncStatus, loadCategories, loadDiyRepos } = useAppStore();
  const [tokenInput, setTokenInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [dataInfo, setDataInfo] = useState<{ dataDir: string; syncHint: string } | null>(null);
  const isExtension = isExtensionContext();

  useEffect(() => {
    api.getDataInfo().then(setDataInfo).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await saveToken(tokenInput);
      setTokenInput('');
      onClose();
    } catch (e) {
      useAppStore.setState({ error: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!api.exportStarsData) return;
    setSaving(true);
    setMessage('');
    try {
      const yaml = await api.exportStarsData();
      const blob = new Blob([yaml], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stars-data.yaml';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('已导出 stars-data.yaml');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (file: File) => {
    if (!api.importStarsData) return;
    setSaving(true);
    setMessage('');
    try {
      await api.importStarsData(await file.text());
      await Promise.all([loadCategories(), loadDiyRepos()]);
      setMessage('已导入 stars-data.yaml，分类数据已刷新');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-xl w-full max-w-sm shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">设置</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-surface-2 text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          <section>
            <label className="text-xs font-medium text-muted mb-2 block">主题</label>
            <div className="flex gap-2">
              {(['light', 'dark'] as Theme[]).map(t => (
                <button
                  key={t}
                  onClick={() => onThemeChange(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm border transition-colors ${
                    theme === t
                      ? 'border-accent bg-tag text-accent font-medium'
                      : 'border-border text-muted hover:bg-surface-2'
                  }`}
                >
                  {t === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  {t === 'light' ? '浅色' : '深色'}
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="text-xs font-medium text-muted mb-2 flex items-center gap-1">
              <Key className="w-3 h-3" /> GitHub Token
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder={syncStatus?.hasToken ? '输入新 Token 替换...' : 'ghp_...'}
              className="w-full px-3 py-2 rounded-md bg-bg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <p className="text-xs text-muted mt-1.5">需要 read:user 权限</p>
          </section>

          {dataInfo && (
            <section className="text-xs text-muted leading-relaxed">
              <p className="font-medium text-text mb-1">数据同步</p>
              <p>{dataInfo.syncHint}</p>
              {isExtension && (
                <p className="mt-1 text-muted">存储位置：{dataInfo.dataDir}</p>
              )}
            </section>
          )}

          {isExtension && api.exportStarsData && (
            <section>
              <label className="text-xs font-medium text-muted mb-2 block">YAML 导入 / 导出</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleExport()}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-surface-2"
                >
                  导出 stars-data.yaml
                </button>
                <label className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-surface-2 cursor-pointer">
                  导入 stars-data.yaml
                  <input
                    type="file"
                    accept=".yaml,.yml,text/yaml,text/x-yaml,application/x-yaml"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) void handleImport(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </section>
          )}

          {message && <p className="text-xs text-muted">{message}</p>}
        </div>

        <div className="flex gap-2 justify-end px-5 py-4 border-t border-border">
          {syncStatus?.hasToken && (
            <button
              onClick={async () => { await clearToken(); onClose(); }}
              className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-md"
            >
              清除
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!tokenInput.trim() || saving}
            className="px-4 py-1.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover disabled:opacity-40 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
