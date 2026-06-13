import { useEffect, useState } from 'react';
import { Key, Moon, RefreshCw, Settings, Star, Sun, X } from 'lucide-react';
import { useAppStore } from './store';
import { api } from './api';
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
  const [theme, setTheme] = useState<Theme>(() =>
    (document.documentElement.getAttribute('data-theme') as Theme) || 'light',
  );

  useEffect(() => {
    loadSyncStatus();
  }, [loadSyncStatus]);

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
                onClick={() => setTab(t.id)}
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
        {tab === 'github-stars' && <GitHubStarsView />}
        {tab === 'github-lists' && <GitHubListsView />}
        {tab === 'diy' && <DiyView />}
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
  const { saveToken, clearToken, syncStatus } = useAppStore();
  const [tokenInput, setTokenInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [dataInfo, setDataInfo] = useState<{ dataDir: string; syncHint: string } | null>(null);

  useEffect(() => {
    api.getDataInfo().then(setDataInfo).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
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
            </section>
          )}
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
