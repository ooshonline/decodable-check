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

  // --- soft c (c = /s/ before e, i, y) — advanced code, not the basic /k/.
  //     A beginner can't decode these with hard c; each needs the soft-c rule
  //     (bucketed as `adv`). Reliable in English, so hard-asserted. (Soft g is a
  //     documented limitation — its hard-g exceptions defeat a by-rule model.)
  ["cinema", ["adv"]],                                    // c=/s/, all single letters
  ["cent", ["adv", "blend"]],                             // c=/s/ + nt blend
  ["cell", ["adv", "double"]],                            // c=/s/ + ll double
  ["dance", ["adv", "blend"]],                            // c=/s/, n+c a /ns/ blend
  ["pencil", ["adv", "blend"]],                           // c=/s/, n+c blend
  ["circus", ["adv", "rctrl"]],                           // 1st c soft, 2nd c hard (before u)
  ["ice", ["adv", "magice"]],                             // soft c + magic-e long i
  ["race", ["adv", "magice"]], ["face", ["adv", "magice"]],
  ["nice", ["adv", "magice"]], ["mice", ["adv", "magice"]],
  ["rice", ["adv", "magice"]], ["dice", ["adv", "magice"]],
  ["space", ["adv", "blend", "magice"]],                  // sp blend + soft c + magic-e
  ["place", ["adv", "blend", "magice"]],

  // --- doubled consonants = ONE sound, never a blend (roadmap #2 hardening).
  //     A doubled letter (bb tt nn pp dd gg mm rr…) marks the short vowel and is
  //     read once, so it needs the `double` skill, not `blend`. The greedy table
  //     already handled the floss finals (ll ss ff zz -> hill, buzz, off); this
  //     locks the MEDIAL doubles that used to be mis-read as a b+b "blend".
  ["rabbit", ["double"]], ["kitten", ["double"]], ["tennis", ["double"]],
  ["happen", ["double"]], ["mitten", ["double"]], ["button", ["double"]],
  ["sudden", ["double"]], ["hidden", ["double"]], ["ribbon", ["double"]],
  ["kennel", ["double"]], ["puppet", ["double"]], ["common", ["double"]],
  ["cannot", ["double"]], ["rotten", ["double"]], ["cotton", ["double"]],
  ["pollen", ["double"]], ["mammal", ["double"]], ["tunnel", ["double"]],
  ["lesson", ["double"]], ["attic", ["double"]],
  // final non-floss doubles (dd gg bb nn) — outside the ll/ss/ff/zz table,
  // now covered by the general doubled-consonant rule.
  ["add", ["double"]], ["odd", ["double"]], ["egg", ["double"]],
  ["inn", ["double"]], ["ebb", ["double"]],
  // doubles compose with the other skills around them:
  ["rubbish", ["digraph", "double"]],                     // bb double + sh digraph
  ["mammoth", ["digraph", "double"]],                     // mm double + th digraph
  ["traffic", ["blend", "double"]],                       // tr blend + ff double
  ["blossom", ["blend", "double"]],                       // bl blend + ss double
  ["attack", ["digraph", "double"]],                      // tt double + ck digraph
  ["dinner", ["double", "rctrl"]],                        // nn double + er r-controlled
  ["summer", ["double", "rctrl"]],                        // mm double + er r-controlled

  // --- final y = a VOWEL, never a consonant (roadmap #2 hardening).
  //     At the end of a word 'y' spells a long vowel: /ī/ in one-syllable words
  //     (cry, fly, sky) and /ē/ in multisyllabic ones (happy, city, funny).
  //     English has no word ending in a consonant /y/, so the rule is
  //     exceptionless. Before this fix the final y sat in CONS and chained into
  //     a spurious blend with the letter before it (city read 't+y' as a /ty/
  //     blend, happy 'p+y', fancy 'n+c+y'…). Now bucketed as `team` — a
  //     long-vowel spelling taught with the vowel teams — so the blend is gone
  //     AND the tool is honest that a CVC-only reader can't yet decode final y.
  //     Vowel-team y (day, boy, key) is consumed by ay/oy/ey earlier and
  //     start-of-word y (yes, yak) is a consonant, so neither is affected.
  ["cry", ["blend", "team"]], ["fly", ["blend", "team"]], ["sky", ["blend", "team"]],
  ["try", ["blend", "team"]], ["dry", ["blend", "team"]], ["spy", ["blend", "team"]],
  ["sly", ["blend", "team"]], ["fry", ["blend", "team"]],
  ["shy", ["digraph", "team"]],                            // sh digraph + y=/ī/
  ["happy", ["double", "team"]], ["funny", ["double", "team"]],
  ["silly", ["double", "team"]], ["puppy", ["double", "team"]],
  ["sunny", ["double", "team"]], ["penny", ["double", "team"]],
  ["jelly", ["double", "team"]], ["bunny", ["double", "team"]],
  ["muddy", ["double", "team"]], ["foggy", ["double", "team"]],
  ["baby", ["team"]], ["lady", ["team"]], ["pony", ["team"]],  // single medial cons, no blend
  ["very", ["rctrl", "team"]], ["every", ["rctrl", "team"]],   // er r-controlled + y
  // soft c + final y (both advanced/long-vowel code) — the city residue, fixed:
  ["city", ["adv", "team"]], ["icy", ["adv", "team"]],
  ["fancy", ["adv", "blend", "team"]],                    // soft c + n+c /ns/ blend + y
  ["spicy", ["adv", "blend", "team"]],                    // sp blend + soft c + y
  ["mercy", ["adv", "rctrl", "team"]],                   // er r-controlled + soft c + y
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
  // Soft c blocked by advanced code (uk-early has no `adv`; blend/double it does)
  ["cent", "uk-early", ["adv"]],
  ["cell", "uk-early", ["adv"]],
  ["cinema", "uk-early", ["adv"]],
  ["ice", "uk-early", ["adv", "magice"]],   // soft c AND magic-e both untaught
  ["face", "uk-early", ["adv", "magice"]],
  // Final y = a long vowel, so a CVC/blends group hasn't been taught it yet.
  ["happy", "uk-early", ["team"]],          // double taught, y=/ē/ (team) is not
  ["funny", "uk-early", ["team"]],
  ["cry", "uk-early", ["team"]],            // fl/cr blend taught, y=/ī/ (team) is not
  ["city", "uk-early", ["adv", "team"]],    // soft c AND y-vowel both untaught
  ["city", "uk-y1", ["adv"]],               // y-vowel now taught; only soft c blocks it
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
  // medial doubles are decodable as soon as the `double` skill is taught —
  // every cvc group in the presets already includes it (rabbit, not r-a-b-b-it).
  ["rabbit", "cvc"], ["kitten", "cvc"], ["happen", "cvc"],
  ["rabbit", "uk-early"], ["button", "sor-k"], ["tennis", "uk-early"],
  // final-y words become decodable once "y as a vowel" (team) is taught (uk-y1)
  ["happy", "uk-y1"], ["funny", "uk-y1"], ["cry", "uk-y1"], ["baby", "uk-y1"],
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
  // Soft c (c=/s/ before e/i/y) is MODELLED as advanced code — see the "soft c"
  // block in DECODABLE (cent, ice, race, cell, space…). FINAL y as a vowel is
  // now modelled too — see the "final y = a VOWEL" block in DECODABLE (city,
  // happy, cry, fancy…), so city is fixed (adv+team) and promoted there.
  // The remaining y gap is MEDIAL y — a vowel inside a word (gym, myth, type,
  // system, crystal). It still sits in CONS, so a consonant beside it reads as a
  // spurious blend (myth = th digraph + a false m|y blend; type/gym a false y+
  // cons blend). Unlike final y this can't be resolved by position alone: medial
  // y is /ĭ/ (gym), /ī/ (type), or part of a team, and telling those apart needs
  // syllable/vowel-slot analysis. Locked to current behaviour until then.
  { word: "gym", now: ["blend"], want: "y=/ĭ/ vowel, no blend (advanced spelling)",
    note: "medial y still in CONS: g+y reads as a spurious blend" },
  { word: "myth", now: ["blend", "digraph"], want: "m + y=/ĭ/ + th(digraph); no blend",
    note: "medial y still in CONS: m+y reads as a spurious blend" },
  { word: "type", now: ["blend"], want: "t + y=/ī/ split-digraph (long vowel); no blend",
    note: "medial y still in CONS: t+y reads as a spurious blend; y-e long vowel also unmodelled" },
  // Soft g (g=/j/ before e/i/y) is DELIBERATELY NOT modelled. Unlike soft c, a
  // by-rule guess is unsafe: hard-g-before-e/i/y is extremely common (get, girl,
  // gift, give, begin, finger, anger, longer, tiger, eager, together, forget,
  // target…), so a naive rule would mis-mark ordinary words as advanced code —
  // and a wrong mark in a phonics tool is worse than a known gap. Reliable soft-g
  // detection needs a lexicon/morphology, out of scope for the by-rule engine.
  { word: "gem", now: [], want: "advanced (soft g)", note: "g=/j/ unmodelled — see soft-g note above; scored as basic CVC" },
  { word: "page", now: ["magice"], want: "advanced (soft g)", note: "g=/j/ unmodelled — see soft-g note above" },
  { word: "giant", now: ["blend"], want: "advanced (soft g)", note: "g=/j/ unmodelled — see soft-g note above; no true blend" },

  // -le syllable (consonant + syllabic /əl/) — the final consonant+le should be
  // one `adv` unit ("lit·tle"); the engine reads it as a basic consonant + vowel
  // 'e'. Where the -le follows two DIFFERENT consonants (gentle, candle, table)
  // that pair also mis-reads as a blend; where it follows a DOUBLE (little,
  // apple, bottle) the double is now scored correctly and only the -le understate
  // remains. Both are the same open target: model the consonant-le syllable.
  { word: "little", now: ["double"], want: "-le ending (adv); tt double now correct", note: "medial double fixed; final -le still read as basic l + e" },
  { word: "gentle", now: ["blend"], want: "-le ending + soft g", note: "final -le mis-read (t+l reads as a blend)" },
  { word: "table", now: ["blend"], want: "-le ending; open-syllable long a", note: "final -le mis-read (b+l reads as a blend)" },
  { word: "apple", now: ["double"], want: "-le ending (adv); pp double now correct", note: "medial double fixed; final -le still read as basic l + e" },
  { word: "candle", now: ["blend"], want: "-le ending", note: "nd is a real blend but final -le is mis-read" },
  { word: "bottle", now: ["double"], want: "-le ending (adv); tt double now correct", note: "medial double fixed; final -le still read as basic l + e" },

  // syllable-boundary consonants flagged as a single-syllable blend
  { word: "sunset", now: ["blend"], want: "two CVC syllables (sun+set) — no blend", note: "n|s spans a syllable boundary" },
  { word: "napkin", now: ["blend"], want: "two closed syllables — no blend", note: "p|k spans a syllable boundary" },
  { word: "basket", now: ["blend"], want: "bas+ket — 'sk' split across syllables", note: "syllable-boundary blend" },
  { word: "picnic", now: ["blend"], want: "pic+nic — no blend", note: "c|n spans a syllable boundary" },

  // Doubled medial consonants (rabbit, kitten, tennis, happen, button…) are now
  // scored as `double`, not a spurious blend — promoted to the DECODABLE corpus
  // (see the "doubled consonants" block there). Left this note as a signpost.

  // final s / es / ed stripped as an inflection when it isn't one.
  // FIXED for the clear cases (bus, his, miss, class, this, thing, sled …) —
  // see the DECODABLE "NON-inflections" block, now hard-asserted. Two harder
  // residues remain, each blocked by a *different* engine gap:
  { word: "hundred", now: ["blend", "endings"], want: "hun+dred; '-red' is not an -ed inflection", note: "base 'hundr' still has a vowel, so the -ed guard can't reject it — needs a coda/syllable check" },

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
