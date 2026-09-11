"use strict";
/* ============================================================
   corpus.js — the engine test corpus for Decodable Check.

   A hand-authored, phonics-verified set of real words tagged with
   what analyseWord() SHOULD produce, plus the sample passage's
   expected verdicts. This is the safety net that lets every later
   engine change (roadmap #2, hardening) prove decodability accuracy
   instead of eyeballing it.

   Every expected value below was checked against the shipped engine
   AND read against real Science-of-Reading phonics. Cases the engine
   gets right are HARD assertions (a regression fails the build).
   Cases where the engine is currently wrong live in KNOWN_LIMITATIONS
   — asserted to their *current* behaviour so the baseline is locked,
   but reported separately as the concrete targets for engine
   hardening. When a hardening change improves one, the runner flags
   it as "changed — review & promote" rather than failing.

   Data only. The runner (engine.test.js) loads the real engine and
   checks every entry.

   ----- how a word is scored (recap) -----
   analyseWord(word, taught) splits a word into graphemes and returns
   a `need` set (the skills its spellings require). `need` is
   independent of what's taught; a word is `ok` only when every needed
   skill is in `taught`, else `new` (with `missing` = need − taught).
   Heart words short-circuit to `tricky`; known words to `known`.
   ============================================================ */

/* Skill ids (from PHASES): cvc double digraph blend endings
                            magice team diph rctrl adv          */
const ALL = ["cvc", "double", "digraph", "blend", "endings", "magice", "team", "diph", "rctrl", "adv"];

/* ---------------------------------------------------------------
   1. DECODABLE — the segmenter's grapheme→skill decomposition.
   Each word maps to the exact `need` set the engine must derive.
   `need` is taught-independent, so this locks segmentation for the
   whole vocabulary regardless of preset. (cat is 'ok' when ALL is
   taught, which is how the runner checks these.)
   --------------------------------------------------------------- */
const DECODABLE = [
  // --- single letters & CVC (need nothing beyond cvc) ---
  ["cat", []], ["dog", []], ["run", []], ["hop", []], ["big", []],
  ["sun", []], ["jam", []], ["pet", []], ["wet", []], ["fan", []],
  ["cup", []], ["bin", []], ["top", []], ["van", []], ["jet", []],
  ["kid", []], ["hut", []], ["dig", []], ["pin", []], ["bat", []],
  ["mat", []], ["sit", []], ["gap", []], ["hen", []], ["red", []],
  ["nap", []], ["bug", []], ["mud", []], ["log", []], ["yes", []],

  // --- double consonants (ff ll ss zz) ---
  ["hill", ["double"]], ["bell", ["double"]], ["doll", ["double"]],
  ["fell", ["double"]], ["well", ["double"]], ["tell", ["double"]],
  ["buzz", ["double"]], ["fizz", ["double"]], ["jazz", ["double"]],
  ["off", ["double"]], ["puff", ["double"]], ["cuff", ["double"]],

  // --- consonant digraphs (sh ch th wh ck ng ...) ---
  ["ship", ["digraph"]], ["chin", ["digraph"]], ["that", ["digraph"]],
  ["duck", ["digraph"]], ["ring", ["digraph"]], ["when", ["digraph"]],
  ["bath", ["digraph"]], ["with", ["digraph"]], ["much", ["digraph"]],
  ["path", ["digraph"]], ["sock", ["digraph"]], ["king", ["digraph"]],
  ["wish", ["digraph"]], ["rich", ["digraph"]], ["fish", ["digraph"]],
  ["dish", ["digraph"]], ["wing", ["digraph"]], ["long", ["digraph"]],

  // --- consonant blends (adjacent single consonants) ---
  ["stop", ["blend"]], ["frog", ["blend"]], ["hand", ["blend"]],
  ["lamp", ["blend"]], ["clap", ["blend"]], ["drum", ["blend"]],
  ["spin", ["blend"]], ["glad", ["blend"]], ["crab", ["blend"]],
  ["plum", ["blend"]], ["twist", ["blend"]], ["blank", ["blend"]],
  ["stand", ["blend"]], ["fast", ["blend"]], ["milk", ["blend"]],
  ["help", ["blend"]], ["jump", ["blend"]], ["gift", ["blend"]],
  ["lost", ["blend"]], ["must", ["blend"]], ["tent", ["blend"]],
  ["band", ["blend"]], ["sand", ["blend"]], ["camp", ["blend"]],
  ["desk", ["blend"]], ["pond", ["blend"]], ["wind", ["blend"]],
  ["belt", ["blend"]],

  // --- inflectional endings (-s -es -ing -ed on real inflections) ---
  ["jumps", ["blend", "endings"]], ["jumped", ["blend", "endings"]],
  ["hands", ["blend", "endings"]], ["packed", ["digraph", "endings"]],
  ["kicking", ["digraph", "endings"]], ["wished", ["digraph", "endings"]],
  ["cats", ["endings"]], ["dogs", ["endings"]], ["kids", ["endings"]],
  ["boxes", ["endings"]], ["wishes", ["digraph", "endings"]],
  ["buses", ["endings"]], ["notes", ["magice", "endings"]],
  ["rides", ["magice", "endings"]], ["makes", ["magice", "endings"]],

  // --- NON-inflections: root letters that look like a suffix but aren't.
  //     These lock the "don't over-strip" fix (was mis-read as inflected).
  //     final -s that is root, not a plural / 3rd-person marker:
  ["bus", []], ["his", []], ["gas", []], ["yes", []], ["plus", ["blend"]],
  ["this", ["digraph"]], ["miss", ["double"]], ["class", ["blend", "double"]],
  ["less", ["double"]], ["boss", ["double"]], ["kiss", ["double"]],
  ["glass", ["blend", "double"]], ["cross", ["blend", "double"]],
  //     final -ing that is really i + ng (a digraph), not verb + ing:
  ["thing", ["digraph"]], ["king", ["digraph"]], ["bring", ["blend", "digraph"]],
  ["string", ["blend", "digraph"]], ["swing", ["blend", "digraph"]],
  ["wring", ["adv", "digraph"]],
  //     final -ed that is really e + d, not verb + ed:
  ["sled", ["blend"]], ["shed", ["digraph"]], ["bled", ["blend"]],
  ["fled", ["blend"]], ["bred", ["blend"]],

  // --- magic-e / split digraph ---
  ["cake", ["magice"]], ["bike", ["magice"]], ["home", ["magice"]],
  ["cube", ["magice"]], ["made", ["magice"]], ["ride", ["magice"]],
  ["note", ["magice"]], ["cute", ["magice"]], ["kite", ["magice"]],
  ["bake", ["magice"]], ["rope", ["magice"]], ["pale", ["magice"]],
  ["wave", ["magice"]], ["cane", ["magice"]], ["time", ["magice"]],
  ["name", ["magice"]], ["game", ["magice"]],
  ["shine", ["digraph", "magice"]], ["plane", ["blend", "magice"]],
  ["grape", ["blend", "magice"]], ["stone", ["blend", "magice"]],
  ["flame", ["blend", "magice"]],

  // --- vowel teams ---
  ["rain", ["team"]], ["boat", ["team"]], ["night", ["team"]],
  ["see", ["team"]], ["feet", ["team"]], ["coat", ["team"]],
  ["day", ["team"]], ["meet", ["team"]], ["road", ["team"]],
  ["light", ["team"]], ["right", ["team"]], ["sigh", ["team"]],
  ["sea", ["team"]], ["keep", ["team"]], ["week", ["team"]],
  ["sail", ["team"]], ["goat", ["team"]], ["soap", ["team"]],
  ["moon", ["team"]], ["boot", ["team"]], ["leaf", ["team"]],
  ["beak", ["team"]],
  ["beach", ["digraph", "team"]], ["sheep", ["digraph", "team"]],
  ["tree", ["blend", "team"]], ["play", ["blend", "team"]],
  ["green", ["blend", "team"]],

  // --- diphthongs & other vowels ---
  ["coin", ["diph"]], ["saw", ["diph"]], ["few", ["diph"]],
  ["boy", ["diph"]], ["out", ["diph"]], ["loud", ["diph"]],
  ["jaw", ["diph"]], ["dew", ["diph"]], ["toy", ["diph"]],
  ["oil", ["diph"]], ["boil", ["diph"]], ["soil", ["diph"]],
  ["haul", ["diph"]], ["paw", ["diph"]], ["law", ["diph"]],
  ["raw", ["diph"]], ["new", ["diph"]], ["join", ["diph"]],
  ["coil", ["diph"]], ["cloud", ["blend", "diph"]],

  // --- r-controlled vowels ---
  ["corn", ["rctrl"]], ["bird", ["rctrl"]], ["her", ["rctrl"]],
  ["farm", ["rctrl"]], ["girl", ["rctrl"]], ["turn", ["rctrl"]],
  ["born", ["rctrl"]], ["fork", ["rctrl"]], ["hurt", ["rctrl"]],
  ["dark", ["rctrl"]], ["card", ["rctrl"]], ["herd", ["rctrl"]],
  ["arm", ["rctrl"]], ["art", ["rctrl"]], ["for", ["rctrl"]],
  ["fur", ["rctrl"]], ["curl", ["rctrl"]], ["burn", ["rctrl"]],
  ["form", ["rctrl"]], ["cord", ["rctrl"]], ["word", ["rctrl"]],
  ["dirt", ["rctrl"]], ["hard", ["rctrl"]], ["park", ["rctrl"]],
  ["yarn", ["rctrl"]],
  ["star", ["blend", "rctrl"]], ["chirp", ["digraph", "rctrl"]],
  ["shark", ["digraph", "rctrl"]],

  // --- advanced patterns (kn wr mb dge ...) ---
  ["wren", ["adv"]], ["knot", ["adv"]], ["knit", ["adv"]],
  ["wrap", ["adv"]], ["lamb", ["adv"]], ["comb", ["adv"]],
  ["dodge", ["adv"]], ["badge", ["adv"]],
  ["knee", ["adv", "team"]], ["thumb", ["adv", "digraph"]],
  ["bridge", ["adv", "blend"]], ["crumb", ["adv", "blend"]],
  ["wreck", ["adv", "digraph"]],
];

/* ---------------------------------------------------------------
   2. NEEDS-SKILL — real teaching scenarios. Under a given preset a
   word is `new`, blocked by exactly these missing skills. This is the
   heart of the tool: "this word needs code your group hasn't been
   taught". `preset` names a PRESETS entry.
   --------------------------------------------------------------- */
const NEEDS_SKILL = [
  // UK Reception (cvc double digraph blend endings) — no long-vowel code
  ["rain", "uk-early", ["team"]],
  ["see", "uk-early", ["team"]],
  ["cake", "uk-early", ["magice"]],
  ["shine", "uk-early", ["magice"]],
  ["out", "uk-early", ["diph"]],
  ["saw", "uk-early", ["diph"]],
  ["her", "uk-early", ["rctrl"]],
  ["bird", "uk-early", ["rctrl"]],
  ["star", "uk-early", ["rctrl"]],        // blend taught, so only rctrl blocks it
  ["knee", "uk-early", ["adv", "team"]],
  // SoR Kindergarten (cvc double digraph blend) — endings not yet taught
  ["jumps", "sor-k", ["endings"]],
  ["cake", "sor-k", ["magice"]],
  // CVC-only group (cvc double)
  ["ship", "cvc", ["digraph"]],
  ["stop", "cvc", ["blend"]],
  ["jumps", "cvc", ["blend", "endings"]],
];

/* A "cvc" convenience preset (cvc + double) used by NEEDS_SKILL and
   DECODABLE_UNDER — the app's "Reset to CVC" button state. */
const CVC_PRESET = ["cvc", "double"];

/* ---------------------------------------------------------------
   3. DECODABLE UNDER A LIMITED SET — the positive side: these words
   ARE decodable for the given preset (cat === 'ok'). Guards against a
   hardening change that makes the engine too strict.
   --------------------------------------------------------------- */
const DECODABLE_UNDER = [
  ["cat", "uk-early"], ["hand", "uk-early"], ["ship", "uk-early"],
  ["jumps", "uk-early"], ["duck", "uk-early"], ["glad", "uk-early"],
  ["off", "uk-early"], ["fast", "uk-early"],
  ["cat", "cvc"], ["hen", "cvc"], ["sun", "cvc"], ["bell", "cvc"],
  ["cake", "uk-y1"], ["rain", "uk-y1"], ["star", "uk-y1"], ["her", "uk-y1"],
];

/* ---------------------------------------------------------------
   4. HEART / TRICKY WORDS — high-frequency irregulars, always `tricky`
   and excluded from the decodability %. Taught set is irrelevant.
   --------------------------------------------------------------- */
const HEART = [
  "the", "a", "to", "is", "was", "said", "you", "are", "they",
  "of", "we", "he", "she", "me", "be", "do", "go", "no", "so",
  "one", "two", "come", "some", "were", "there", "where", "what",
  "who", "why", "could", "would", "should", "have", "give", "love",
  "people", "because", "friend", "school", "water", "eye", "once", "many",
];

/* ---------------------------------------------------------------
   5. KNOWN WORDS — names / class-taught words set aside by the teacher.
   `known` short-circuits before everything (even heart words), is
   case-insensitive, and is excluded from the %. Each case gives the
   known set and the expected category per probe word.
   --------------------------------------------------------------- */
const KNOWN = [
  {
    set: ["fern", "meg"],
    probes: [
      ["Fern", "known"], ["fern", "known"], ["MEG", "known"], ["Meg", "known"],
      ["cat", "ok"],          // not in the known set -> scored normally
    ],
  },
  {
    // a known word wins even over a heart word (both leave the % alone,
    // but the label should read "known", not "tricky")
    set: ["the"],
    probes: [["the", "known"]],
  },
];

/* ---------------------------------------------------------------
   6. SAMPLE PASSAGE — the app's built-in demo text. Locks the
   headline decodability % (92% on the default UK Reception preset,
   100% with everything taught) and a handful of per-word verdicts,
   so a segmentation change that moves the demo score is caught.
   --------------------------------------------------------------- */
const SAMPLE =
  "Meg is a red hen. She can run in the mud.\n" +
  "A big cat sat on the log. The cat had a nap in the sun.\n" +
  "Then Meg let out a yell! The cat ran off fast.\n" +
  "Meg is so glad. She will rest in her nest.\n" +
  "The hen can see a big red bug.";

const PASSAGE = {
  text: SAMPLE,
  stats: [
    // preset, expected { ok, nw, tr, pct }
    ["uk-early", { ok: 36, nw: 3, tr: 16, pct: 92 }],
    ["all", { ok: 39, nw: 0, tr: 16, pct: 100 }],
  ],
  // spot verdicts under the default UK Reception preset
  spot: [
    ["uk-early", "Meg", "ok"],
    ["uk-early", "red", "ok"],
    ["uk-early", "off", "ok"],
    ["uk-early", "glad", "ok"],
    ["uk-early", "see", "new"],   // needs vowel teams
    ["uk-early", "out", "new"],   // needs diphthongs
    ["uk-early", "her", "new"],   // needs r-controlled
    ["uk-early", "the", "tricky"],
    ["uk-early", "is", "tricky"],
    ["uk-early", "a", "tricky"],
  ],
};

/* ---------------------------------------------------------------
   7. KNOWN LIMITATIONS — engine-hardening targets (roadmap #2).
   These are places the current engine is phonically WRONG. We lock
   the CURRENT `need` set (taught-independent) so the baseline is
   explicit, and record `want` (what a hardened engine should do) plus
   a note. The runner reports these separately and, if one changes,
   flags it for promotion rather than failing — so fixing soft-c (etc.)
   is visible progress, not a red build.
   --------------------------------------------------------------- */
const KNOWN_LIMITATIONS = [
  // soft c / soft g not modelled (c=/s/, g=/j/ before e/i/y) — treated as hard
  { word: "city", now: ["blend"], want: "advanced (soft c) — not plain CVC", note: "c=/s/, y=/i/ unmodelled" },
  { word: "cent", now: ["blend"], want: "advanced (soft c)", note: "c=/s/ unmodelled" },
  { word: "ice", now: ["magice"], want: "advanced (soft c)", note: "c=/s/ unmodelled" },
  { word: "race", now: ["magice"], want: "advanced (soft c)", note: "c=/s/ unmodelled" },
  { word: "gem", now: [], want: "advanced (soft g)", note: "g=/j/ unmodelled — scored as basic CVC" },
  { word: "page", now: ["magice"], want: "advanced (soft g)", note: "g=/j/ unmodelled" },
  { word: "giant", now: ["blend"], want: "advanced (soft g)", note: "g=/j/ unmodelled; no true blend" },

  // -le syllable (consonant + syllabic /əl/) read as consonant + vowel 'e'
  { word: "little", now: ["blend"], want: "-le ending (adv); tt is a double, not a blend", note: "final -le mis-read" },
  { word: "gentle", now: ["blend"], want: "-le ending + soft g", note: "final -le mis-read" },
  { word: "table", now: ["blend"], want: "-le ending; open-syllable long a", note: "final -le mis-read" },
  { word: "apple", now: ["blend"], want: "-le ending; pp double", note: "final -le mis-read" },
  { word: "candle", now: ["blend"], want: "-le ending", note: "nd is a blend but final -le is mis-read" },
  { word: "bottle", now: ["blend"], want: "-le ending; tt double", note: "final -le mis-read" },

  // syllable-boundary consonants flagged as a single-syllable blend
  { word: "sunset", now: ["blend"], want: "two CVC syllables (sun+set) — no blend", note: "n|s spans a syllable boundary" },
  { word: "napkin", now: ["blend"], want: "two closed syllables — no blend", note: "p|k spans a syllable boundary" },
  { word: "basket", now: ["blend"], want: "bas+ket — 'sk' split across syllables", note: "syllable-boundary blend" },
  { word: "picnic", now: ["blend"], want: "pic+nic — no blend", note: "c|n spans a syllable boundary" },

  // doubled medial consonant treated as a blend
  { word: "rabbit", now: ["blend"], want: "rab+bit; bb is a double, not a blend", note: "medial double consonant" },
  { word: "kitten", now: ["blend"], want: "kit+ten; tt is a double, not a blend", note: "medial double consonant" },

  // final s / es / ed stripped as an inflection when it isn't one.
  // FIXED for the clear cases (bus, his, miss, class, this, thing, sled …) —
  // see the DECODABLE "NON-inflections" block, now hard-asserted. Two harder
  // residues remain, each blocked by a *different* engine gap:
  { word: "hundred", now: ["blend", "endings"], want: "hun+dred; '-red' is not an -ed inflection", note: "base 'hundr' still has a vowel, so the -ed guard can't reject it — needs a coda/syllable check" },
  { word: "tennis", now: ["blend"], want: "ten+nis; 'nn' is a double, not a blend", note: "the false -s strip is fixed; the medial 'nn' is still read as a blend (medial-double gap)" },

  // greedy 'wa' grapheme (for want/was) eats w+a before a vowel team
  { word: "wait", now: [], want: "w + ai(team) + t", note: "'wa' grapheme consumes w+a before the 'ai' team" },

  // the pronoun "I" lowercases to "i", which isn't in the TRICKY set
  // (that stores capital "I"), so it scores as a decodable single vowel
  { word: "I", now: [], want: "heart word (the pronoun I)", note: "TRICKY holds 'I'; analyseWord lowercases to 'i' and misses it" },
];

module.exports = {
  ALL,
  CVC_PRESET,
  DECODABLE,
  NEEDS_SKILL,
  DECODABLE_UNDER,
  HEART,
  KNOWN,
  PASSAGE,
  KNOWN_LIMITATIONS,
};
