# Quantumult X 脚本入口

本目录只放 **Quantumult X** 的重写片段与（可选）专属脚本。  
双端通用逻辑在 `Scripts/<项目名>/`。

## 目录

```text
QuantumultX/
├── README.md          # 本文件
├── Rewrite/           # rewrite_local + mitm 片段
└── Script/            # （可选）仅 QX 使用的脚本
```

## 已收录重写

| 项目名 | 中文名 | 重写文件 | 共享脚本 |
|--------|--------|----------|----------|
| **SubCacheFallback** | 订阅缓存回退 | [Rewrite/SubCacheFallback.conf](./Rewrite/SubCacheFallback.conf) | [Scripts/…](../Scripts/SubCacheFallback/SubCacheFallback.js) |

### 安装 SubCacheFallback

1. 安装并信任 MitM 证书  
2. 合并 [Rewrite/SubCacheFallback.conf](./Rewrite/SubCacheFallback.conf) 到配置  
3. 打开 **MitM**、**重写**  
4. 日志搜索 `[SubCacheFallback]`

脚本 raw：

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/Scripts/SubCacheFallback/SubCacheFallback.js
```

项目文档：[Scripts/SubCacheFallback/README.md](../Scripts/SubCacheFallback/README.md)

## 新增 QX 脚本时

1. `Scripts/<NewName>/` 写 JS（或放 `QuantumultX/Script/` 若仅 QX）  
2. `QuantumultX/Rewrite/<NewName>.conf` 写规则  
3. 更新本表与根 `README.md` Catalog  
