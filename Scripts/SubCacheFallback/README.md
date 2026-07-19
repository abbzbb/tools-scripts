# SubCacheFallback · 订阅缓存回退

| 字段 | 值 |
|------|-----|
| **项目名** | `SubCacheFallback` |
| **中文名** | 订阅缓存回退 |
| **日志前缀** | `[SubCacheFallback]` |
| **缓存 Key** | `SubCacheFallback_body` / `SubCacheFallback_meta` |
| **主文件** | [`SubCacheFallback.js`](./SubCacheFallback.js) |

## 功能

1. 订阅返回 **200 + Clash YAML**：统计节点，通知，写入本地缓存  
2. 返回 **403** 且含 `device_limit`：有缓存则伪造 **200** 回退  
3. 可选按地区过滤（`CONFIG.enableFilter`）

## Quantumult X 引用地址（重要）

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/QuantumultX/Rewrite/SubCacheFallback.conf
```

> 不要使用 `https://github.com/.../blob/...` 网页链接，否则会报 `invalid line <!DOCTYPE html>`。

## 客户端入口

| 客户端 | 入口 |
|--------|------|
| Loon | [`Loon/Plugin/SubCacheFallback.plugin`](../../Loon/Plugin/SubCacheFallback.plugin) |
| Quantumult X | [`QuantumultX/Rewrite/SubCacheFallback.conf`](../../QuantumultX/Rewrite/SubCacheFallback.conf) |

## Raw

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/Scripts/SubCacheFallback/SubCacheFallback.js
```

## 配置（脚本顶部 CONFIG）

```js
enableFilter: false,
keepRegions: ["TW", "JP", "HK"],
notifyOnSuccess: true,
notifyOnFallback: true,
```

## 测试

```bash
node Scripts/SubCacheFallback/test-loon.js
node Scripts/SubCacheFallback/test-qx.js
```

使用 `fixtures/` 脱敏样例，不含真实节点密钥。
