import { Router } from 'express';
import { ensureDataDir, resolveDataDir } from '../storage/io.js';
import { getStarsDataFilePath } from '../storage/stars-data.js';
import { getLocalFilePath } from '../storage/local.js';
import { getDataFilePath } from '../storage/io.js';

export const dataRouter = Router();

dataRouter.get('/info', (_req, res) => {
  ensureDataDir();
  res.json({
    dataDir: resolveDataDir(),
    files: {
      starsData: getStarsDataFilePath(),
      githubCache: getDataFilePath('github-cache.yaml'),
      local: getLocalFilePath(),
    },
    syncHint: '将 stars-data.yaml 提交到 GitHub 仓库即可在多设备间同步 DIY 分类、描述和 Tag。local.yaml 含 Token，请勿上传。',
  });
});
