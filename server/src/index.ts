import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { githubRouter } from './routes/github.js';
import { diyRouter } from './routes/diy.js';
import { dataRouter } from './routes/data.js';
import { ensureDataDir } from './storage/io.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

ensureDataDir();

function resolveClientDist(): string {
  if (process.env.CLIENT_DIST) {
    return process.env.CLIENT_DIST;
  }
  return path.join(__dirname, '..', '..', 'client', 'dist');
}

export function createApp() {
  const app = express();
  const clientDist = resolveClientDist();

  app.use(cors());
  app.use(express.json());

  app.use('/api/github', githubRouter);
  app.use('/api/diy', diyRouter);
  app.use('/api/data', dataRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'), err => {
      if (err) res.status(404).json({ error: 'Not found' });
    });
  });

  return app;
}

export function startServer(port = Number(process.env.PORT ?? 3001)) {
  const app = createApp();
  return app.listen(port, '127.0.0.1', () => {
    console.log(`Server running at http://127.0.0.1:${port}`);
  });
}

startServer();
