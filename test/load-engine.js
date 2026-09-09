"use strict";
/* ============================================================
   load-engine.js — run the REAL Decodable Check engine in Node.

   The whole app is one self-contained index.html. Rather than copy
   analyseWord() (which would silently drift from what ships), this
   loader reads index.html, pulls out its single <script> block, and
   evaluates it in a vm sandbox behind a tiny universal-DOM stub.

   The app's own test hook (a browser-inert `module.exports` block at
   the end of the script) then hands back the real engine functions
   plus setters for the module-level `known` / `taught` state, so the
   corpus exercises exactly the code a teacher runs.

   No dependencies — Node's built-in fs / path / vm only.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const INDEX = path.join(__dirname, "..", "index.html");

/* --- pull the script body out of index.html --- */
function extractScript(html) {
  // the engine + UI live in the last <script> ... </script> block
  const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  if (!matches.length) throw new Error("No <script> block found in index.html");
  return matches[matches.length - 1][1];
}

/* --- a resilient, no-op DOM element ---
   Every unknown property read returns another chainable stub and every
   method is a no-op, so the app's load-time UI wiring runs without
   throwing and stays working even as future nights add DOM code. Only
   the pure engine is actually exercised by the corpus. */
const noop = () => {};
function makeEl() {
  const store = {
    dataset: {},
    style: {},
    classList: { add: noop, remove: noop, contains: () => false, toggle: noop },
  };
  return new Proxy(store, {
    get(t, k) {
      if (k in t) return t[k];
      switch (k) {
        case "appendChild":
        case "removeChild":
        case "insertBefore":
          return (x) => x;
        case "querySelector":
        case "cloneNode":
          return () => makeEl();
        case "querySelectorAll":
          return () => [];
        case "getAttribute":
          return () => null;
        case "getBoundingClientRect":
          return () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });
        case "value":
        case "textContent":
        case "innerHTML":
          return "";
        case "checked":
        case "hidden":
          return false;
        case "files":
          return [];
        case "offsetWidth":
        case "offsetHeight":
          return 0;
        case "parentNode":
        case "firstChild":
          return null;
        default:
          // methods (addEventListener, setAttribute, focus, click, remove…)
          // and event-handler slots all resolve to harmless no-ops
          return noop;
      }
    },
    set(t, k, v) {
      t[k] = v;
      return true;
    },
  });
}

function makeDocument() {
  const body = makeEl();
  const documentElement = makeEl();
  return {
    getElementById: () => makeEl(),
    createElement: () => makeEl(),
    createTextNode: () => makeEl(),
    createDocumentFragment: () => makeEl(),
    querySelector: () => makeEl(),
    querySelectorAll: () => [],
    addEventListener: noop,
    removeEventListener: noop,
    body,
    documentElement,
  };
}

function loadEngine() {
  const html = fs.readFileSync(INDEX, "utf8");
  const src = extractScript(html);

  const moduleObj = { exports: {} };
  const sandbox = {
    module: moduleObj,
    document: makeDocument(),
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
    location: { origin: "", pathname: "", hash: "" },
    history: { replaceState: noop },
    navigator: {},
    requestAnimationFrame: (cb) => cb && cb(),
    setTimeout: (cb) => cb, // never actually schedule in tests
    clearTimeout: noop,
    innerWidth: 1000,
    confirm: () => true,
    alert: noop,
    print: noop,
    btoa: (s) => Buffer.from(s, "binary").toString("base64"),
    atob: (s) => Buffer.from(s, "base64").toString("binary"),
    escape,
    unescape,
    encodeURIComponent,
    decodeURIComponent,
    console,
    Date,
    Math,
    JSON,
    Set,
    Map,
    RegExp,
    Array,
    Object,
    Number,
    String,
    Boolean,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.addEventListener = noop;

  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: "index.html#script" });

  const engine = moduleObj.exports;
  if (!engine || typeof engine.analyseWord !== "function") {
    throw new Error("Engine export hook missing — did index.html's test hook change?");
  }
  return engine;
}

module.exports = { loadEngine };
