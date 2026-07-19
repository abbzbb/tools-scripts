# Quantumult X 脚本入口

本目录只放 **Quantumult X** 的重写片段与（可选）专属脚本。  
双端通用逻辑在 `Scripts/<项目名>/`。

## 目录

```text
QuantumultX/
├── README.md
├── Rewrite/           # 可「重写 → 引用」的纯规则文件
└── Script/            # （可选）仅 QX 专用脚本
```

## ⚠️ 导入报错 `invalid line <!DOCTYPE html>`

说明 QX 读到的是 **HTML 网页**，不是规则文本。常见原因：

| 错误做法 | 正确做法 |
|----------|----------|
| 用了 `https://github.com/.../blob/main/...` | 必须用 **raw** 地址 |
| 把 README / 仓库首页当资源 | 用下面表格里的 raw |
| raw 404 返回 GitHub 错误页 | 检查路径，或改用 jsDelivr |

**请只用 raw / CDN，不要用浏览器里复制的 github.com 页面链接。**

---

## 已收录重写

| 项目名 | 中文名 | 远程引用（raw） |
|--------|--------|-----------------|
| **SubCacheFallback** | 订阅缓存回退 | 见下方 |

### SubCacheFallback 安装（推荐：重写引用）

> **403 修复说明（已实测）**  
> 机场对 Loon/QX/Clash 的 `User-Agent` 返回 `device_limit`；对 Safari UA 返回 200。  
> 当前规则含 **script-request-header**（改成 Safari UA）+ **script-response-body**（缓存）。  
> 更新订阅时请打开 MitM/重写，否则改 UA 不生效。  
>
> **QX 节点订阅请用：**  
> `https://star.wag1719.top/u/<token>?client=qx`  
> （`client=loon` 是 Clash YAML；`client=qx` 才是 QX 可用的 base64 节点列表。）  
> 频繁刷新可能触发 `rate_limited`，稍后再试。

**1. 重写资源 URL（复制这一行）：**

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/QuantumultX/Rewrite/SubCacheFallback.conf
```

备用 CDN：

```text
https://cdn.jsdelivr.net/gh/abbzbb/tools-scripts@main/QuantumultX/Rewrite/SubCacheFallback.conf
```

**2. 操作步骤**

1. Quantumult X → 风车 → **重写**  
2. 右上角 **⋯ / 引用** → 添加资源  
3. 粘贴上面的 **raw** 地址（不要用 github.com/blob）  
4. 标签可填：`SubCacheFallback`  
5. 保存并启用  
6. 打开 **MitM**、**重写**；证书已信任  

**3. 脚本本身也会由规则自动拉取：**

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/Scripts/SubCacheFallback/SubCacheFallback.js
```

**4. 验证**

更新订阅（流量走 QX）后，日志搜索：`[SubCacheFallback]`

---

### 手动合并进配置文件（不用引用时）

编辑配置，在已有段落中**追加**（不要重复写多个 `[mitm]` 标题）：

```ini
[rewrite_local]
^https://star\.wag1719\.top/u/.+ url script-response-body https://raw.githubusercontent.com/abbzbb/tools-scripts/main/Scripts/SubCacheFallback/SubCacheFallback.js

[mitm]
hostname = star.wag1719.top
```

若已有 `hostname = a.com, b.com`，只追加域名：

```ini
hostname = a.com, b.com, star.wag1719.top
```

> 远程 `.conf` 文件**不要**写 `[rewrite_local]` / `[mitm]` 方括号段名，QX 引用资源只认「规则行 + hostname =」。

项目文档：[Scripts/SubCacheFallback/README.md](../Scripts/SubCacheFallback/README.md)

## 新增 QX 脚本时

1. `Scripts/<NewName>/` 写 JS  
2. `QuantumultX/Rewrite/<NewName>.conf` 写**纯规则**（可含 `hostname =`，无方括号段）  
3. 更新根 README Catalog，并在文档里只提供 **raw** 链接  
