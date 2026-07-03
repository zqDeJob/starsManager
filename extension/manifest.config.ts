import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Stars Manager',
  description: 'GitHub Stars 管理：同步 Stars、Star Lists，本地 DIY 分类与 Tag（YAML 存储）',
  version: '1.1.0',
  permissions: ['storage', 'unlimitedStorage', 'tabs'],
  host_permissions: ['https://api.github.com/*'],
  action: {
    default_title: '打开 Stars Manager',
  },
  options_page: 'src/app/index.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
});
