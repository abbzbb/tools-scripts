/**
 * 本地模拟 Quantumult X 运行环境测试 sub-mitm.js
 * 用法: node sub-mitm/quantumultx/test-sub-mitm.js
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SCRIPT_PATH = path.join(ROOT, "sub-mitm.js");
const FIX_OK = path.join(ROOT, "fixtures", "sample-200.yaml");
const FIX_403 = path.join(ROOT, "fixtures", "sample-403.txt");

function createPrefs() {
  const store = new Map();
  return {
    setValueForKey(value, key) {
      store.set(String(key), value == null ? "" : String(value));
      return true;
    },
    valueForKey(key) {
      return store.has(String(key)) ? store.get(String(key)) : null;
    },
  };
}

function runScript({ url, statusCode, body, prefs, scriptSource, configPatch }) {
  let doneArg;
  let doneCalled = false;
  const logs = [];
  const notifies = [];
  let source = scriptSource;

  if (configPatch) {
    for (const [k, v] of Object.entries(configPatch)) {
      const re = new RegExp(`(${k}\\s*:\\s*)([^,\\n]+)`, "m");
      if (!re.test(source)) throw new Error("configPatch key not found: " + k);
      const lit =
        typeof v === "string"
          ? JSON.stringify(v)
          : Array.isArray(v)
            ? JSON.stringify(v)
            : String(v);
      source = source.replace(re, `$1${lit}`);
    }
  }

  const sandbox = {
    console: { log: (...args) => logs.push(args.map(String).join(" ")) },
    $request: { scheme: "https", method: "GET", url, headers: {} },
    $response: {
      statusCode,
      headers: {
        "Content-Type":
          statusCode === 200 ? "text/yaml; charset=utf-8" : "text/plain; charset=utf-8",
      },
      body,
    },
    $prefs: prefs,
    $notify: (title, subtitle, message) => {
      notifies.push({ title, subtitle, message });
    },
    $done: (arg) => {
      doneCalled = true;
      doneArg = arg;
    },
    setTimeout,
  };

  vm.createContext(sandbox);
  try {
    vm.runInContext(source, sandbox, { filename: "sub-mitm.js", timeout: 5000 });
  } catch (e) {
    return { error: e, doneArg, doneCalled, logs, notifies, prefs };
  }
  return { error: null, doneArg, doneCalled, logs, notifies, prefs };
}

function countProxyNames(body) {
  if (!body) return 0;
  const m = body.match(/^\s*-\s*name:\s*.+$/gm);
  return m ? m.length : 0;
}

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT: " + msg);
}

function main() {
  const scriptSource = fs.readFileSync(SCRIPT_PATH, "utf8");
  const okBody = fs.readFileSync(FIX_OK, "utf8");
  const failBody = fs.readFileSync(FIX_403, "utf8");
  const url = "https://star.wag1719.top/u/demo-token?client=loon";
  const total = countProxyNames(okBody);

  console.log("QX 模拟测试 (fixtures), proxies≈", total);

  let passed = 0;
  let failed = 0;
  function test(name, fn) {
    try {
      fn();
      passed += 1;
      console.log("  ✅ PASS:", name);
    } catch (e) {
      failed += 1;
      console.log("  ❌ FAIL:", name, e.message);
    }
  }

  const prefs1 = createPrefs();
  let r1;

  test("200 成功", () => {
    r1 = runScript({
      url,
      statusCode: 200,
      body: okBody,
      prefs: prefs1,
      scriptSource,
    });
    assert(!r1.error, String(r1.error));
    assert(r1.doneCalled, "$done");
    assert(r1.logs.some((l) => /env=QuanX/.test(l)), "env");
    assert(r1.logs.some((l) => l.indexOf("节点数=" + total) >= 0), "count");
    assert(prefs1.valueForKey("sub_cache_star_wag1719"), "cache");
  });

  test("403 回退", () => {
    const r2 = runScript({
      url,
      statusCode: 403,
      body: failBody,
      prefs: prefs1,
      scriptSource,
    });
    assert(r2.doneArg && /200/.test(r2.doneArg.status), JSON.stringify(r2.doneArg));
    assert(r2.doneArg.body && r2.doneArg.body.indexOf("proxies:") >= 0, "yaml");
  });

  test("无缓存 403", () => {
    const r3 = runScript({
      url,
      statusCode: 403,
      body: failBody,
      prefs: createPrefs(),
      scriptSource,
    });
    assert(Object.keys(r3.doneArg).length === 0, JSON.stringify(r3.doneArg));
  });

  test("rewrite 指向 raw", () => {
    const conf = fs.readFileSync(path.join(__dirname, "rewrite-snippet.conf"), "utf8");
    assert(/raw\.githubusercontent\.com\/abbzbb\/tools-scripts/.test(conf), "raw");
  });

  console.log("通过:", passed, "失败:", failed);
  process.exit(failed ? 1 : 0);
}

main();
