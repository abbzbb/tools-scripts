# SubCacheFallback · 订阅缓存回退

| 字段 | 值 |
|------|-----|
| **项目名** | `SubCacheFallback` |
| **中文名** | 订阅缓存回退 |
| **日志前缀** | `[SubCacheFallback]` |

## 实测结论（403 根因）

对 `https://star.wag1719.top/u/...?client=loon`：

| User-Agent | HTTP | 结果 |
|------------|------|------|
| Loon / Quantumult X / Clash / curl | **403** | `subscription blocked: device_limit` |
| Safari（iPhone / Mac） | **200** | Clash YAML（约 87 节点） |

机场按 **客户端 UA** 计设备；浏览器 UA 可正常拉取。  
脚本在**请求阶段**把 UA 改成 Safari，从而消除 403。

## 功能

1. **请求**：强制 `User-Agent` → Safari（可选，默认开）  
2. **响应 200 + YAML**：统计节点、缓存  
3. **响应 403**：有缓存则回退  

## 安装

### Loon

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/Loon/Plugin/SubCacheFallback.plugin
```

### Quantumult X（必须 raw）

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/QuantumultX/Rewrite/SubCacheFallback.conf
```

开启 **MitM + 重写**，再更新订阅。

## QX 额外说明

1. **403 修法**：启用本脚本的 **请求改 UA**（MitM + 重写必须开）。  
2. **格式**：请用 `?client=qx`（或 `quantumultx`），返回 base64 节点列表；`?client=loon` 是 Clash YAML。  
   ```text
   https://star.wag1719.top/u/<token>?client=qx
   ```
3. 更新节点时请保持 **MitM/重写开启**，否则 QX 自带 UA 仍会 403。  
4. 短时间多次刷新可能 `rate_limited`，等几分钟再试。

## 脚本

```text
https://raw.githubusercontent.com/abbzbb/tools-scripts/main/Scripts/SubCacheFallback/SubCacheFallback.js
```
