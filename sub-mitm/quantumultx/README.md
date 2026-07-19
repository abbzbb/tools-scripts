# Quantumult X 安装：订阅 MITM 缓存回退

## 配置片段

合并 [`rewrite-snippet.conf`](./rewrite-snippet.conf)，或直接写入：

```ini
[rewrite_local]
^https://star\.wag1719\.top/u/.+ url script-response-body https://raw.githubusercontent.com/abbzbb/tools-scripts/main/sub-mitm/sub-mitm.js

[mitm]
hostname = star.wag1719.top
```

## 步骤

1. 安装并信任 MitM 证书  
2. 打开 **MitM**、**重写**  
3. 保存配置并重载  
4. 确保刷新订阅的流量经过 QX  

也可将脚本下载到 `Scripts/sub-mitm.js`，并把 rewrite 改为本地文件名。

## 验证

日志中搜索 `[sub-mitm]`，应看到 `env=QuanX` 与节点统计。

## 本地测试

```bash
node sub-mitm/quantumultx/test-sub-mitm.js
```
