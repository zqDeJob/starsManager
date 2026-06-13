# Stars Manager For Me

精简版 GitHub Stars 管理工具。

## 数据存储（YAML，可 GitHub 同步）

所有数据以 YAML 文件保存在 `data/` 目录：

| 文件 | 说明 | 是否提交 GitHub |
|------|------|----------------|
| `stars-data.yaml` | DIY 分类、描述、Tag | ✅ **提交，用于同步** |
| `github-cache.yaml` | Stars / Star Lists 缓存 | ❌ 可重新同步，不必提交 |
| `local.yaml` | GitHub Token | ❌ **切勿提交** |

### 多设备同步方法

1. 把 `data/stars-data.yaml` 放进一个 GitHub 仓库（可以是私有仓库）
2. 在每台电脑上 clone 同一仓库，或只同步这个文件
3. 修改分类/描述/Tag 后，`git commit && git push`
4. 另一台电脑 `git pull` 后重启应用即可

> Stars 列表本身从 GitHub API 重新拉取即可，只需同步 `stars-data.yaml`。

---

## 本地使用

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 桌面版 exe

```bash
npm install
npm run pack
```

安装包在 `release/StarsManager-Setup-1.0.0.exe`

桌面版数据目录：`C:\Users\你\AppData\Roaming\stars-manager-for-me\data\`

可将该目录下的 `stars-data.yaml` 同样纳入 Git 管理实现同步。

---

## 使用步骤

1. 设置 → 填入 GitHub Token（存于 `local.yaml`）
2. 点 **同步** 拉取 Stars 和 Star Lists
3. **我的分类** 里管理 DIY 分类、描述、Tag（写入 `stars-data.yaml`）

Token 创建：https://github.com/settings/tokens （需 `read:user`）

## 功能

- **GitHub Stars** — 同步并浏览星标仓库
- **GitHub Star Lists** — GitHub 官方列表（只读）
- **我的分类** — 本地 DIY，与 GitHub 列表完全独立

## 技术栈

React + Vite + Express + YAML 文件存储 + Electron（可选）
