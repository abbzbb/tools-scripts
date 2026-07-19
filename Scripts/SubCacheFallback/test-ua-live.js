/**
 * 在线实测：UA 与 403/200 关系 + 本地模拟请求改 UA
 * 用法: node Scripts/SubCacheFallback/test-ua-live.js
 */
const https = require("https");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SUB =
  "https://star.wag1719.top/u/TY309noUHZX_ZK97VBdodbJYdi5GcZVS?client=loon";
const SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const LOON = "Loon/975 CFNetwork/3860.500.112 Darwin/25.4.0";

function fetchUA(ua) {
  return new Promise((resolve, reject) => {
    const u = new URL(SUB);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "GET",
        headers: { "User-Agent": ua, Accept: "*/*" },
        timeout: 20000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode, body });
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    req.end();
  });
}

function runRequestScript() {
  const src = fs.readFileSync(
    path.join(__dirname, "SubCacheFallback.js"),
    "utf8"
  );
  let doneArg;
  const logs = [];
  const sandbox = {
    console: { log: (...a) => logs.push(a.join(" ")) },
    $request: {
      url: SUB,
      headers: { "User-Agent": LOON, Accept: "*/*" },
    },
    // 无 $response → 走请求分支
    $prefs: {
      setValueForKey: () => true,
      valueForKey: () => null,
    },
    $notify: () => {},
    $done: (arg) => {
      doneArg = arg;
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { timeout: 3000 });
  return { doneArg, logs };
}

async function main() {
  console.log("=== 在线实测 UA ===");
  const a = await fetchUA(LOON);
  console.log("Loon UA  →", a.status, a.body.slice(0, 60));
  const b = await fetchUA(SAFARI);
  console.log("Safari UA→", b.status, "len=" + b.body.length, b.body.slice(0, 40));

  if (a.status !== 403 || a.body.indexOf("device_limit") < 0) {
    console.error("预期 Loon→403 device_limit");
    process.exit(1);
  }
  if (b.status !== 200 || b.body.indexOf("proxies:") < 0) {
    console.error("预期 Safari→200 YAML");
    process.exit(1);
  }

  console.log("\n=== 脚本请求阶段改 UA ===");
  const { doneArg, logs } = runRequestScript();
  console.log(logs.filter((l) => /UA:|phase=request/.test(l)).join("\n"));
  const newUA =
    doneArg &&
    doneArg.headers &&
    (doneArg.headers["User-Agent"] || doneArg.headers["user-agent"]);
  if (!newUA || newUA.indexOf("Safari") < 0) {
    console.error("脚本未改成 Safari UA", doneArg);
    process.exit(1);
  }
  console.log("改写后 UA 含 Safari ✓");

  // 用脚本产出的 UA 再请求一次，确认 200
  const c = await fetchUA(newUA);
  console.log("脚本 UA 实请求 →", c.status, "len=" + (c.body && c.body.length));
  if (c.status !== 200) {
    console.error("脚本 UA 未能拿到 200");
    process.exit(1);
  }
  console.log("\n全部通过：403 可通过 Safari UA 修复。");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
