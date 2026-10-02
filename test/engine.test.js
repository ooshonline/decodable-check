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
        inflect, detectInflection, suggestFor, upgradeSkills, SKILLS_V } = engine;

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

/* resolve a preset id (or a pseudo-preset: "cvc", "cvc-syll", "alt-early") to a taught Set */
function taughtFor(id) {
  if (id === "cvc") return new Set(C.CVC_PRESET);
  if (id === "cvc-syll") return new Set(C.CVC_SYLL_PRESET);
  if (id === "alt-early") return new Set(C.ALT_EARLY_PRESET);
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
   13. SKILL-SET MIGRATION — sets saved before "Two-syllable words"
   (syll, v2) or "Alternative pronunciations" (alt, v3) existed must keep
   scoring the same: a legacy preset maps to
   its current list; a legacy custom set gains syll iff it taught
   blends (VC|CV words used to need blend); current sets are untouched.
   ============================================================ */
{
  const up = (ids, v) => sorted(upgradeSkills(ids, v));
  // v2 preset lists = today's minus `alt` (split out of `adv` in v3); v1 = v2 minus `syll`
  const v2 = (id) => PRESETS.find((p) => p.id === id).skills.filter((s) => s !== "alt");
  const legacy = (id) => v2(id).filter((s) => s !== "syll");
  for (const id of ["uk-early", "uk-y1", "sor-g1", "ufli-g1", "all", "sor-k"]) {
    // a v1 set lands on its v2 list, plus `alt` exactly when it taught `adv`
    const want = sorted(v2(id).includes("adv") ? [...v2(id), "alt"] : v2(id));
    check(`MIGRATE  legacy ${id} -> v3 ${id}`, eqSet(up(legacy(id), 1), want),
      `got ${show(up(legacy(id), 1))} want ${show(want)}`);
    check(`MIGRATE  v2 ${id} -> v3`, eqSet(up(v2(id), 2), want),
      `got ${show(up(v2(id), 2))} want ${show(want)}`);
  }
  // v3 (alt split): a set that taught `adv` gains `alt`; one without stays as is,
  // so every saved verdict is unchanged — soft c / kind / walk / gym / page all
  // needed `adv` before and need `alt` now.
  check("MIGRATE  v2 custom with adv gains alt",
    eqSet(up(["cvc", "adv"], 2), ["adv", "alt", "cvc"]));
  check("MIGRATE  v2 custom without adv unchanged",
    eqSet(up(["cvc", "blend", "syll", "team"], 2), ["blend", "cvc", "syll", "team"]));
  check("MIGRATE  v2 set already holding alt is not duplicated",
    up(["cvc", "adv", "alt"], 2).length === 3);
  for (const id of ["uk-early", "uk-y1", "sor-g1", "ufli-g1", "all", "sor-k"]) {
    for (const v of [1, 2]) {
      const before = v === 2 ? v2(id) : legacy(id);
      const after = new Set(upgradeSkills(before, v));
      for (const w of ["city", "page", "gym", "kind", "walk", "knot", "little", "cake"]) {
        // what the word needed under the pre-split engine: alt was part of adv
        const need = analyseWord(w, new Set(C.ALL)).need.map((s) => (s === "alt" ? "adv" : s));
        const wasOk = need.every((s) => s === "cvc" || (s === "syll" && v === 1 && before.includes("blend")) || before.includes(s));
        check(`MIGRATE  v${v} ${id} keeps "${w}" verdict`, (analyseWord(w, after).cat === "ok") === wasOk);
      }
    }
  }
  check("MIGRATE  sor-k stays without syll", !upgradeSkills(legacy("sor-k"), 1).includes("syll"));
  check("MIGRATE  legacy custom with blend gains syll",
    eqSet(up(["cvc", "blend", "team"], undefined), ["blend", "cvc", "syll", "team"]));
  check("MIGRATE  legacy custom without blend unchanged",
    eqSet(up(["cvc", "double"], 1), ["cvc", "double"]));
  check("MIGRATE  current-version set is never touched",
    eqSet(up(["cvc", "blend"], SKILLS_V), ["blend", "cvc"]));
  // the point of the migration: a legacy set's verdict on a VC|CV word is unchanged
  const oldUkEarly = new Set(upgradeSkills(legacy("uk-early"), 1));
  check("MIGRATE  legacy uk-early still reads sunset", analyseWord("sunset", oldUkEarly).cat === "ok");
}

/* ============================================================
   14. PASSAGE MAKER — every made passage is provably decodable
   (roadmap #7). For every preset × heart words on/off × every focus
   skill × every length, generate many passages from a seeded RNG and
   assert each one re-scores at 100% with nothing amber, has the asked-
   for number of sentences, uses only the allowed heart words (none when
   switched off), and spells a/an correctly. A single non-decodable word
   in a "decodable" passage is the worst bug this tool could ship.
   ============================================================ */
{
  const { makePassage, makerPools, makerNames, MAKER_BANK, MAKER_HEART, MAKER_LENGTHS } = engine;
  // mulberry32 — deterministic, so a failure is reproducible
  const seeded = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const words = (t) => tokenize(t).filter((x) => /^[A-Za-z']+$/.test(x));
  const sentenceCount = (t) => (t.match(/[.!?]"?(?=\s|$)/g) || []).length;

  // the bank itself: every word reads as decodable with everything taught
  freshKnown();
  for (const [role, list] of Object.entries(MAKER_BANK)) {
    for (const w of list) {
      const r = analyseWord(w, ALL);
      check(`MAKER bank ${role} "${w}"`, r.cat === "ok", `bank word is ${r.cat} under ALL`);
    }
  }

  let made = 0, seed = 1;
  const PER = 3;
  for (const p of PRESETS.filter((x) => x.skills)) {
    const taughtSet = new Set(p.skills);
    const focuses = ["", ...p.skills.filter((s) => s !== "cvc")];
    for (const heart of [true, false]) {
      for (const focus of focuses) {
        for (const [len, n] of Object.entries(MAKER_LENGTHS)) {
          for (let k = 0; k < PER; k++) {
            freshKnown();
            const res = makePassage({ taught: taughtSet, focus, sentences: n, heart,
                                      names: makerNames(new Set()), rng: seeded(seed++) });
            const tag = `MAKER ${p.id} heart=${heart} focus=${focus || "-"} ${len} #${k}`;
            check(`${tag} made`, res.ok, res.reason);
            if (!res.ok) continue;
            made++;
            const st = computeStats(res.text, taughtSet);
            check(`${tag} 100%`, st.pct === 100 && st.nw === 0 && st.ok > 0,
              `scored ${st.pct}% nw=${st.nw}: ${JSON.stringify(res.text)}`);
            check(`${tag} sentences`, sentenceCount(res.text) === n,
              `wanted ${n}, got ${sentenceCount(res.text)}: ${JSON.stringify(res.text)}`);
            const hearts = words(res.text).filter((w) => analyseWord(w, taughtSet).cat === "tricky");
            check(`${tag} heart words`,
              heart ? hearts.every((w) => MAKER_HEART.has(w.toLowerCase())) : hearts.length === 0,
              `heart words used: ${hearts.join(", ")}`);
            check(`${tag} a/an`, !/\ba [aeiou]|\ban [^aeiou\s]/i.test(res.text), JSON.stringify(res.text));
            check(`${tag} no leftover slot`, !/[{}]/.test(res.text), JSON.stringify(res.text));
          }
        }
      }
    }
  }
  check(`MAKER generated passages`, made > 600, `only ${made} passages made`);

  // Known words become the characters — set aside as known, still 100%
  engine.setKnown(new Set(["zara", "ravi"]));
  const names = makerNames(engine.getKnown());
  check("MAKER names from Known words", eqSet(names, ["Zara", "Ravi"]), `got ${names.join(", ")}`);
  for (let k = 0; k < 20; k++) {
    const res = makePassage({ taught: taughtFor("sor-k"), sentences: 5, names, rng: seeded(900 + k) });
    const st = res.ok && computeStats(res.text, taughtFor("sor-k"));
    check(`MAKER known-name passage #${k}`, res.ok && st.pct === 100 && st.nw === 0 &&
      !/\b(Sam|Meg|Tom|Pip|Ben|Kit)\b/.test(res.text), JSON.stringify(res.text));
  }
  // one known name is topped up so "X and Y" never pairs a name with itself;
  // heart / bank words marked known are not treated as names
  engine.setKnown(new Set(["zara", "said", "cat"]));
  const topped = makerNames(engine.getKnown());
  check("MAKER one known name topped up", topped.length === 2 && topped[0] === "Zara" && topped[1] === "Sam",
    `got ${topped.join(", ")}`);
  freshKnown();

  // focus: a well-stocked skill reaches the ~40% target
  for (const [preset, focus] of [["uk-early", "digraph"], ["uk-y1", "magice"], ["uk-y1", "team"], ["all", "rctrl"]]) {
    let met = 0;
    for (let k = 0; k < 10; k++) {
      const res = makePassage({ taught: taughtFor(preset), focus, sentences: 5, rng: seeded(500 + k) });
      if (res.ok && res.focusMet && res.focusPct >= 40) met++;
    }
    check(`MAKER focus ${focus} @ ${preset} reaches 40%`, met >= 9, `only ${met}/10 met the target`);
  }

  // guard rails: nothing taught -> a clear refusal, never a passage
  const none = makePassage({ taught: new Set(), sentences: 5, rng: seeded(7) });
  check("MAKER refuses without CVC", !none.ok && /CVC/.test(none.reason), JSON.stringify(none));
  // the pools only ever hold words that pass the engine for that set
  const pools = makerPools(taughtFor("sor-k"), true, []);
  const leak = ["thing", "animal", "place", "adj", "verb", "things", "verbs"].flatMap((k) => pools[k])
    .filter((w) => analyseWord(w, taughtFor("sor-k")).cat !== "ok");
  check("MAKER pools are engine-verified", leak.length === 0, `leaked: ${leak.join(", ")}`);
}

let disagreeFn = null;   // section 15's agreement validator, reused by section 17
/* ============================================================
   15. PASSAGE MAKER, stage 2 — themes and sentences that make sense.
   Every themed passage is still 100% (same gate as section 14), a theme
   that can't be filled refuses clearly instead of drifting off-theme,
   and the words in each sentence agree: an adjective suits its noun
   (never a green cat), an animal only does its own verbs, a verb only
   happens "in the ___" where it can, names never bark or chirp, clouds
   and gates are never owned, bugs are never fed.
   ============================================================ */
{
  const { makePassage, makerNames, makerThemeReady, MAKER_THEMES, MAKER_BANK,
          MK_THING, MK_ANIMAL, MK_PLACE, MK_VERB, inflect } = engine;
  const seeded = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // surface form -> lexicon entry (singular and plural nouns, base and -s verbs)
  const noun = new Map(), verb = new Map();
  for (const [w, e] of MK_THING) { noun.set(w, { ...e, animal: false }); noun.set(inflect(w, "s"), { ...e, animal: false }); }
  for (const [w, e] of MK_ANIMAL) { noun.set(w, { ...e, animal: true }); noun.set(inflect(w, "s"), { ...e, animal: true }); }
  for (const [w, e] of MK_VERB) { verb.set(w, e); verb.set(inflect(w, "s"), e); }
  const adjs = new Set(MAKER_BANK.adj);
  const at = (list, pl) => list.includes(MK_PLACE.get(pl).kind) || list.includes(pl);
  const names = new Set(["Sam", "Meg", "Tom", "Pip", "Ben", "Kit"]);

  // returns a list of agreement problems in one made passage
  const disagreements = (text) => {
    const bad = [];
    for (const sent of text.split(/(?<=[.!?]"?)\s+/)) {
      const w = sent.replace(/[^A-Za-z' ]/g, " ").split(/\s+/).filter(Boolean);
      const lw = w.map((x) => x.toLowerCase());
      lw.forEach((x, i) => {
        const nx = lw[i + 1];
        // adjective + noun
        if (adjs.has(x) && noun.has(nx) && !noun.get(nx).adj.includes(x)) bad.push(`"${x} ${nx}"`);
        // animal + (can) verb
        if (noun.has(x) && noun.get(x).animal) {
          const v = nx === "can" ? lw[i + 2] : nx;
          if (verb.has(v) && !noun.get(x).verbs.includes(verb.get(v).w)) bad.push(`"${x} ${v}"`);
        }
        // a name never does an animals-only verb
        if (names.has(w[i]) && verb.has(nx) && !verb.get(nx).people) bad.push(`"${w[i]} ${nx}"`);
        // "<verb> in the <place>" happens where the verb can
        if (verb.has(x) && nx === "in" && lw[i + 2] === "the" && MK_PLACE.has(lw[i + 3])
            && !at(verb.get(x).where, lw[i + 3])) bad.push(`"${x} in the ${lw[i + 3]}"`);
        if (x === "in" && nx === "the" && MK_PLACE.get(lw[i + 2])?.noIn) bad.push(`"in the ${lw[i + 2]}"`);
      });
      // "The X is Y." / "Is the X Y?" / "My X is Y."
      const m = sent.match(/^(?:The|My) (\w+) is (\w+)[.!?]$/) || sent.match(/^Is the (\w+) (\w+)\?$/);
      if (m) {
        const [, n, a] = m;
        // (tent is both a thing and a place — either reading may license it)
        const ok = (noun.has(n) && noun.get(n).adj.includes(a)) || (MK_PLACE.has(n) && MK_PLACE.get(n).adj.includes(a));
        if ((noun.has(n) || MK_PLACE.has(n)) && !ok) bad.push(`"${n} is ${a}"`);
      }
      // "A X is in the P." — the animal lives there
      const h = sent.match(/^An? (\w+) is in the (\w+)\./);
      if (h && noun.has(h[1]) && !at(noun.get(h[1]).where, h[2])) bad.push(`"${h[1]} in the ${h[2]}"`);
      // an animal subject + verb + place: it can be there
      const av = sent.match(/^The (\w+) (\w+) in the (\w+)\./);
      if (av && noun.has(av[1]) && noun.get(av[1]).animal && !at(noun.get(av[1]).where, av[3])) bad.push(`"${av[1]} … ${av[3]}"`);
      for (const x of lw) {
        if (noun.has(x) && noun.get(x).noOwn && /\b(has|got|had|my)\b/i.test(sent)) bad.push(`owns "${x}"`);
        if (noun.has(x) && noun.get(x).noFeed && /\bfed\b/.test(sent)) bad.push(`fed "${x}"`);
      }
    }
    return bad;
  };

  disagreeFn = disagreements;
  // the validator itself catches the nonsense stage 1 could make
  for (const t of ["Sam has a green cat.", "The dog chirps.", "Meg barks.", "Tom swims in the shed.",
                   "The hat is sad.", "Sam got ten clouds.", "Kit fed six bugs.", "We can dig in the farm.",
                   "A crab is in the barn.", "The sea is sunny."]) {
    check(`AGREE validator flags ${JSON.stringify(t)}`, disagreements(t).length > 0, "not flagged");
  }
  check("AGREE validator passes a good sentence",
    disagreements("The pink pig digs in the mud. Sam fed the duck. The pond is deep.").length === 0,
    disagreements("The pink pig digs in the mud. Sam fed the duck. The pond is deep.").join(", "));

  // every lexicon cross-reference points at a real entry
  for (const [w, e] of MK_ANIMAL) {
    for (const v of e.verbs) check(`LEX ${w} verb "${v}" exists`, MK_VERB.has(v), "unknown verb");
    for (const p of e.where) check(`LEX ${w} place "${p}" exists`, /^[A-Z]$/.test(p) || MK_PLACE.has(p), "unknown place");
  }
  for (const [w, e] of MK_VERB) for (const p of e.where)
    check(`LEX verb ${w} place "${p}" exists`, /^[A-Z]$/.test(p) || MK_PLACE.has(p), "unknown place");
  for (const t of MAKER_THEMES.filter((x) => x.id)) {
    const tagged = [...MK_THING.values(), ...MK_ANIMAL.values(), ...MK_PLACE.values()].filter((e) => e.themes.includes(t.tag));
    check(`LEX theme ${t.id} has 15+ words`, tagged.length >= 15, `only ${tagged.length}`);
  }

  let made = 0, refused = 0, seed = 5000;
  for (const p of PRESETS.filter((x) => x.skills)) {
    const taughtSet = new Set(p.skills);
    for (const th of MAKER_THEMES) {
      for (const heart of [true, false]) {
        const ready = makerThemeReady(taughtSet, heart, th.id);
        for (const n of [3, 5, 8]) {
          for (let k = 0; k < 3; k++) {
            freshKnown();
            const res = makePassage({ taught: taughtSet, theme: th.id, sentences: n, heart,
                                      names: makerNames(new Set()), rng: seeded(seed++) });
            const tag = `THEME ${p.id} ${th.id || "any"} heart=${heart} n=${n} #${k}`;
            check(`${tag} made iff ready`, res.ok === ready, res.ok ? "made but not ready" : res.reason);
            if (!res.ok) { refused++; check(`${tag} says why`, /try Any theme|tick a few more/.test(res.reason), res.reason); continue; }
            made++;
            const st = computeStats(res.text, taughtSet);
            check(`${tag} 100%`, st.pct === 100 && st.nw === 0 && st.ok > 0,
              `scored ${st.pct}% nw=${st.nw}: ${JSON.stringify(res.text)}`);
            const bad = disagreements(res.text);
            check(`${tag} words agree`, bad.length === 0, `${bad.join(", ")} in ${JSON.stringify(res.text)}`);
            // off-theme nouns never appear in a themed passage
            if (th.id) {
              const off = res.text.toLowerCase().match(/[a-z]+/g).filter((x) => {
                const e = noun.get(x) || MK_PLACE.get(x);
                return e && !e.themes.includes(th.tag) && !adjs.has(x) && !verb.has(x);
              });
              check(`${tag} on theme`, off.length === 0, `off-theme: ${off.join(", ")} in ${JSON.stringify(res.text)}`);
            }
          }
        }
      }
    }
  }
  check("THEME passages made", made > 400, `only ${made}`);
  // every theme works for a Year 1 group, heart words on or off
  for (const th of MAKER_THEMES)
    for (const heart of [true, false])
      check(`THEME ${th.id || "any"} ready @ uk-y1 heart=${heart}`, makerThemeReady(taughtFor("uk-y1"), heart, th.id), "not ready");
}

/* ============================================================
   16. PASSAGE MAKER, stage 3 — titles, pupil copies, saving.
   A made passage's title goes on the pupil copy, so it must be as
   decodable as the passage (no "the" when heart words are off, a name
   the passage actually uses). The pupil sheet's teacher footer reports
   the live score and the heart words to pre-teach. Library items keep
   the "made" marker through export/import, and junk markers are dropped.
   ============================================================ */
{
  const { makePassage, makerNames, pupilSheetHtml, sanitizeLibItem, MAKER_THEMES, MAKER_HEART } = engine;
  const seeded = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let seed = 9000, titled = 0, withNoun = 0, heartTitled = 0;
  for (const p of PRESETS.filter((x) => x.skills)) {
    const taughtSet = new Set(p.skills);
    for (const th of MAKER_THEMES) {
      for (const heart of [true, false]) {
        for (let k = 0; k < 3; k++) {
          freshKnown();
          const res = makePassage({ taught: taughtSet, theme: th.id, sentences: 5, heart,
                                    names: makerNames(new Set()), rng: seeded(seed++) });
          if (!res.ok) continue;
          const tag = `TITLE ${p.id} ${th.id || "any"} heart=${heart} #${k}`;
          check(`${tag} has a title`, typeof res.title === "string" && res.title.length > 0, JSON.stringify(res));
          titled++;
          if (heart) { heartTitled++; if (/(^The | and the )/.test(res.title)) withNoun++; }
          const st = computeStats(res.title, taughtSet);
          check(`${tag} title decodable`, st.pct === 100 && st.nw === 0,
            `${JSON.stringify(res.title)} scored ${st.pct}%`);
          const hearts = tokenize(res.title).filter((w) => /^[A-Za-z]+$/.test(w) && analyseWord(w, taughtSet).cat === "tricky");
          check(`${tag} title heart words`, heart ? hearts.every((w) => MAKER_HEART.has(w.toLowerCase())) : hearts.length === 0,
            `${JSON.stringify(res.title)} uses ${hearts.join(", ")}`);
          const lead = res.title.split(" ")[0];
          check(`${tag} title name is in the passage`, new RegExp(`\\b${lead}\\b`).test(res.text),
            `${lead} not in ${JSON.stringify(res.text)}`);
          const noun = (res.title.match(/ and the (\w+)$/) || [])[1];
          if (noun) check(`${tag} title noun is in the passage`, new RegExp(`\\b${noun.toLowerCase()}`).test(res.text.toLowerCase()),
            `${noun} not in ${JSON.stringify(res.text)}`);
        }
      }
    }
  }
  check("TITLE titles made", titled > 150, `only ${titled}`);
  // with heart words on ("the" allowed), most titles name an animal or thing
  check("TITLE most titles name an animal or thing", withNoun > heartTitled * 0.8, `${withNoun}/${heartTitled}`);

  // pupil sheet: title, lines, live score, heart words, escaping
  freshKnown();
  const ukE = taughtFor("uk-early");
  const sheet = pupilSheetHtml("The cat sat.\nSam said, \"Run!\"", "Sam and the Cat", ukE, "UK Reception");
  check("PUPIL sheet title", sheet.includes('<h1 class="ps-title">Sam and the Cat</h1>'), sheet);
  check("PUPIL sheet one <p> per line", (sheet.match(/<p>/g) || []).length === 2, sheet);
  check("PUPIL sheet escapes quotes", sheet.includes("&quot;Run!&quot;"), sheet);
  check("PUPIL sheet 100% footer", /100% decodable for UK Reception/.test(sheet), sheet);
  check("PUPIL sheet heart words", /pre-teach: the, said/.test(sheet), sheet);
  const amber = pupilSheetHtml("The goat can run.", "", ukE, "UK Reception");
  check("PUPIL sheet warns on amber", /1 word needs an untaught skill/.test(amber) && !/ps-title/.test(amber), amber);
  check("PUPIL sheet escapes html", !pupilSheetHtml("<b>hi</b>", "<i>x</i>", ukE, "S").includes("<b>hi"), "unescaped");

  // library items keep the made marker; junk markers are dropped
  const base = { text: "The cat sat.", skills: ["cvc"], title: "T", klass: "K" };
  check("LIB keeps made theme", sanitizeLibItem({ ...base, made: "seaside" }).made === "seaside", "dropped");
  check("LIB keeps made any", sanitizeLibItem({ ...base, made: "any" }).made === "any", "dropped");
  check("LIB drops junk made", !("made" in sanitizeLibItem({ ...base, made: "<script>" })), "kept junk");
  check("LIB no made on hand-typed", !("made" in sanitizeLibItem(base)), "made appeared");
}

/* ============================================================
   17. PASSAGE MAKER, stage 4 — custom themes.
   A teacher's theme = words ticked from the lexicon (strict 100% gate,
   full agreement) + words typed under Things / Animals / Places. Typed
   words go ONLY into the safe frames, never as plurals, and — Kyle's
   rule — are used even when not decodable yet: they're the only words
   allowed to be amber, and every one of them is reported in `flagged`.
   Themes survive storage and backup files through normCustomTheme.
   ============================================================ */
{
  const { makePassage, makerNames, makerThemeReady, normCustomTheme, customThemeSize, MAKER_SAFE_FRAMES,
          MK_THING, MK_ANIMAL, MK_PLACE, inflect, libraryPayload, importLibraryData, sanitizeLibItem,
          madeThemeLabel, getCustomThemes, setCustomThemes } = engine;
  const seeded = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const words = (thing, animal, place) => ({ thing, animal, place });
  const E = words([], [], []);

  // --- normalisation: the one gate for editor, storage and backups ---
  check("CUSTOM rejects non-objects", normCustomTheme(null) === null && normCustomTheme("x") === null, "accepted");
  check("CUSTOM rejects bad id", normCustomTheme({ id: "farm", name: "x" }) === null
    && normCustomTheme({ id: "my-<b>", name: "x" }) === null, "accepted");
  const n1 = normCustomTheme({ id: "my-abc", name: "  Mini   beasts ",
    words: words(["hat", "nope"], ["duck", "hat"], ["mud"]),
    own: words(["Twig", "hat", "a", "web!", "stick", "stick", 5, "x".repeat(21)], ["spider", "cat"], ["log"]) });
  check("CUSTOM name trimmed", n1.name === "Mini beasts", n1.name);
  check("CUSTOM ticked words must be lexicon words of that role",
    n1.words.thing.join() === "hat" && n1.words.animal.join() === "cat,duck", JSON.stringify(n1.words));
  check("CUSTOM typed lexicon word moves to ticked", n1.words.thing.includes("hat") && !n1.own.thing.includes("hat")
    && n1.words.animal.includes("cat") && !n1.own.animal.includes("cat"), JSON.stringify(n1));
  check("CUSTOM typed words lower-cased, junk dropped, deduped", n1.own.thing.join() === "stick,twig", n1.own.thing.join());
  check("CUSTOM size", customThemeSize(n1) === 1 + 2 + 1 + 2 + 1 + 1, String(customThemeSize(n1)));
  check("CUSTOM default name", normCustomTheme({ id: "my-z" }).name === "My theme", normCustomTheme({ id: "my-z" }).name);
  const many = normCustomTheme({ id: "my-m", own: words(Array.from({ length: 60 }, (_, i) => "w" + "abcdefghij"[i % 10] + "k".repeat(1 + Math.floor(i / 10))), [], []) });
  check("CUSTOM typed words capped at 40", many.own.thing.length === 40, String(many.own.thing.length));

  // --- a ticked-only theme behaves exactly like a built-in one ---
  const farmish = normCustomTheme({ id: "my-farm", name: "Our farm",
    words: words(["bucket", "cap", "bag", "net"], ["pig", "hen", "duck", "cat", "dog", "rat"], ["mud", "pond", "barn", "shed", "yard"]) });
  const inFarmish = new Set([...farmish.words.thing, ...farmish.words.animal, ...farmish.words.place]);
  const lexNoun = new Map();
  for (const lex of [MK_THING, MK_ANIMAL, MK_PLACE]) for (const w of lex.keys()) { lexNoun.set(w, w); lexNoun.set(inflect(w, "s"), w); }
  let seed = 13000, madeTicked = 0;
  for (const p of PRESETS.filter((x) => x.skills)) {
    const taughtSet = new Set(p.skills);
    for (const heart of [true, false]) {
      const ready = makerThemeReady(taughtSet, heart, farmish);
      for (const n of [3, 5, 8]) {
        freshKnown();
        const res = makePassage({ taught: taughtSet, theme: farmish, sentences: n, heart, names: makerNames(new Set()), rng: seeded(seed++) });
        const tag = `CUSTOM-TICKED ${p.id} heart=${heart} n=${n}`;
        check(`${tag} made iff ready`, res.ok === ready, res.ok ? "made but not ready" : res.reason);
        if (!res.ok) { check(`${tag} says why`, /add a few more words/.test(res.reason), res.reason); continue; }
        madeTicked++;
        const st = computeStats(res.text, taughtSet);
        check(`${tag} 100%`, st.pct === 100 && st.nw === 0, `${st.pct}% ${JSON.stringify(res.text)}`);
        check(`${tag} nothing flagged`, res.flagged.length === 0, res.flagged.join());
        const bad = disagreeFn(res.text);
        check(`${tag} words agree`, bad.length === 0, `${bad.join(", ")} in ${JSON.stringify(res.text)}`);
        const offNouns = res.text.toLowerCase().match(/[a-z]+/g).filter((x) => lexNoun.has(x) && !inFarmish.has(lexNoun.get(x)));
        check(`${tag} only the theme's nouns`, offNouns.length === 0, `off-theme: ${offNouns.join(", ")} in ${JSON.stringify(res.text)}`);
      }
    }
  }
  check("CUSTOM-TICKED passages made", madeTicked > 20, `only ${madeTicked}`);

  // --- typed words: safe frames only, never plural, amber allowed & flagged ---
  const safeRes = MAKER_SAFE_FRAMES.map((f) => new RegExp("^" + f
    .replace(/[.!?]/g, (c) => "\\" + c)
    .replace(/\{N2?\}/g, "[A-Z][a-z]+").replace(/\{a\}/g, "an?")
    .replace(/\{t(thing|animal|place)\}/g, "(?<t>[a-z]+)") + "$"));
  const bugs = normCustomTheme({ id: "my-bugs", name: "Minibeasts",
    words: words(["net", "web", "leaf"], ["bug", "bee", "snail", "slug"], ["hedge"]),
    own: words(["stick", "twig", "pebble"], ["spider", "worm", "ant", "beetle", "ladybird"], ["grass", "garden", "woods"]) });
  check("CUSTOM test theme's typed words are really typed", customThemeSize(bugs) === 3 + 4 + 1 + 3 + 5 + 3, JSON.stringify(bugs));
  const typedAll = new Set([...bugs.own.thing, ...bugs.own.animal, ...bugs.own.place]);
  const typedPlurals = new Set([...typedAll].flatMap((w) => [w + "s", w + "es", inflect(w, "s")]));
  let madeTyped = 0, sawTyped = 0, sawFlag = 0;
  for (const p of PRESETS.filter((x) => x.skills)) {
    const taughtSet = new Set(p.skills);
    for (const heart of [true, false]) {
      for (const n of [3, 5, 8]) {
        for (let k = 0; k < 4; k++) {
          freshKnown();
          const res = makePassage({ taught: taughtSet, theme: bugs, sentences: n, heart, names: makerNames(new Set()), rng: seeded(seed++) });
          const tag = `CUSTOM-TYPED ${p.id} heart=${heart} n=${n} #${k}`;
          if (!res.ok) { check(`${tag} says why`, /add a few more words|tick a few more/.test(res.reason), res.reason); continue; }
          madeTyped++;
          const toks = tokenize(res.text).filter((t) => /^[A-Za-z']+$/.test(t));
          const amber = [...new Set(toks.filter((t) => analyseWord(t, taughtSet).cat === "new").map((t) => t.toLowerCase()))];
          check(`${tag} only typed words are amber`, amber.every((w) => typedAll.has(w)), `amber: ${amber.join(", ")} in ${JSON.stringify(res.text)}`);
          check(`${tag} every amber word is flagged`, amber.sort().join() === [...res.flagged].sort().join(),
            `amber ${amber.join()} vs flagged ${res.flagged.join()}`);
          if (res.flagged.length) sawFlag++;
          check(`${tag} typed words never plural`, !toks.some((t) => typedPlurals.has(t.toLowerCase())), JSON.stringify(res.text));
          if (!heart) check(`${tag} no heart words`, !toks.some((t) => analyseWord(t, taughtSet).cat === "tricky"), JSON.stringify(res.text));
          for (const sent of res.text.split(/(?<=[.!?]"?)\s+/)) {
            const lw = sent.toLowerCase().match(/[a-z]+/g) || [];
            if (!lw.some((w) => typedAll.has(w))) continue;
            sawTyped++;
            const m = safeRes.map((r) => sent.match(r)).find(Boolean);
            check(`${tag} typed word only in a safe frame`, !!m && typedAll.has(m.groups.t), JSON.stringify(sent));
          }
          const tst = computeStats(res.title, taughtSet);
          check(`${tag} title decodable`, res.title && tst.nw === 0 && tst.pct === 100, JSON.stringify(res.title));
          const bad = disagreeFn(res.text);
          check(`${tag} bank words still agree`, bad.length === 0, `${bad.join(", ")} in ${JSON.stringify(res.text)}`);
        }
      }
    }
  }
  check("CUSTOM-TYPED passages made", madeTyped > 60, `only ${madeTyped}`);
  check("CUSTOM-TYPED typed words get used", sawTyped > madeTyped * 0.7, `${sawTyped} sentences over ${madeTyped} passages`);
  check("CUSTOM-TYPED undecodable typed words get flagged", sawFlag > 10, `only ${sawFlag}`);

  // a typed word the group CAN read is used and not flagged; a known word isn't amber
  {
    const ukE = taughtFor("uk-early");
    const t = normCustomTheme({ id: "my-t", name: "T", own: words(["twig"], ["spider"], []) });
    let usedTwig = false, cleanTwig = true;
    for (let k = 0; k < 30; k++) {
      freshKnown();
      const r = makePassage({ taught: ukE, theme: t, sentences: 8, heart: true, names: makerNames(new Set()), rng: seeded(seed++) });
      if (!r.ok) continue;
      if (/\btwig\b/.test(r.text)) usedTwig = true;
      if (r.flagged.includes("twig")) cleanTwig = false;
    }
    check("CUSTOM decodable typed word is used", usedTwig, "twig never used");
    check("CUSTOM decodable typed word never flagged", cleanTwig, "twig flagged");
    engine.setKnown(new Set(["spider"]));
    let snailFlag = false;
    for (let k = 0; k < 20; k++) {
      const r = makePassage({ taught: ukE, theme: t, sentences: 8, heart: true, names: ["Sam", "Meg"], rng: seeded(seed++) });
      if (r.ok && r.flagged.includes("spider")) snailFlag = true;
    }
    check("CUSTOM known typed word not flagged", !snailFlag, "spider flagged though known");
    freshKnown();
    // typed words only + heart words off: no safe frame fits — refuse, and say why
    const r = makePassage({ taught: taughtFor("uk-y1"), theme: t, sentences: 5, heart: false, names: makerNames(new Set()), rng: seeded(1) });
    check("CUSTOM typed-only, heart off refuses", !r.ok && /heart words switched on/.test(r.reason), JSON.stringify(r));
  }

  // --- custom themes resolve by id, like built-ins ---
  {
    const before = getCustomThemes();
    setCustomThemes([bugs]);
    const r = makePassage({ taught: taughtFor("uk-y1"), theme: "my-bugs", sentences: 5, heart: true, names: makerNames(new Set()), rng: seeded(7) });
    check("CUSTOM theme by id makes a passage", r.ok, r.reason);
    check("CUSTOM theme by id stays on theme", r.ok && (r.text.toLowerCase().match(/[a-z]+/g) || [])
      .filter((x) => lexNoun.has(x) && MK_ANIMAL.has(lexNoun.get(x))).every((x) => bugs.words.animal.includes(lexNoun.get(x))), r.text);
    check("CUSTOM ready by id", makerThemeReady(taughtFor("uk-y1"), true, "my-bugs"), "not ready");
    const unknown = makePassage({ taught: taughtFor("uk-y1"), theme: "my-gone", sentences: 3, heart: true, names: makerNames(new Set()), rng: seeded(8) });
    check("CUSTOM deleted theme id falls back to any theme", unknown.ok && unknown.flagged.length === 0, JSON.stringify(unknown));

    // --- backups: exported, re-imported by id, junk dropped ---
    const pay = libraryPayload();
    check("BACKUP payload carries themes", Array.isArray(pay.themes) && pay.themes[0].id === "my-bugs", JSON.stringify(pay.themes));
    const rt = JSON.parse(JSON.stringify(pay));
    setCustomThemes([]);
    const imp = importLibraryData({ items: [], themes: [...rt.themes, { id: "farm" }, "junk", { ...rt.themes[0], name: "dupe" }] });
    check("BACKUP import adds theme once", imp.ok && imp.themesAdded === 1 && getCustomThemes().length === 1, JSON.stringify(imp));
    check("BACKUP import round-trips the theme", JSON.stringify(getCustomThemes()[0]) === JSON.stringify(bugs), JSON.stringify(getCustomThemes()[0]));
    const again = importLibraryData({ themes: rt.themes });
    check("BACKUP re-import is a no-op", again.ok && again.themesAdded === 0 && getCustomThemes().length === 1, JSON.stringify(again));
    check("BACKUP themes-only file accepted", importLibraryData({ themes: [] }).ok, "rejected");
    setCustomThemes(before);
  }

  // --- library rows: a custom-made passage keeps its theme's name ---
  const base = { text: "The cat sat.", skills: ["cvc"], title: "T", klass: "K" };
  const it = sanitizeLibItem({ ...base, made: "custom", madeName: "  Mini  beasts " });
  check("LIB keeps custom theme name", it.made === "custom" && it.madeName === "Mini beasts", JSON.stringify(it));
  check("LIB drops madeName on built-ins", !("madeName" in sanitizeLibItem({ ...base, made: "farm", madeName: "x" })), "kept");
  check("LIB label for custom", madeThemeLabel("custom", "Minibeasts") === " · Minibeasts", madeThemeLabel("custom", "Minibeasts"));
  check("LIB label for built-in unchanged", madeThemeLabel("seaside") === " · seaside", madeThemeLabel("seaside"));
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
