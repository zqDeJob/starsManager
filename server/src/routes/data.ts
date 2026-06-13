import { Router } from 'express';
import { ensureDataDir, resolveDataDir, getDataFilePath, STARS_DATA_FILE, GITHUB_CACHE_FILE, LOCAL_FILE } from '../services.js';
import { starsData, localSettings } from '../services.js';

export const dataRouter = Router();

dataRouter.get('/info', (_req, res) => {
  ensureDataDir();
  res.json({
    dataDir: resolveDataDir(),
    files: {
      starsData: starsData.getStarsDataFilePath() ?? getDataFilePath(STARS_DATA_FILE),
      githubCache: getDataFilePath(GITHUB_CACHE_FILE),
      local: localSettings.getLocalFilePath() ?? getDataFilePath(LOCAL_FILE),
    },
    syncHint: '将 stars-data.yaml 提交到 GitHub 仓库即可在多设备间同步 DIY 分类、描述和 Tag。local.yaml 含 Token，请勿上传。',
  });
});
