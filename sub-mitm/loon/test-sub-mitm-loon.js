/**
 * 模拟 Loon 环境测试 sub-mitm.js
 * 用法: node sub-mitm/loon/test-sub-mitm-loon.js
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SCRIPT_PATH = path.join(ROOT, "sub-mitm.js");
const FIX_OK = path.join(ROOT, "fixtures", "sample-200.yaml");
const FIX_403 = path.join(ROOT, "fixtures", "sample-403.txt");

function createPersistentStore() {
  const store = new Map();
  return {
    write(value, key) {
      store.set(String(key), value == null ? "" : String(value));
      return true;
    },
    read(key) {
      return store.has(String(key)) ? store.get(String(key)) : null;
    },
  };
}

function runLoonScript({ url, status, body, store, scriptSource, configPatch }) {
  let doneArg;
  let doneCalled = false;
  const logs = [];
  const notifies = [];
  let source = scriptSource;

  if (configPatch) {
    for (const [k, v] of Object.entries(configPatch)) {
      const re = new RegExp(`(${k}\\s*:\\s*)([^,\\n]+)`, "m");
      if (!re.test(source)) throw new Error("config key missing: " + k);
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
    console: { log: (...a) => logs.push(a.map(String).join(" ")) },
    $loon: "2.1.0",
    $request: { url, method: "GET" },
    $response: {
      status,
      headers: {
        "Content-Type":
          status === 200 ? "text/yaml; charset=utf-8" : "text/plain; charset=utf-8",
      },
      body,
    },
    $persistentStore: store,
    $notification: {
      post: (t, s, m) => notifies.push({ title: t, subtitle: s, message: m }),
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
    return { error: e, doneArg, doneCalled, logs, notifies };
  }
  return { error: null, doneArg, doneCalled, logs, notifies };
}

function countNames(body) {
  const m = body && body.match(/^\s*-\s*name:\s*.+$/gm);
  return m ? m.length : 0;
}

function assert(c, msg) {
  if (!c) throw new Error(msg);
}

function main() {
  const src = fs.readFileSync(SCRIPT_PATH, "utf8");
  const okBody = fs.readFileSync(FIX_OK, "utf8");
  const failBody = fs.readFileSync(FIX_403, "utf8");
  const url = "https://star.wag1719.top/u/demo-token?client=loon";
  const total = countNames(okBody);

  console.log("Loon 模拟测试 (fixtures)");
  console.log("  proxies≈", total);

  let pass = 0;
  let failN = 0;
  function test(name, fn) {
    try {
      fn();
      pass++;
      console.log("  ✅", name);
    } catch (e) {
      failN++;
      console.log("  ❌", name, "→", e.message);
    }
  }

  const store = createPersistentStore();
  let r1;

  test("200 运行", () => {
    r1 = runLoonScript({
      url,
      status: 200,
      body: okBody,
      store,
      scriptSource: src,
    });
    assert(!r1.error, String(r1.error));
    assert(r1.doneCalled, "$done");
  });
  test("env=Loon", () => {
    assert(r1.logs.some((l) => /env=Loon/.test(l)), r1.logs.join(" | "));
  });
  test("节点统计", () => {
    assert(r1.logs.some((l) => l.indexOf("节点数=" + total) >= 0), r1.logs.join(" | "));
  });
  test("缓存", () => {
    assert(store.read("sub_cache_star_wag1719"), "no cache");
  });
  test("403 回退", () => {
    const r2 = runLoonScript({
      url,
      status: 403,
      body: failBody,
      store,
      scriptSource: src,
    });
    assert(r2.doneArg && r2.doneArg.response && r2.doneArg.response.status === 200, JSON.stringify(r2.doneArg));
  });
  test("过滤", () => {
    const r4 = runLoonScript({
      url,
      status: 200,
      body: okBody,
      store: createPersistentStore(),
      scriptSource: src,
      configPatch: { enableFilter: true },
    });
    assert(r4.doneArg.body, "body");
    const after = countNames(r4.doneArg.body);
    assert(after > 0 && after < total, "after=" + after);
  });
  test("plugin 字段", () => {
    const p = fs.readFileSync(path.join(__dirname, "sub-mitm.plugin"), "utf8");
    assert(/requires-body\s*=\s*true/.test(p), "requires-body");
    assert(/raw\.githubusercontent\.com\/abbzbb\/tools-scripts/.test(p), "raw url");
  });

  console.log("通过", pass, "失败", failN);
  process.exit(failN ? 1 : 0);
}

main();
