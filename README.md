# Stars Manager

精简版 GitHub Stars 管理工具。支持 **Web**、**Windows 桌面版**、**Chrome / Edge 扩展** 三种使用方式，核心功能一致。

## 界面预览

### GitHub Stars

浏览并搜索已星标的仓库。

![GitHub Stars 列表](docs/screenshots/stars.png)

### GitHub Star Lists

查看 GitHub 官方 Star Lists（只读）。

![GitHub Star Lists](docs/screenshots/lists.png)

### 我的分类

本地 DIY 分类、描述与 Tag，与 GitHub Lists 完全独立。

![我的分类](docs/screenshots/diy-categories.png)

---

## 功能

| 功能 | 说明 |
|------|------|
| **GitHub Stars** | 同步并浏览星标仓库 |
| **GitHub Star Lists** | GitHub 官方列表（只读） |
| **我的分类** | 本地 DIY 分类、描述、Tag，与 GitHub Lists 独立 |
| **深色 / 浅色主题** | 自动记忆偏好 |
| **多设备同步** | 通过 `stars-data.yaml` 在 Web / exe / 扩展间互通 |

---

## 快速开始

### 1. Web 版（开发 / 浏览器）

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

### 2. Windows 桌面版（exe）

```bash
npm install
npm run pack
```

安装包：`release/StarsManager-Setup-1.0.0.exe`

数据目录：`C:\Users\你\AppData\Roaming\stars-manager-for-me\data\`

### 3. 浏览器扩展（Chrome / Edge）

```bash
npm install
npm run build:extension
```

加载步骤：

1. 打开 `chrome://extensions` 或 `edge://extensions`
2. 开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择 `extension/dist`
4. 点击扩展图标 → 新标签页打开完整界面

扩展开发（watch 模式）：

```bash
npm run dev:extension
```

扩展与 Web / 桌面版功能一致。设置中可 **导出 / 导入 `stars-data.yaml`**，或勾选 **连接本地服务**（`http://127.0.0.1:3001`，需先 `npm run dev`）共用磁盘数据。

---

## 使用步骤

1. **设置** → 填入 GitHub Token
2. 点击 **同步**，拉取 Stars 和 Star Lists
3. 在 **分类** Tab 管理 DIY 分类、描述、Tag

Token 创建：https://github.com/settings/tokens （需 `read:user`）

---

## 数据存储（YAML）

所有 DIY 数据以 YAML 保存，**Stars 列表本身可从 GitHub 重新拉取，只需同步 DIY 部分**。

### Web / 桌面版

运行时数据在 `server/data/`（桌面版为 AppData 对应目录）：

| 文件 | 说明 | 是否提交 Git |
|------|------|-------------|
| `stars-data.yaml` | DIY 分类、描述、Tag | ✅ 可提交，用于同步 |
| `github-cache.yaml` | Stars / Lists 缓存 | ❌ 可重新同步 |
| `local.yaml` | GitHub Token | ❌ **切勿提交** |

根目录 `data/` 仅含示例文件；实际运行读写 `server/data/`。

### 浏览器扩展

数据以 YAML 文本存于 `chrome.storage.local`（非磁盘文件）。与桌面版互通方式：

- 扩展 **导出** `stars-data.yaml` → 复制到桌面版数据目录
- 或桌面版导出 → 扩展 **导入**

### 多设备同步（Git）

1. 将 `stars-data.yaml` 放入 Git 仓库（可私有）
2. 各设备保持该文件一致（`git pull` / `git push`）
3. 修改分类 / Tag 后提交，另一台设备拉取后重启应用

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | Web 开发（client + server） |
| `npm run pack` | 构建并打包 Windows exe |
| `npm run build` | 构建 client + server + packages |
| `npm run build:extension` | 构建浏览器扩展 |
| `npm run dev:extension` | 扩展 watch 构建 |

---

## CI 自动打包

打 `v*` 标签（如 `v1.0.1`）或手动 Run workflow 时，GitHub Actions 自动构建 Windows exe 并创建 **Release**：

```bash
git tag v1.0.2
git push origin v1.0.2
```

安装包出现在 [Releases](https://github.com/zqDeJob/starsManager/releases) 页面。普通 push 到 `main` **不会**触发打包（避免与发版 tag 重复构建）。

也可在 Actions 页手动 **Run workflow** 构建（不上传 Release，仅 Artifacts）。

---

## 项目结构

```
packages/
  shared/          # 类型、GitHub API
  core/            # YAML 业务逻辑（分类、缓存、Token）
  storage-node/    # Node 磁盘读写
client/            # React UI（Web / 桌面 / 扩展共用）
server/            # Express API
extension/         # Chrome / Edge 扩展（Manifest V3）
electron/          # 桌面壳
```

---

## 技术栈

React 19 · Vite · Tailwind CSS 4 · Zustand · Express · YAML · Electron · Chrome Extension MV3
