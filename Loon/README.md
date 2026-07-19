# Loon 脚本入口

本目录只放 **Loon 客户端** 的安装入口（插件 / 可选专属脚本）。  
业务逻辑优先写在仓库根下的 `Scripts/<项目名>/`，保证与 QX 共用一份代码。

## 目录

```text
Loon/
├── README.md          # 本文件
├── Plugin/            # 插件清单 *.plugin
└── Script/            # （可选）仅 Loon 使用的脚本
```

## 已收录插件

| 项目名 | 中文名 | 插件文件 | 说明 |
|--------|--------|----------|------|
| **SubCacheFallback** | 订阅缓存回退 | [Plugin/SubCacheFallback.plugin](./Plugin/SubCacheFallback.plugin) | 订阅缓存 + 403 回退 |

### 安装 SubCacheFallback

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/Loon/Plugin/SubCacheFallback.plugin
```

1. Loon → 配置 → 插件 → 添加上述 URL  
2. 启用插件  
3. 确认 MitM 证书已信任、MitM/脚本开关已开  
4. 更新订阅，日志搜索 `[SubCacheFallback]`

### 手动添加（不用插件时）

| 项 | 值 |
|----|-----|
| 类型 | HTTP Response |
| 名称 | SubCacheFallback |
| 正则 | `^https://star\.wag1719\.top/u/.+` |
| 脚本 | `https://raw.githubusercontent.com/abbzbb/tools-scripts/main/Scripts/SubCacheFallback/SubCacheFallback.js` |
| 需要 body | **是** |
| 超时 | 60 |
| MitM | `star.wag1719.top` |

项目文档：[Scripts/SubCacheFallback/README.md](../Scripts/SubCacheFallback/README.md)

## 新增 Loon 脚本时

1. 在 `Scripts/<NewName>/` 写好共享 JS  
2. 在 `Loon/Plugin/<NewName>.plugin` 增加入口  
3. 更新本表与根 `README.md` 的 Catalog  
