const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'electron-resources');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  const serverDist = path.join(root, 'server', 'dist');
  const clientDist = path.join(root, 'client', 'dist');
  const serverPkg = JSON.parse(fs.readFileSync(path.join(root, 'server', 'package.json'), 'utf8'));

  if (!fs.existsSync(serverDist)) {
    console.error('请先运行: npm run build');
    process.exit(1);
  }
  if (!fs.existsSync(clientDist)) {
    console.error('请先运行: npm run build');
    process.exit(1);
  }

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const appServerDir = path.join(outDir, 'app-server');
  copyDir(serverDist, appServerDir);
  copyDir(clientDist, path.join(outDir, 'client-dist'));

  fs.writeFileSync(
    path.join(appServerDir, 'package.json'),
    JSON.stringify(
      {
        name: 'stars-server-bundle',
        version: '1.0.0',
        type: 'module',
        dependencies: serverPkg.dependencies,
      },
      null,
      2,
    ),
  );

  console.log('正在安装服务端依赖（用于打包）...');
  copyWorkspacePackages(appServerDir);
  execSync('npm install --omit=dev --no-audit --no-fund', {
    cwd: appServerDir,
    stdio: 'inherit',
  });

  console.log('Electron 打包资源已准备完成:', outDir);
}

function copyWorkspacePackages(appServerDir) {
  const packages = ['shared', 'core', 'storage-node'];
  for (const name of packages) {
    const srcDir = path.join(root, 'packages', name);
    const destDir = path.join(appServerDir, 'node_modules', '@stars-manager', name);
    fs.mkdirSync(destDir, { recursive: true });
    copyDir(path.join(srcDir, 'dist'), path.join(destDir, 'dist'));
    const pkg = JSON.parse(fs.readFileSync(path.join(srcDir, 'package.json'), 'utf8'));
    fs.writeFileSync(path.join(destDir, 'package.json'), JSON.stringify(pkg, null, 2));
  }
}

main();
