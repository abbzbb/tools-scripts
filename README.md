# tools-scripts

实用网络脚本集合（Quantumult X / Loon 等）。

## 目录

| 路径 | 说明 |
|------|------|
| [`sub-mitm/`](./sub-mitm/) | 订阅 MITM：分析 Clash YAML、成功缓存、403 `device_limit` 本地回退 |

## 快速使用

### Loon

插件（推荐）：

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/sub-mitm/loon/sub-mitm.plugin
```

在 Loon → 配置 → 插件 → 安装，开启 MitM 与脚本。

### Quantumult X

1. 脚本：

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/sub-mitm/sub-mitm.js
```

2. 配置增加（见 [`sub-mitm/quantumultx/rewrite-snippet.conf`](./sub-mitm/quantumultx/rewrite-snippet.conf)）：

```ini
[rewrite_local]
^https://star\.wag1719\.top/u/.+ url script-response-body https://raw.githubusercontent.com/abbzbb/tools-scripts/main/sub-mitm/sub-mitm.js

[mitm]
hostname = star.wag1719.top
```

## 本地测试

```bash
# 需 Node.js；测试使用内置脱敏 fixture，不依赖真实订阅
node sub-mitm/loon/test-sub-mitm-loon.js
node sub-mitm/quantumultx/test-sub-mitm.js
```

## 许可

仅供个人学习与调试自有订阅；请遵守服务商条款。
