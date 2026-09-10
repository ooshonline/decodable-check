#!/usr/bin/env node
"use strict";
/* ============================================================
   engine.test.js — run the corpus against the REAL engine.

   Usage:   node test/engine.test.js        (or: npm test)

   Loads analyseWord / computeStats straight out of index.html (no
   copy — see load-engine.js) and checks every corpus entry. Hard
   assertions fail the build on a regression; known limitations are
   reported separately and only warn if their behaviour changes.

   Zero dependencies — Node's built-ins only.
   ============================================================ */
const { loadEngine } = require("./load-engine.js");
const C = require("./corpus.js");

const engine = loadEngine();
const { analyseWord, computeStats, PRESETS } = engine;

/* --- tiny assert harness --- */
let pass = 0;
const failures = [];
function check(label, cond, detail) {
  if (cond) { pass++; }
  else { failures.push(detail ? `${label}\n      ${detail}` : label); }
}
const sorted = (a) => [...a].sort();
const eqSet = (a, b) => {
  const x = sorted(a), y = sorted(b);
  return x.length === y.length && x.every((v, i) => v === y[i]);
};
const show = (a) => `[${sorted(a).join(", ")}]`;

/* resolve a preset id (or the pseudo-preset "cvc") to a taught Set */
function taughtFor(id) {
  if (id === "cvc") return new Set(C.CVC_PRESET);
  const p = PRESETS.find((x) => x.id === id);
  if (!p || !p.skills) throw new Error(`Unknown preset in corpus: ${id}`);
  return new Set(p.skills);
}

const ALL = new Set(C.ALL);
function freshKnown() { engine.setKnown(new Set()); }

/* ============================================================
   1. DECODABLE — segmentation (need sets), everything taught -> ok
   ============================================================ */
freshKnown();
for (const [word, need] of C.DECODABLE) {
  const r = analyseWord(word, ALL);
  check(
    `DECODABLE  "${word}"`,
    r.cat === "ok" && eqSet(r.need, need),
    `expected ok need=${show(need)} · got ${r.cat} need=${show(r.need || [])}`
  );
}

/* ============================================================
   2. NEEDS-SKILL — new under a preset, blocked by exact skills
   ============================================================ */
freshKnown();
for (const [word, preset, missing] of C.NEEDS_SKILL) {
  const r = analyseWord(word, taughtFor(preset));
  check(
    `NEEDS-SKILL "${word}" @ ${preset}`,
    r.cat === "new" && eqSet(r.missing, missing),
    `expected new missing=${show(missing)} · got ${r.cat} missing=${show(r.missing || [])}`
  );
}

/* ============================================================
   3. DECODABLE UNDER A LIMITED SET — positive cases stay ok
   ============================================================ */
freshKnown();
for (const [word, preset] of C.DECODABLE_UNDER) {
  const r = analyseWord(word, taughtFor(preset));
  check(
    `OK-UNDER   "${word}" @ ${preset}`,
    r.cat === "ok",
    `expected ok · got ${r.cat} missing=${show(r.missing || [])}`
  );
}

/* ============================================================
   4. HEART / TRICKY WORDS
   ============================================================ */
freshKnown();
for (const word of C.HEART) {
  const r = analyseWord(word, ALL);
  check(`HEART      "${word}"`, r.cat === "tricky", `expected tricky · got ${r.cat}`);
}

/* ============================================================
   5. KNOWN WORDS — set aside by the teacher (case-insensitive)
   ============================================================ */
for (const group of C.KNOWN) {
  engine.setKnown(new Set(group.set));
  for (const [word, expect] of group.probes) {
    const r = analyseWord(word, taughtFor("uk-early"));
    check(
      `KNOWN      "${word}" (known=${group.set.join(",")})`,
      r.cat === expect,
      `expected ${expect} · got ${r.cat}`
    );
  }
}
freshKnown();

/* ============================================================
   6. SAMPLE PASSAGE — headline % and spot verdicts
   ============================================================ */
freshKnown();
for (const [preset, want] of C.PASSAGE.stats) {
  const s = computeStats(C.PASSAGE.text, taughtFor(preset));
  const ok = s.ok === want.ok && s.nw === want.nw && s.tr === want.tr && s.pct === want.pct;
  check(
    `PASSAGE    stats @ ${preset}`,
    ok,
    `expected ${JSON.stringify(want)} · got ${JSON.stringify({ ok: s.ok, nw: s.nw, tr: s.tr, pct: s.pct })}`
  );
}
for (const [preset, word, expect] of C.PASSAGE.spot) {
  const r = analyseWord(word, taughtFor(preset));
  check(`PASSAGE    "${word}" @ ${preset}`, r.cat === expect, `expected ${expect} · got ${r.cat}`);
}

/* ============================================================
   7. KNOWN LIMITATIONS — locked to current behaviour; changes warn
   ============================================================ */
freshKnown();
const limitationChanges = [];
for (const lim of C.KNOWN_LIMITATIONS) {
  const r = analyseWord(lim.word, ALL);
  const got = r.cat === "ok" ? (r.need || []) : null;
  if (got && eqSet(got, lim.now)) {
    pass++; // baseline unchanged
  } else {
    limitationChanges.push(
      `"${lim.word}" — was need=${show(lim.now)}, now ${r.cat === "ok" ? "need=" + show(got) : r.cat}` +
        `\n      want: ${lim.want}`
    );
  }
}

/* ============================================================
   report
   ============================================================ */
const line = "─".repeat(56);
console.log("\nDecodable Check — engine corpus");
console.log(line);
console.log(`  Hard assertions passed: ${pass}`);
console.log(`  Known limitations locked: ${C.KNOWN_LIMITATIONS.length - limitationChanges.length}/${C.KNOWN_LIMITATIONS.length}` +
  `  (roadmap #2 hardening targets)`);

if (limitationChanges.length) {
  console.log("\n  ⚠ Known-limitation behaviour CHANGED — review & promote to the");
  console.log("    DECODABLE corpus if this is the intended hardening fix:");
  for (const c of limitationChanges) console.log(`    • ${c}`);
}

if (failures.length) {
  console.log(`\n  ✗ ${failures.length} FAILED:`);
  for (const f of failures) console.log(`    ✗ ${f}`);
  console.log(line);
  console.log("  RESULT: FAIL\n");
  process.exit(1);
}

console.log(line);
console.log("  RESULT: PASS — engine matches the corpus\n");
process.exit(0);
