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
const { analyseWord, computeStats, computePlan, tokenize, PRESETS, ALL_SKILL_IDS,
        inflect, detectInflection, suggestFor } = engine;

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
   8. SHORTEST-PATH PLANS — greedy multi-skill mini-plan (roadmap #4).
   computePlan returns the ordered skill set that turns every amber word
   green; the runner checks the exact order AND that the plan unlocks all.
   ============================================================ */
freshKnown();
const noneTaught = new Set();
for (const c of C.PLANS) {
  const got = computePlan(c.missing, noneTaught, ALL_SKILL_IDS);
  const orderedMatch = got.length === c.plan.length && got.every((s, i) => s === c.plan[i]);
  check(
    `PLAN       ${JSON.stringify(c.missing)}`,
    orderedMatch,
    `expected plan [${c.plan.join(", ")}] · got [${got.join(", ")}]`
  );
  // property: teaching the whole plan unlocks every listed word (100%)
  const planSet = new Set(got);
  const unlocksAll = c.missing.every((m) => m.every((s) => planSet.has(s)));
  check(`PLAN 100%  ${JSON.stringify(c.missing)}`, unlocksAll, `plan [${got.join(", ")}] leaves a word blocked`);
}

/* engine-grounded: derive the sample passage's amber words with the REAL
   analyseWord, plan them, and confirm teaching the plan makes the whole
   passage 100% decodable — nothing invented, no disagreement with the score. */
{
  const base = taughtFor("uk-early");
  const missing = [];
  const seen = new Set();
  for (const tok of tokenize(C.PASSAGE.text)) {
    if (!/^[A-Za-z']+$/.test(tok)) continue;
    const r = analyseWord(tok, base);
    if (r.cat === "new" && !seen.has(tok.toLowerCase())) {
      seen.add(tok.toLowerCase());
      missing.push(r.missing);
    }
  }
  const plan = computePlan(missing, base, ALL_SKILL_IDS);
  check(`PLAN passage order`, plan.join(",") === "team,diph,rctrl", `expected team,diph,rctrl · got ${plan.join(",")}`);
  const s = computeStats(C.PASSAGE.text, new Set([...base, ...plan]));
  check(`PLAN passage ->100%`, s.pct === 100 && s.nw === 0, `expected 100% nw=0 · got ${s.pct}% nw=${s.nw}`);
}

/* ============================================================
   9. INFLECTION SPELLING — inflect() spells regular endings correctly,
   returns null where no reliable rule applies (roadmap #3). Exact strings.
   ============================================================ */
freshKnown();
for (const [base, ending, want] of C.INFLECT) {
  const got = inflect(base, ending);
  check(
    `INFLECT    "${base}" + -${ending}`,
    got === want,
    `expected ${JSON.stringify(want)} · got ${JSON.stringify(got)}`
  );
}

/* ============================================================
   10. INFLECTION DETECT — recover {base, ending} for a bank inflection,
   null for a non-inflection. Guards suggestFor's base recovery.
   ============================================================ */
freshKnown();
for (const [word, base, ending] of C.INFLECTION_DETECT) {
  const inf = detectInflection(word);
  const ok = base === null ? inf === null : inf && inf.base === base && inf.ending === ending;
  check(
    `DETECT     "${word}"`,
    ok,
    `expected ${base === null ? "null" : base + " -" + ending} · got ${inf ? inf.base + " -" + inf.ending : "null"}`
  );
}

/* ============================================================
   11. FIX-IT SUGGESTIONS — inflection-aware swaps (roadmap #3).
   Exact ordered list AND the safety property: every offered form is
   decodable for that preset (suggestFor never offers an amber swap).
   ============================================================ */
freshKnown();
for (const c of C.SUGGEST) {
  const taughtSet = taughtFor(c.preset);
  engine.setTaught(taughtSet);
  const got = suggestFor(c.word);
  const exact = got.length === c.want.length && got.every((s, i) => s === c.want[i]);
  check(
    `SUGGEST    "${c.word}" @ ${c.preset}`,
    exact,
    `expected [${c.want.join(", ")}] · got [${got.join(", ")}]`
  );
  // property: nothing offered that the group can't actually decode
  for (const form of got) {
    const r = analyseWord(form, taughtSet);
    check(
      `SUGGEST ok "${form}" (for "${c.word}" @ ${c.preset})`,
      r.cat === "ok" || r.cat === "tricky",
      `offered "${form}" but it is ${r.cat} for ${c.preset}`
    );
  }
}
engine.setTaught(taughtFor("uk-early"));

/* ============================================================
   12. SILENT-E INFLECTIONS — an inflected form needs exactly what its
   base needs, plus `endings`. The -ed/-ing spelling drops a silent e
   (make -> making) or turns y to i (cry -> cried); the engine must see
   through it, or making/hoped/cried score as short-vowel CVC (a false
   green). The NOT list guards the look-alikes that must NOT gain one.
   ============================================================ */
freshKnown();
for (const [form, base] of C.SILENT_E) {
  const f = analyseWord(form, ALL), b = analyseWord(base, ALL);
  const want = [...new Set([...(b.need || []), "endings"])];
  check(
    `SILENT-E   "${form}" = "${base}" + ending`,
    f.cat === "ok" && eqSet(f.need, want),
    `expected need=${show(want)} · got ${f.cat} need=${show(f.need || [])}`
  );
}
for (const [form, need] of C.NOT_SILENT_E) {
  const r = analyseWord(form, ALL);
  check(
    `NO-SILENT-E "${form}"`,
    r.cat === "ok" && eqSet(r.need, need),
    `expected need=${show(need)} · got ${r.cat} need=${show(r.need || [])}`
  );
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
