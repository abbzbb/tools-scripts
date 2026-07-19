/**
 * 订阅 MITM：分析 + 缓存 + 403 device_limit 回退
 * 兼容：Loon（推荐）/ Quantumult X / Surge（响应改写）
 *
 * 仓库: https://github.com/abbzbb/tools-scripts
 * 路径: sub-mitm/sub-mitm.js
 *
 * 默认匹配订阅域名 star.wag1719.top（可按需改 rewrite/plugin 与 CONFIG）
 *   200 → text/yaml（Clash）
 *   403 → subscription blocked: device_limit
 *
 * Loon:  http-response + requires-body=true
 * QX:    script-response-body
 */

// ===================== 可改配置 =====================
const CONFIG = {
  cacheKey: "sub_cache_star_wag1719",
  metaKey: "sub_meta_star_wag1719",
  notifyOnSuccess: true,
  notifyOnFallback: true,
  logSampleNames: 5,
  enableFilter: false,
  keepRegions: ["TW", "JP", "HK"],
  cleanProxyGroups: true,
};

// ===================== 环境适配 =====================
const isLoon = typeof $loon !== "undefined";
const isQuanX =
  typeof $task !== "undefined" ||
  (typeof $prefs !== "undefined" && typeof $loon === "undefined");
const isSurge = typeof $httpClient !== "undefined" && typeof $loon === "undefined" && typeof $task === "undefined";

function log(msg) {
  console.log("[sub-mitm] " + msg);
}

function notify(title, subtitle, message) {
  try {
    if (typeof $notify === "function") {
      // Quantumult X
      $notify(title, subtitle || "", message || "");
    } else if (typeof $notification !== "undefined" && $notification.post) {
      // Loon / Surge
      $notification.post(title, subtitle || "", message || "");
    }
  } catch (e) {
    log("notify failed: " + e);
  }
}

function storageWrite(key, value) {
  const v = value == null ? "" : String(value);
  try {
    if (typeof $prefs !== "undefined" && $prefs.setValueForKey) {
      return $prefs.setValueForKey(v, key);
    }
    if (typeof $persistentStore !== "undefined" && $persistentStore.write) {
      return $persistentStore.write(v, key);
    }
  } catch (e) {
    log("storageWrite failed: " + e);
  }
  return false;
}

function storageRead(key) {
  try {
    if (typeof $prefs !== "undefined" && $prefs.valueForKey) {
      const v = $prefs.valueForKey(key);
      return v == null ? null : v;
    }
    if (typeof $persistentStore !== "undefined" && $persistentStore.read) {
      const v = $persistentStore.read(key);
      return v == null ? null : v;
    }
  } catch (e) {
    log("storageRead failed: " + e);
  }
  return null;
}

function statusCodeOf(resp) {
  if (!resp) return 0;
  if (typeof resp.statusCode !== "undefined" && resp.statusCode !== null) {
    return Number(resp.statusCode);
  }
  // Loon / Surge 常用 $response.status 为数字
  if (typeof resp.status !== "undefined" && resp.status !== null) {
    if (typeof resp.status === "number") return resp.status;
    const m = String(resp.status).match(/(\d{3})/);
    if (m) return Number(m[1]);
  }
  return 0;
}

/** 原样放行 */
function donePass() {
  $done({});
}

/** 只改 body */
function doneBody(body) {
  $done({ body: body });
}

/**
 * 403 回退：伪造 200 + YAML
 * Loon/Surge: $done({ response: { status, headers, body } })
 * QX:         $done({ status: "HTTP/1.1 200 OK", headers, body })
 */
function doneFake200(body) {
  const headers = {
    "Content-Type": "text/yaml; charset=utf-8",
  };
  // 尽量保留原响应头（去掉长度/编码，交给客户端重算）
  try {
    const src = ($response && $response.headers) || {};
    for (const k in src) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
      const lk = String(k).toLowerCase();
      if (
        lk === "content-length" ||
        lk === "content-encoding" ||
        lk === "transfer-encoding"
      ) {
        continue;
      }
      headers[k] = src[k];
    }
    headers["Content-Type"] = "text/yaml; charset=utf-8";
  } catch (e) {}

  if (isLoon || isSurge) {
    $done({
      response: {
        status: 200,
        headers: headers,
        body: body,
      },
    });
    return;
  }
  // Quantumult X
  $done({
    status: "HTTP/1.1 200 OK",
    headers: headers,
    body: body,
  });
}

// ===================== 业务工具 =====================
function analyzeClashYaml(body) {
  const result = {
    proxyCount: 0,
    types: {},
    regions: {},
    names: [],
  };
  if (!body || typeof body !== "string") return result;

  const nameRe = /^\s*-\s*name:\s*(.+)\s*$/gm;
  let m;
  while ((m = nameRe.exec(body)) !== null) {
    const name = String(m[1]).trim();
    if (!name) continue;
    result.proxyCount += 1;
    result.names.push(name);

    const regionMatch = name.match(
      /(?:[\u{1F1E6}-\u{1F1FF}]{2}\s*)?([A-Z]{2})\b/u
    );
    const region = regionMatch ? regionMatch[1] : "??";
    result.regions[region] = (result.regions[region] || 0) + 1;

    const typeFromName = name.match(/\|\s*([a-z0-9+]+)\s*$/i);
    if (typeFromName) {
      const t = typeFromName[1].toLowerCase();
      result.types[t] = (result.types[t] || 0) + 1;
    }
  }

  if (Object.keys(result.types).length === 0) {
    const typeRe = /^\s*type:\s*([a-z0-9-]+)\s*$/gim;
    while ((m = typeRe.exec(body)) !== null) {
      const t = m[1].toLowerCase();
      if (
        ["select", "url-test", "fallback", "load-balance", "relay"].indexOf(t) >=
        0
      ) {
        continue;
      }
      result.types[t] = (result.types[t] || 0) + 1;
    }
  }

  return result;
}

function topEntries(obj, n) {
  return Object.keys(obj)
    .map(function (k) {
      return { k: k, v: obj[k] };
    })
    .sort(function (a, b) {
      return b.v - a.v;
    })
    .slice(0, n)
    .map(function (x) {
      return x.k + ":" + x.v;
    })
    .join(", ");
}

function filterProxiesByRegion(body, regions) {
  if (!regions || !regions.length) return { body: body, removed: 0, kept: 0 };

  const upper = regions.map(function (r) {
    return String(r).toUpperCase();
  });

  const start = body.search(/^proxies:\s*$/m);
  if (start < 0) {
    log("未找到 proxies: 段，跳过过滤");
    return { body: body, removed: 0, kept: 0 };
  }

  const after = body.slice(start);
  const nextKey = after.search(
    /\n(?=proxy-groups:|proxy-providers:|rules:|rule-providers:)/
  );
  const proxiesBlock = nextKey >= 0 ? after.slice(0, nextKey) : after;
  const rest = nextKey >= 0 ? after.slice(nextKey) : "";

  const headerMatch = proxiesBlock.match(/^proxies:\s*\n/);
  if (!headerMatch) {
    return { body: body, removed: 0, kept: 0 };
  }
  const header = headerMatch[0];
  const itemsText = proxiesBlock.slice(header.length);

  const chunks = itemsText.split(/(?=^- name:)/m).filter(function (s) {
    return s && s.trim().length;
  });

  const keptChunks = [];
  let removed = 0;
  const removedNames = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const nm = chunk.match(/^- name:\s*(.+)\s*$/m);
    const name = nm ? nm[1].trim() : "";
    const hit = upper.some(function (r) {
      return name.toUpperCase().indexOf(r) >= 0;
    });
    if (hit) {
      keptChunks.push(chunk.endsWith("\n") ? chunk : chunk + "\n");
    } else {
      removed += 1;
      if (name) removedNames.push(name);
    }
  }

  let newProxies = header + keptChunks.join("");
  if (!newProxies.endsWith("\n")) newProxies += "\n";

  let newBody = body.slice(0, start) + newProxies + rest;

  if (CONFIG.cleanProxyGroups && removedNames.length) {
    for (let j = 0; j < removedNames.length; j++) {
      const safe = removedNames[j].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const lineRe = new RegExp("^\\s*-\\s*" + safe + "\\s*$\\n?", "gm");
      newBody = newBody.replace(lineRe, "");
    }
  }

  return { body: newBody, removed: removed, kept: keptChunks.length };
}

function saveCache(body, meta) {
  storageWrite(CONFIG.cacheKey, body);
  storageWrite(CONFIG.metaKey, JSON.stringify(meta));
  log("已缓存订阅 body，长度=" + body.length);
}

function loadCache() {
  const body = storageRead(CONFIG.cacheKey);
  const metaRaw = storageRead(CONFIG.metaKey);
  let meta = null;
  if (metaRaw) {
    try {
      meta = JSON.parse(metaRaw);
    } catch (e) {
      meta = null;
    }
  }
  return { body: body, meta: meta };
}

// ===================== 主逻辑 =====================
const url = ($request && $request.url) || "";
const code = statusCodeOf($response);
const body = ($response && $response.body) || "";

log(
  "env=" +
    (isLoon ? "Loon" : isQuanX ? "QuanX" : isSurge ? "Surge" : "unknown")
);
log("URL=" + url);
log("statusCode=" + code + " bodyLen=" + (body ? body.length : 0));

const isDeviceLimit =
  code === 403 ||
  (typeof body === "string" && body.indexOf("device_limit") >= 0) ||
  (typeof body === "string" && body.indexOf("subscription blocked") >= 0);

if (isDeviceLimit) {
  const cached = loadCache();
  if (cached.body && cached.body.length > 0) {
    log("403 device_limit，使用本地缓存回退，cacheLen=" + cached.body.length);
    if (CONFIG.notifyOnFallback) {
      const when = (cached.meta && cached.meta.savedAt) || "未知时间";
      const cnt = (cached.meta && cached.meta.proxyCount) || "?";
      notify(
        "订阅 403 已回退缓存",
        "device_limit",
        "缓存节点约 " + cnt + " 个\n保存于 " + when
      );
    }
    doneFake200(cached.body);
  } else {
    log("403 且无本地缓存，原样返回");
    if (CONFIG.notifyOnFallback) {
      notify(
        "订阅被拒绝",
        "device_limit",
        "本地无可用缓存，请稍后再试或换设备额度"
      );
    }
    donePass();
  }
} else {
  const looksLikeYaml =
    typeof body === "string" &&
    (body.indexOf("proxies:") >= 0 || body.indexOf("\nproxies:") >= 0);

  if (looksLikeYaml) {
    let working = body;
    let filterInfo = { removed: 0, kept: 0 };

    if (CONFIG.enableFilter && CONFIG.keepRegions && CONFIG.keepRegions.length) {
      filterInfo = filterProxiesByRegion(working, CONFIG.keepRegions);
      working = filterInfo.body;
      log(
        "地区过滤 keep=" +
          CONFIG.keepRegions.join(",") +
          " → kept=" +
          filterInfo.kept +
          " removed=" +
          filterInfo.removed
      );
    }

    const stats = analyzeClashYaml(working);
    log("节点数=" + stats.proxyCount);
    log("协议分布: " + topEntries(stats.types, 10));
    log("地区分布: " + topEntries(stats.regions, 10));
    if (CONFIG.logSampleNames > 0) {
      log(
        "样例节点: " +
          stats.names.slice(0, CONFIG.logSampleNames).join(" | ")
      );
    }

    const meta = {
      savedAt: new Date().toISOString(),
      url: url,
      proxyCount: stats.proxyCount,
      types: stats.types,
      regions: stats.regions,
      filtered: CONFIG.enableFilter,
      keepRegions: CONFIG.keepRegions,
    };
    saveCache(working, meta);

    if (CONFIG.notifyOnSuccess) {
      notify(
        "订阅已更新",
        stats.proxyCount + " 个节点",
        "协议: " +
          topEntries(stats.types, 5) +
          (CONFIG.enableFilter
            ? "\n过滤后保留 " + filterInfo.kept + "，去掉 " + filterInfo.removed
            : "")
      );
    }

    if (working !== body) {
      doneBody(working);
    } else {
      donePass();
    }
  } else {
    log(
      "响应不像 Clash YAML，跳过处理。body 预览: " + String(body).slice(0, 120)
    );
    donePass();
  }
}
