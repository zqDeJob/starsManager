const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const forbiddenFiles = [
  'extension/src/lib/local-server.ts',
  'electron/main.cjs',
  'electron-builder.yml',
  'scripts/prepare-electron.cjs',
  '.github/workflows/build-windows.yml',
];
const scannedFiles = [
  'package.json',
  'client/src/App.tsx',
  'extension/src/app/main.tsx',
  'extension/manifest.config.ts',
  'README.md',
];
const forbiddenPatterns = [
  /127\.0\.0\.1/,
  /useLocalServer/,
  /createLocalServerApi/,
  /requestLocalServerPermission/,
  /连接本地服务/,
  /本地服务模式/,
  /electron-builder/,
  /prepare:electron/,
  /dev:desktop/,
  /"pack":/,
  /"pack:dir":/,
  /npm run pack/,
  /Windows 桌面版/,
  /StarsManager-Setup/,
];

const failures = [];

for (const relativePath of forbiddenFiles) {
  if (fs.existsSync(path.join(root, relativePath))) {
    failures.push(`${relativePath} should be removed`);
  }
}

for (const relativePath of scannedFiles) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) continue;

  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      failures.push(`${relativePath} still contains ${pattern}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
