import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setApiClient } from '@app/api';
import { initTheme } from '@app/theme';
import './tailwind.css';
import App from '@app/App';
import { createExtensionApi } from '../lib/extension-api';

async function bootstrap() {
  setApiClient(createExtensionApi());

  initTheme();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
