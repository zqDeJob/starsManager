import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setApiClient } from '@app/api';
import { initTheme } from '@app/theme';
import './tailwind.css';
import App from '@app/App';
import { createExtensionApi } from '../lib/extension-api';
import { createLocalServerApi, getUseLocalServer, requestLocalServerPermission } from '../lib/local-server';

async function bootstrap() {
  const useLocal = await getUseLocalServer();
  if (useLocal) {
    const granted = await chrome.permissions.contains({ origins: ['http://127.0.0.1:3001/*'] })
      || await requestLocalServerPermission();
    if (granted) {
      setApiClient(createLocalServerApi());
    } else {
      setApiClient(createExtensionApi());
    }
  } else {
    setApiClient(createExtensionApi());
  }

  initTheme();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
