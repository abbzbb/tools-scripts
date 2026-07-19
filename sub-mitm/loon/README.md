# Loon 安装：订阅 MITM 缓存回退

## 一键插件

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/sub-mitm/loon/sub-mitm.plugin
```

Loon → **配置 → 插件 → +** → 粘贴上方地址 → 启用。

并确认：

1. MitM 证书已安装且系统信任  
2. MitM / 脚本开关已打开  
3. 主机名含 `star.wag1719.top`（插件会写入）

## 手动脚本

| 项 | 值 |
|----|-----|
| 类型 | HTTP Response |
| 正则 | `^https://star\.wag1719\.top/u/.+` |
| 脚本 | `https://raw.githubusercontent.com/abbzbb/tools-scripts/main/sub-mitm/sub-mitm.js` |
| 需要 body | **开** |
| 超时 | 60 |

## 验证

更新订阅后，日志应出现：

```text
[sub-mitm] env=Loon
[sub-mitm] 节点数=...
[sub-mitm] 已缓存订阅 body
```

## 本地测试

```bash
node sub-mitm/loon/test-sub-mitm-loon.js
```
