# sub-mitm

订阅接口 MITM 脚本（**Loon / Quantumult X 双端兼容**）。

## 功能

1. **200 + Clash YAML**：统计节点数/协议/地区，通知，写入本地缓存  
2. **403 + `device_limit`**：若有缓存，伪造 200 返回上次 YAML  
3. **可选**按地区关键字过滤节点（`CONFIG.enableFilter`）

## 文件

| 文件 | 说明 |
|------|------|
| [`sub-mitm.js`](./sub-mitm.js) | 主脚本（双端） |
| [`loon/sub-mitm.plugin`](./loon/sub-mitm.plugin) | Loon 插件 |
| [`loon/README.md`](./loon/README.md) | Loon 安装说明 |
| [`quantumultx/rewrite-snippet.conf`](./quantumultx/rewrite-snippet.conf) | QX 重写片段 |
| [`quantumultx/README.md`](./quantumultx/README.md) | QX 安装说明 |

## 远程地址

```text
脚本:
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/sub-mitm/sub-mitm.js

Loon 插件:
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/sub-mitm/loon/sub-mitm.plugin
```

## 默认匹配

```text
^https://star\.wag1719\.top/u/.+
hostname: star.wag1719.top
```

修改域名时请同步改插件 / rewrite 中的正则与 hostname。
