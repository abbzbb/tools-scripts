# tools-scripts

自用网络脚本仓库，按 **客户端（Loon / Quantumult X）** 与 **脚本项目名** 分类。

仓库：https://github.com/abbzbb/tools-scripts

---

## 命名约定

| 层级 | 规则 | 示例 |
|------|------|------|
| **脚本项目名** | 英文 PascalCase，用于目录与区分不同应用 | `SubCacheFallback` |
| **中文名** | 简短功能描述 | 订阅缓存回退 |
| **共享逻辑** | 放在 `Scripts/<项目名>/`，双端通用时只维护一份 `.js` | `Scripts/SubCacheFallback/SubCacheFallback.js` |
| **Loon 插件** | `Loon/Plugin/<项目名>.plugin` | `Loon/Plugin/SubCacheFallback.plugin` |
| **QX 重写** | `QuantumultX/Rewrite/<项目名>.conf` | `QuantumultX/Rewrite/SubCacheFallback.conf` |

后续新增应用脚本时：新建 `Scripts/YourAppName/`，再在 `Loon/`、`QuantumultX/` 下挂入口，并更新本页「脚本目录」。

---

## 目录结构

```text
tools-scripts/
├── README.md                 # 本说明 + 总目录
├── Scripts/                  # 共享脚本逻辑（按项目名分子目录）
│   └── SubCacheFallback/
├── Loon/                     # Loon 专用入口
│   ├── README.md
│   └── Plugin/
└── QuantumultX/              # Quantumult X 专用入口
    ├── README.md
    └── Rewrite/
```

| 路径 | 放什么 |
|------|--------|
| `Scripts/<Name>/` | 主 JS、项目说明、fixtures、单元测试 |
| `Loon/Plugin/` | `.plugin` 清单（script-path 指向 Scripts 下 raw） |
| `Loon/Script/` | （可选）仅 Loon 专用、不共享的脚本 |
| `QuantumultX/Rewrite/` | `rewrite_local` + `mitm` 片段 |
| `QuantumultX/Script/` | （可选）仅 QX 专用脚本 |

---

## 脚本目录（Catalog）

| 项目名 | 中文名 | 功能摘要 | Loon | Quantumult X | 共享脚本 |
|--------|--------|----------|------|--------------|----------|
| **SubCacheFallback** | 订阅缓存回退 | 订阅 YAML 分析/缓存；403 `device_limit` 时回退本地缓存 | [Plugin](./Loon/Plugin/SubCacheFallback.plugin) | [Rewrite](./QuantumultX/Rewrite/SubCacheFallback.conf) | [JS](./Scripts/SubCacheFallback/SubCacheFallback.js) |

---

## 快速安装

### Loon · SubCacheFallback

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/Loon/Plugin/SubCacheFallback.plugin
```

配置 → 插件 → 粘贴地址 → 启用；开启 MitM 与脚本。

说明：[Loon/README.md](./Loon/README.md)

### Quantumult X · SubCacheFallback

**重写引用（必须用 raw，不要用 github.com/blob 网页）：**

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/QuantumultX/Rewrite/SubCacheFallback.conf
```

脚本 raw：

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/Scripts/SubCacheFallback/SubCacheFallback.js
```

若提示 `invalid line <!DOCTYPE html>`：说明导入了 HTML 页面，请改用上面 raw 地址。详见 [QuantumultX/README.md](./QuantumultX/README.md)。

### 备用 CDN（jsDelivr）

```text
https://cdn.jsdelivr.net/gh/abbzbb/tools-scripts@main/Scripts/SubCacheFallback/SubCacheFallback.js
https://cdn.jsdelivr.net/gh/abbzbb/tools-scripts@main/Loon/Plugin/SubCacheFallback.plugin
```

---

## 本地测试

```bash
node Scripts/SubCacheFallback/test-loon.js
node Scripts/SubCacheFallback/test-qx.js
```

---

## 旧路径说明

此前路径 `sub-mitm/` 已迁移为 **`SubCacheFallback`**。请改用上表新地址；旧 raw 链接将 404。
