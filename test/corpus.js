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
                            magice team diph rctrl alt adv      */
const ALL = ["cvc", "double", "digraph", "blend", "syll", "endings", "magice", "open", "team", "diph", "rctrl", "alt", "adv"];

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
  //     "-eed" is ee + d, not a stripped "-ed" (seed was se|ed: endings only)
  ["seed", ["team"]], ["need", ["team"]], ["feed", ["team"]], ["weed", ["team"]],
  ["speed", ["team", "blend"]], ["greed", ["team", "blend"]], ["tweed", ["team", "blend"]],
  //     ...while a real -ed on an -eed base still strips cleanly
  ["needed", ["team", "endings"]], ["seeded", ["team", "endings"]],
  //     ue / oe bases take a bare -d: glue+d, toe+d (glued was glu|ed)
  ["glued", ["team", "blend", "endings"]], ["clued", ["team", "blend", "endings"]],
  ["toed", ["team", "endings"]], ["hoed", ["team", "endings"]],
  //     "wa" + "ai": the /wŏ/ "wa" grapheme must yield to the "ai" team, or
  //     wait/wail read as a false all-CVC "green" that hides the team skill.
  ["wait", ["team"]], ["wail", ["team"]], ["waif", ["team"]],
  ["waist", ["blend", "team"]],
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

  // --- soft c (c = /s/ before e, i, y) — an alternative pronunciation, not
  //     the basic /k/. A beginner can't decode these with hard c; each needs
  //     the soft-c rule (bucketed as `alt`, split out of `adv`). Reliable in English, so hard-asserted. (Soft g is a
  //     documented limitation — its hard-g exceptions defeat a by-rule model.)
  ["cinema", ["alt", "open", "syll"]],                                    // c=/s/, all single letters
  ["cent", ["alt", "blend"]],                             // c=/s/ + nt blend
  ["cell", ["alt", "double"]],                            // c=/s/ + ll double
  ["dance", ["alt", "blend"]],                            // c=/s/, n+c a /ns/ blend
  ["pencil", ["alt", "syll"]],                                    // c=/s/; pen·cil — n|c is a syllable split
  ["circus", ["alt", "rctrl", "syll"]],                           // 1st c soft, 2nd c hard (before u)
  ["ice", ["alt", "magice"]],                             // soft c + magic-e long i
  ["race", ["alt", "magice"]], ["face", ["alt", "magice"]],
  ["nice", ["alt", "magice"]], ["mice", ["alt", "magice"]],
  ["rice", ["alt", "magice"]], ["dice", ["alt", "magice"]],
  ["space", ["alt", "blend", "magice"]],                  // sp blend + soft c + magic-e
  ["place", ["alt", "blend", "magice"]],

  // --- soft g at word-final "-ge" (g = /j/) — alternative pronunciation (roadmap #2).
  //     Unlike ONSET soft g (gem, giant, magic — still a locked limitation,
  //     because it shares a slot with common hard-g words: get, girl, gift…),
  //     word-final "-ge" is EXCEPTIONLESS in English. The silent e forces /j/;
  //     hard final /g/ is spelled "-gue" (vague, league, rogue) or a bare "-g"
  //     (bag, flag, frog), none of which end in "-ge". Bucketed as `alt`, like
  //     soft c ("-dge" stays its own `adv` grapheme). A magic-e "-ge" keeps its long vowel too (page = long
  //     a + soft g); an "-nge" reads as n + soft g (a /nj/ blend), never the /ŋ/
  //     "ng" digraph (sing has no silent e, so it is untouched).
  ["age", ["alt", "magice"]],                             // long a + soft g
  ["page", ["alt", "magice"]], ["cage", ["alt", "magice"]],
  ["rage", ["alt", "magice"]], ["huge", ["alt", "magice"]],
  ["sage", ["alt", "magice"]], ["wage", ["alt", "magice"]],
  ["stage", ["alt", "blend", "magice"]],                  // st blend + long a + soft g
  ["large", ["alt", "rctrl"]], ["forge", ["alt", "rctrl"]],   // ar/or r-controlled + soft g
  ["urge", ["alt", "rctrl"]], ["merge", ["alt", "rctrl"]],
  ["gorge", ["alt", "rctrl"]], ["surge", ["alt", "rctrl"]],   // onset g stays HARD; only final g is soft
  ["charge", ["alt", "digraph", "rctrl"]],                // ch digraph + ar + soft g
  ["change", ["alt", "blend", "digraph"]],                // ch + a + n+g /nj/ blend + soft g
  ["range", ["alt", "blend"]], ["hinge", ["alt", "blend"]],   // "-nge" = n + soft g, not the /ŋ/ digraph
  ["strange", ["alt", "blend"]], ["plunge", ["alt", "blend"]],
  ["sponge", ["alt", "blend"]], ["fringe", ["alt", "blend"]],
  ["orange", ["alt", "blend", "rctrl", "syll"]],                  // or + a + n+g blend + soft g
  ["pages", ["alt", "endings", "magice"]],                // soft g composes with a plural -s

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
  ["baby", ["open", "syll", "team"]], ["lady", ["open", "syll", "team"]], ["pony", ["open", "syll", "team"]],  // single medial cons, no blend
  ["very", ["rctrl", "syll", "team"]], ["every", ["open", "rctrl", "syll", "team"]],   // er r-controlled + y
  // soft c + final y (alternative + long-vowel code) — the city residue, fixed:
  ["city", ["alt", "open", "syll", "team"]], ["icy", ["alt", "syll", "team"]],
  ["fancy", ["alt", "syll", "team"]],                             // soft c + y; fan·cy — n|c is a syllable split
  ["spicy", ["alt", "blend", "syll", "team"]],                    // sp blend + soft c + y
  ["mercy", ["alt", "rctrl", "syll", "team"]],                   // er r-controlled + soft c + y

  // --- medial y = a VOWEL too (roadmap #2 hardening). Consonant y only ever
  //     starts a syllable before a vowel (yes, beyond, canyon, lawyer), so a
  //     bare y with a CONSONANT after it is a vowel. When it is the word's
  //     first vowel it spells /ĭ/ (gym, myth) or, with a split e, /ī/ (type,
  //     style) — an alternative pronunciation (`alt`). Before this fix it sat in
  //     CONS and chained into a spurious blend (myth m+y, type t+y+p), so groups
  //     with blends but no y-as-a-vowel were told these were decodable.
  //     symbol's b is sounded (sym·bol), so it needs no `adv`: see the mb block.
  ["gym", ["alt"]], ["myth", ["alt", "digraph"]], ["gyms", ["alt", "endings"]],
  ["pyramid", ["alt", "open", "syll"]], ["typical", ["alt", "open", "syll"]], ["lyric", ["alt", "syll"]],
  ["nylon", ["alt", "syll"]], ["syrup", ["alt", "syll"]], ["symbol", ["alt", "syll"]],
  ["python", ["alt", "digraph", "syll"]], ["physics", ["alt", "digraph", "endings", "syll"]],
  ["system", ["alt", "blend", "syll"]], ["crystal", ["alt", "blend", "syll"]],   // real s+t / c+r blends stay
  ["gymnast", ["alt", "blend", "syll"]], ["hydrant", ["alt", "blend", "syll"]],
  //     y-e split digraph: a medial y takes a silent e exactly like i-e (/ī/).
  ["type", ["alt", "magice"]], ["byte", ["alt", "magice"]], ["hype", ["alt", "magice"]],
  ["tyre", ["alt", "magice"]], ["style", ["alt", "blend", "magice"]],  // st blend; not -le
  ["thyme", ["alt", "digraph", "magice"]],
  //     A medial y AFTER an earlier vowel closes that syllable (every·thing,
  //     any·way, ba·by·sit, la·dy·bird) — final y's /ē/, so final y's `team`
  //     bucket. This keeps compounds exactly as decodable as their head word.
  ["everything", ["digraph", "endings", "open", "rctrl", "syll", "team"]], ["anyway", ["open", "syll", "team"]],
  ["anybody", ["open", "syll", "team"]], ["everybody", ["open", "rctrl", "syll", "team"]],
  ["babysit", ["open", "syll", "team"]], ["ladybird", ["open", "rctrl", "syll", "team"]],
  //     guards — consonant y (before a vowel) and vowel-team y are untouched:
  ["yak", []], ["yell", ["double"]], ["crayon", ["blend", "syll", "team"]],
  ["boys", ["diph", "endings"]], ["keys", ["endings", "team"]],
  ["lawyer", ["diph", "rctrl", "syll"]], ["backyard", ["digraph", "rctrl", "syll"]],

  // --- consonant-le syllable (-le) = advanced code (roadmap #2 hardening).
  //     A word ending <consonant>+le carries a final syllabic /əl/: lit·tle,
  //     gen·tle, ta·ble. Modelled as `adv` (PHASES lists "gentle" as its
  //     example). The consonant right before -le joins that syllable, so the
  //     cross-boundary blend the engine used to read is gone (gentle was a false
  //     n+t/t+l blend, table a false b+l, purple a false p+l). When that
  //     consonant is DOUBLED (little, apple, middle) the split falls BETWEEN the
  //     pair, so the double still scores AND the -le adds `adv`. Vowel-before-le
  //     (pale, role, while) is magic-e and y-before-le (style) is the y-vowel
  //     gap — neither is consonant-le, so both are untouched (locked below/above).
  //     doubled consonant + -le (split between the double; double still counts):
  ["little", ["adv", "double"]], ["apple", ["adv", "double"]],
  ["bottle", ["adv", "double"]], ["middle", ["adv", "double"]],
  ["giggle", ["adv", "double"]], ["puddle", ["adv", "double"]],
  ["kettle", ["adv", "double"]], ["cattle", ["adv", "double"]],
  ["pebble", ["adv", "double"]], ["paddle", ["adv", "double"]],
  ["nibble", ["adv", "double"]], ["dazzle", ["adv", "double"]],
  //     single consonant + -le (the consonant joins the -le syllable; no blend):
  ["gentle", ["adv"]], ["candle", ["adv"]], ["handle", ["adv"]],
  ["bundle", ["adv"]], ["table", ["adv"]], ["cable", ["adv"]],
  ["bugle", ["adv"]], ["title", ["adv"]], ["simple", ["adv"]],
  ["sample", ["adv"]], ["uncle", ["adv"]], ["ankle", ["adv"]],
  ["tumble", ["adv"]],
  //     -le composes with the code around it:
  ["purple", ["adv", "rctrl"]], ["turtle", ["adv", "rctrl"]],   // ur/tle
  ["marble", ["adv", "rctrl"]], ["circle", ["adv", "alt", "rctrl"]],   // soft-c 'cir' + -le
  ["twinkle", ["adv", "blend"]], ["sprinkle", ["adv", "blend"]],// tw/spr blend + -le
  ["stumble", ["adv", "blend"]], ["cradle", ["adv", "blend"]],
  ["sparkle", ["adv", "blend", "rctrl"]],                       // sp blend + ar + -le

  // --- syllable-boundary consonants are NOT a blend (roadmap #2 hardening).
  //     Two consonants BETWEEN two vowels usually straddle a syllable split
  //     (VC|CV): sun·set, nap·kin, pic·nic are two plain closed syllables, and
  //     the reader never blends n+s or p+k inside one syllable. UK Phase 2
  //     teaches exactly these words (sunset, picnic, laptop) alongside CVC,
  //     before adjacent consonants. The split is only taken when safe — a run
  //     of 3, a word-edge pair, a legal onset (st, sk, bl…), glued "nk", or a
  //     pair before a silent final e all KEEP the blend (see the guards below
  //     and in NEEDS_SKILL).
  ["sunset", ["syll"]], ["napkin", ["syll"]], ["picnic", ["syll"]], ["laptop", ["syll"]],
  ["kidnap", ["syll"]], ["upset", ["syll"]], ["admit", ["syll"]], ["helmet", ["syll"]],
  ["magnet", ["syll"]], ["cactus", ["syll"]], ["tomcat", ["syll"]], ["signal", ["syll"]],
  ["until", ["syll"]], ["velvet", ["syll"]], ["index", ["syll"]],             // x is one letter /ks/
  ["unless", ["double", "syll"]],                                   // un·less + ss
  ["selfish", ["digraph", "syll"]],                                 // sel·fish + sh
  ["winter", ["rctrl", "syll"]], ["under", ["rctrl", "syll"]], ["doctor", ["rctrl", "syll"]],
  ["candy", ["syll", "team"]], ["window", ["syll", "team"]], ["sixty", ["syll", "team"]],
  ["pancake", ["magice", "syll"]], ["reptile", ["magice", "syll"]], ["inside", ["magice", "syll"]],
  ["cancel", ["alt", "syll"]],                                      // can·cel, soft c
  ["success", ["alt", "double", "syll"]],                           // suc·cess: /k/|/s/, not a blend
  //     guards — each KEEPS its blend:
  ["basket", ["blend", "syll"]], ["mister", ["blend", "rctrl", "syll"]],     // s+stop is a legal onset: ambiguous, stay strict
  ["secret", ["blend", "open", "syll"]],                            // se·cret: cr is an onset blend, so the e may be open
  ["dentist", ["blend", "syll"]],                                   // den·tist, but -st is a real final blend
  ["insect", ["blend", "syll"]],                                    // in·sect, but -ct is a real final blend
  ["hamster", ["blend", "rctrl", "syll"]], ["pumpkin", ["blend", "syll"]],  // run of 3: a real blend on one side
  ["monkey", ["blend", "syll", "team"]],                            // glued "nk" /ŋk/ stays flagged
  ["else", ["blend"]], ["rinse", ["blend"]],                // final e is silent: ls/ns is a final cluster
  ["hand", ["blend"]], ["stop", ["blend"]],                 // word-edge pairs are true blends

  // --- long vowels in closed syllables = alternative pronunciations (roadmap #2).
  //     kind/find/child/old/cold/most/roll have a LONG vowel in a closed
  //     syllable — UFLI's "closed syllable exceptions" (-ild -ind -old -olt
  //     -ost -oll), UK Phase 5's i=/igh/ (find) and o=/oa/ (cold). The engine
  //     read them as short CVC + blend: a FALSE green for any group with
  //     blends but no alternative pronunciations. The final nd/ld/lt/st IS a real blend,
  //     so it still counts; roll's ll still scores as a double.
  ["kind", ["alt", "blend"]], ["find", ["alt", "blend"]], ["mind", ["alt", "blend"]],
  ["blind", ["alt", "blend"]], ["behind", ["alt", "blend", "open", "syll"]], ["remind", ["alt", "blend", "open", "syll"]],
  ["wild", ["alt", "blend"]], ["mild", ["alt", "blend"]], ["child", ["alt", "blend", "digraph"]],
  ["old", ["alt", "blend"]], ["cold", ["alt", "blend"]], ["gold", ["alt", "blend"]],
  ["told", ["alt", "blend"]], ["hold", ["alt", "blend"]], ["scold", ["alt", "blend"]],
  ["bolt", ["alt", "blend"]], ["colt", ["alt", "blend"]], ["jolt", ["alt", "blend"]],
  ["most", ["alt", "blend"]], ["post", ["alt", "blend"]], ["host", ["alt", "blend"]],
  ["ghost", ["alt", "blend"]],
  ["roll", ["alt", "double"]], ["troll", ["alt", "blend", "double"]], ["scroll", ["alt", "blend", "double"]],
  //     inflected / suffixed forms keep the long vowel:
  ["finding", ["alt", "blend", "endings"]], ["kinds", ["alt", "blend", "endings"]],
  ["holding", ["alt", "blend", "endings"]], ["bolted", ["alt", "blend", "endings"]],
  ["rolled", ["alt", "double", "endings"]], ["posts", ["alt", "blend", "endings"]],
  ["kindness", ["alt", "blend", "double", "syll"]], ["wildest", ["alt", "blend", "syll"]],
  ["golden", ["alt", "syll"]], ["colder", ["alt", "rctrl", "syll"]], ["mostly", ["alt", "blend", "syll", "team"]],
  //     silent l (walk, half, calm, folk): the l isn't sounded, so there is
  //     no lk/lf/lm blend — the a/o + silent l is the alternative pattern.
  ["walk", ["alt"]], ["talk", ["alt"]], ["chalk", ["alt", "digraph"]], ["stalk", ["alt", "blend"]],
  ["half", ["alt"]], ["calf", ["alt"]], ["calm", ["alt"]], ["palm", ["alt"]],
  ["folk", ["alt"]], ["yolk", ["alt"]], ["walked", ["alt", "endings"]],
  //     guards — each KEEPS its short vowel (no alt):
  ["wind", ["blend"]],                                      // the noun (a windy day): short i
  ["children", ["blend", "digraph", "syll"]],                       // chil·dren: short i
  ["build", ["adv", "blend"]],                                     // u+i, not the -ild pattern
  ["doll", ["double"]], ["pollen", ["double"]],             // short o before ll
  ["lost", ["blend"]], ["cost", ["blend"]], ["frost", ["blend"]], // short -ost
  ["milk", ["blend"]], ["help", ["blend"]], ["belt", ["blend"]], // l is sounded: a real blend

  // --- -all (ball, call, tall, small) = alternative pronunciation (roadmap #2).
  //     The a before a final ll says /aw/, not short a — UFLI's "glued sound",
  //     UK Phase 5's a for /or/. The engine read it as short a + the floss
  //     double: a FALSE green for every preset. The ll still scores `double`.
  ["ball", ["alt", "double"]], ["call", ["alt", "double"]], ["tall", ["alt", "double"]],
  ["fall", ["alt", "double"]], ["hall", ["alt", "double"]], ["wall", ["alt", "double"]],
  ["small", ["alt", "blend", "double"]], ["stall", ["alt", "blend", "double"]],
  ["squall", ["alt", "double"]],                            // qu + all is the pattern too
  ["recall", ["alt", "double", "open", "syll"]], ["install", ["alt", "blend", "double", "syll"]],
  ["football", ["alt", "double", "syll", "team"]], ["waterfall", ["alt", "double", "rctrl", "syll"]],
  //     inflected / suffixed forms keep the /aw/:
  ["balls", ["alt", "double", "endings"]], ["walls", ["alt", "double", "endings"]],
  ["calling", ["alt", "double", "endings"]], ["called", ["alt", "double", "endings"]],
  ["fallen", ["alt", "double"]], ["taller", ["alt", "double", "rctrl"]],
  ["smallest", ["alt", "blend", "double"]],
  //     guards — the ll after a short a that isn't the end of the base:
  ["shall", ["digraph", "double"]],                         // short a: the listed exception
  ["tally", ["double", "team"]], ["ballet", ["double"]],    // all + more letters: not -all
  ["alley", ["double", "team"]], ["gallon", ["double"]], ["shallow", ["digraph", "double", "team"]],
  ["really", ["double", "team"]],                           // ea + ll: no -all at all

  // --- syllables (roadmap #2 hardening). Only a VC|CV split used to need
  //     `syll`, so every other multi-syllable word scored as one short-vowel
  //     CVC word: robot, music, lion, station were green even for SoR
  //     Kindergarten. FALSE greens, all of them.
  //     One consonant between two vowels (VCV): the first vowel may end its
  //     syllable and be long (ro·bot) or close it and be short (lem·on). Only
  //     knowing the word tells you, so it needs Open syllables (`open`).
  ["robot", ["open", "syll"]], ["music", ["open", "syll"]], ["open", ["open", "syll"]],
  ["hotel", ["open", "syll"]], ["pilot", ["open", "syll"]], ["human", ["open", "syll"]],
  ["unit", ["open", "syll"]], ["menu", ["open", "syll"]], ["silent", ["blend", "open", "syll"]],
  ["tiger", ["open", "rctrl", "syll"]],
  ["lemon", ["open", "syll"]], ["seven", ["open", "syll"]], ["visit", ["open", "syll"]],
  //     two vowels side by side that aren't a team: the first ends its syllable
  ["lion", ["open", "syll"]], ["radio", ["open", "syll"]], ["piano", ["open", "syll"]],
  ["video", ["open", "syll"]], ["neon", ["open", "syll"]],
  //     ...but "ui" is one rare vowel spelling, not two syllables: advanced code
  ["fruit", ["adv", "blend"]], ["suit", ["adv"]], ["built", ["adv", "blend"]],
  //     -tion / -sion / -ssion is advanced code (one chunk: /shən/ /zhən/)
  ["station", ["adv", "blend", "syll"]], ["nation", ["adv", "syll"]], ["action", ["adv", "syll"]],
  ["motion", ["adv", "syll"]], ["vision", ["adv", "syll"]], ["mission", ["adv", "syll"]],
  ["question", ["adv", "syll"]],                            // the s before -tion closes ques-
  //     a digraph, x, qu or a double between the vowels closes the first
  //     syllable, so the vowel is short and no open syllable is needed
  ["bishop", ["digraph", "syll"]], ["rocket", ["digraph", "syll"]], ["taxi", ["syll"]],
  ["liquid", ["syll"]],                                     // (doubles: rabbit, kitten — see above)
  //     compounds with no consonant pair between the vowels still have two syllables
  ["lunchbox", ["digraph", "syll"]], ["hotdog", ["syll"]],
  //     a silent final e is not a syllable
  ["sense", ["blend"]], ["solve", ["blend"]], ["twelve", ["blend"]],
  // --- the 2026-10-06 false greens (roadmap #2). Each was green for a group
  //     taught only blends / magic-e / r-control, but a child sounding it
  //     out letter by letter says the wrong word.
  // -aste: the e reaches back across st, so the a is long (alt, like most/post)
  ["taste", ["alt", "blend"]], ["waste", ["alt", "blend"]], ["paste", ["alt", "blend"]],
  ["haste", ["alt", "blend"]], ["tasted", ["alt", "blend", "endings"]],
  ["wasting", ["alt", "blend", "endings"]], ["tastes", ["alt", "blend", "endings"]],
  ["tasty", ["alt", "blend", "syll", "team"]],
  // …while their short-a neighbours keep a short a
  ["past", ["blend"]], ["fasted", ["blend", "endings"]], ["lasting", ["blend", "endings"]],
  ["nasty", ["blend", "syll", "team"]], ["vast", ["blend"]],
  // silent t (-sten / -ften), silent g (gn at a word edge), silent h / s
  ["listen", ["adv", "syll"]], ["listening", ["adv", "endings", "syll"]],
  ["fasten", ["adv", "syll"]], ["often", ["adv", "syll"]], ["soften", ["adv", "syll"]],
  ["hasten", ["adv", "alt", "syll"]],
  ["sign", ["adv"]], ["signs", ["adv", "endings"]], ["gnat", ["adv"]], ["gnome", ["adv", "magice"]],
  ["design", ["adv", "open", "syll"]],
  ["hour", ["adv", "diph"]], ["hours", ["adv", "diph", "endings"]], ["island", ["adv", "blend", "syll"]],
  ["honest", ["adv", "blend", "open", "syll"]],
  // a gn in the middle of a word is sounded: no silent letter
  ["signal", ["syll"]], ["magnet", ["syll"]],
  // ch as /k/: chr- / chl- at the start, and a short list of common words
  ["christmas", ["adv", "blend", "syll"]], ["chris", ["adv"]], ["chrome", ["adv", "magice"]],
  ["chorus", ["adv", "rctrl", "syll"]], ["echo", ["adv", "syll"]], ["ache", ["adv"]],
  ["aches", ["adv", "endings"]], ["anchor", ["adv", "rctrl", "syll"]],
  // …and an ordinary ch, including before a consonant in a compound, stays /ch/
  ["chin", ["digraph"]], ["lunchbox", ["digraph", "syll"]], ["chop", ["digraph"]],
  // -ture is one chunk, /cher/; the vowel before it is open only when nothing comes between
  ["picture", ["adv", "syll"]], ["pictures", ["adv", "endings", "syll"]], ["pictured", ["adv", "endings", "syll"]],
  ["mixture", ["adv", "syll"]], ["adventure", ["adv", "syll"]],
  ["nature", ["adv", "open", "syll"]], ["future", ["adv", "open", "syll"]],
  ["creature", ["adv", "blend", "syll", "team"]],
  // quiet / diet: i·e is two vowels, not the ie team
  ["quiet", ["open", "syll"]], ["diet", ["open", "syll"]], ["quietly", ["open", "syll", "team"]],
  ["field", ["blend", "team"]], ["pie", ["team"]],
  // mb: silent at the end of a word or word part, sounded between vowels and before l / r
  ["lamb", ["adv"]], ["climb", ["adv", "blend"]], ["climbing", ["adv", "blend", "endings"]],
  ["climber", ["adv", "blend", "rctrl", "syll"]], ["thumbnail", ["adv", "digraph", "syll", "team"]],
  ["number", ["rctrl", "syll"]], ["timber", ["rctrl", "syll"]], ["member", ["rctrl", "syll"]],
  ["umbrella", ["blend", "double", "syll"]],
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
  // open syllables / two-syllable words were scored as short CVC: false greens
  ["robot", "uk-early", ["open"]],
  ["music", "uk-early", ["open"]],
  ["lion", "uk-early", ["open"]],
  ["robot", "sor-k", ["open", "syll"]],
  ["hotdog", "sor-k", ["syll"]],
  ["station", "uk-y1", ["adv"]],
  ["fruit", "uk-y1", ["adv"]],
  ["wait", "uk-early", ["team"]],   // was a false green (wa|i|t); now w + ai + t
  // -eed / -ued / -oed were stripped as "-ed", hiding the vowel team: false greens
  ["seed", "uk-early", ["team"]],
  ["need", "uk-early", ["team"]],
  ["feed", "uk-early", ["team"]],
  ["speed", "uk-early", ["team"]],
  ["glued", "uk-early", ["team"]],
  ["toed", "uk-early", ["team"]],
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
  // Soft c is an alternative pronunciation (uk-early has no `alt`; blend/double it does)
  ["cent", "uk-early", ["alt"]],
  ["cell", "uk-early", ["alt"]],
  ["cinema", "uk-early", ["alt", "open"]],   // ci·ne·ma: soft c + open syllables
  ["ice", "uk-early", ["alt", "magice"]],   // soft c AND magic-e both untaught
  ["face", "uk-early", ["alt", "magice"]],
  // Final y = a long vowel, so a CVC/blends group hasn't been taught it yet.
  ["happy", "uk-early", ["team"]],          // double taught, y=/ē/ (team) is not
  ["funny", "uk-early", ["team"]],
  ["cry", "uk-early", ["team"]],            // fl/cr blend taught, y=/ī/ (team) is not
  ["city", "uk-early", ["alt", "open", "team"]],    // soft c, y-vowel, and VCV (ci·ty or cit·y?)
  // Silent-e / y hidden by an inflection: these were FALSE greens (read as
  // short CVC once -ing/-ed/-es was stripped). Endings are taught at
  // Reception, the long-vowel code underneath them is not.
  ["making", "uk-early", ["magice"]],
  ["hoped", "uk-early", ["magice"]],
  ["liked", "uk-early", ["magice"]],
  ["racing", "uk-early", ["alt", "magice"]],
  ["raging", "uk-early", ["alt", "magice"]],
  ["noses", "uk-early", ["magice"]],
  ["cried", "uk-early", ["team"]],
  ["crying", "uk-early", ["team"]],
  ["giggled", "uk-early", ["adv"]],
  ["city", "sor-g1", ["alt"]],              // y-vowel taught; only soft c blocks it
  // Soft g at word-final "-ge" is an alternative pronunciation (`alt`), so a
  // group without it can't decode it yet. Under sor-g1 (long-vowel code taught,
  // but no alternatives) a "-ge" word is blocked by exactly the soft-g rule —
  // a clean isolation of the feature; under uk-early the untaught long vowel /
  // r-control shows too. (uk-y1 and ufli-g1 now teach `alt`: DECODABLE_UNDER.)
  ["page", "uk-early", ["alt", "magice"]],  // soft g AND magic-e both untaught
  ["large", "uk-early", ["alt", "rctrl"]],  // soft g AND r-controlled both untaught
  ["change", "uk-early", ["alt"]],          // blend + digraph taught; only soft g blocks it
  ["page", "sor-g1", ["alt"]],              // long a taught; only soft g blocks it
  ["huge", "sor-g1", ["alt"]],
  ["large", "sor-g1", ["alt", "rctrl"]],    // sor-g1 has no r-control either
  ["orange", "sor-g1", ["alt", "rctrl"]],
  // The split itself: Year 1 / Grade 1 now read the alternatives, but the truly
  // advanced code left in `adv` (kn wr mb -dge -le) still blocks them.
  ["knot", "uk-y1", ["adv"]],
  ["wrap", "ufli-g1", ["adv"]],
  ["lamb", "uk-y1", ["adv"]],
  // 2026-10-06 false greens: each of these was green for the group named
  ["taste", "uk-early", ["alt"]],           // was short a + st: "tast"
  ["wasted", "sor-g1", ["alt"]],
  ["listen", "uk-early", ["adv"]],          // was a false s+t blend: "lis-ten"
  ["often", "uk-y1", ["adv"]],
  ["sign", "uk-early", ["adv"]],            // was a false g+n blend
  ["hour", "uk-y1", ["adv"]],
  ["island", "uk-y1", ["adv"]],
  ["christmas", "uk-early", ["adv"]],       // was ch = /ch/: "chris-mas"
  ["echo", "uk-y1", ["adv"]],
  ["picture", "uk-y1", ["adv"]],            // was t + ur + magic-e: "pic-tyoor"
  ["nature", "ufli-g1", ["adv"]],
  ["quiet", "uk-early", ["open"]],          // was the ie team: one syllable
  ["diet", "sor-k", ["open", "syll"]],
  ["badge", "uk-y1", ["adv"]],
  ["bridge", "ufli-g1", ["adv"]],
  ["circle", "uk-y1", ["adv"]],             // soft c taught (alt); only the -le blocks it
  ["circle", "sor-g1", ["adv", "alt", "rctrl"]],
  // Consonant-le (-le) is advanced code — a group without `adv` can't decode it
  // yet, even when the rest of the word is basic (the old false blend is gone).
  ["little", "uk-early", ["adv"]],          // double taught; only the -le blocks it
  ["gentle", "uk-early", ["adv"]],
  ["table", "uk-early", ["adv"]],
  ["purple", "uk-early", ["adv", "rctrl"]], // -le AND r-controlled both untaught
  // Under uk-y1 (all long-vowel code but NOT advanced) only the -le blocks it.
  ["little", "uk-y1", ["adv"]],
  ["gentle", "uk-y1", ["adv"]],
  ["turtle", "uk-y1", ["adv"]],             // ur taught; only the -le blocks it
  // Syllable-boundary guards: a CVC-only group still can't read a word whose
  // blend is real — the split rule must never turn these into false greens.
  ["basket", "cvc", ["blend", "syll"]],
  ["dentist", "cvc", ["blend", "syll"]],
  ["insect", "cvc", ["blend", "syll"]],
  ["pumpkin", "cvc", ["blend", "syll"]],
  ["else", "cvc", ["blend"]],
  // "Two-syllable words" (syll) is its own skill: a CVC group (or SoR
  // Kindergarten, which teaches blends but not syllable division yet) can't
  // read a VC|CV word until it's ticked — and it never needs blends.
  ["sunset", "cvc", ["syll"]],
  ["picnic", "cvc", ["syll"]],
  ["napkin", "sor-k", ["syll"]],
  ["winter", "sor-k", ["rctrl", "syll"]],
  ["dentist", "sor-k", ["syll"]],           // blend taught; the n|t split is not
  // Medial y (y as the first vowel) is an alternative pronunciation. With
  // blends taught these were FALSE GREENS (the y read as a blend) — now, under
  // sor-g1 (no `alt`), each is blocked by exactly the y-vowel.
  ["gym", "sor-g1", ["alt"]],
  ["myth", "sor-g1", ["alt"]],
  ["type", "sor-g1", ["alt"]],              // magic-e taught; only y-e's y blocks it
  ["style", "sor-g1", ["alt"]],
  ["system", "sor-g1", ["alt"]],
  ["crystal", "sor-g1", ["alt"]],
  ["type", "uk-early", ["alt", "magice"]],  // y-vowel AND magic-e both untaught
  ["gym", "cvc", ["alt"]],                  // no spurious blend: only the y blocks it
  // Long vowels in closed syllables + silent l are alternative pronunciations. Each of these
  // was a FALSE GREEN for every preset with blends (read as short CVC + blend):
  // a Reception group was told "kind", "old" and "walk" were decodable.
  ["kind", "uk-early", ["alt"]],
  ["find", "uk-early", ["alt"]],
  ["child", "uk-early", ["alt"]],
  ["old", "uk-early", ["alt"]],
  ["cold", "uk-early", ["alt"]],
  ["most", "uk-early", ["alt"]],
  ["roll", "uk-early", ["alt"]],
  ["finding", "uk-early", ["alt"]],         // endings taught; the long i is not
  ["walk", "uk-early", ["alt"]],
  ["half", "uk-early", ["alt"]],
  ["told", "sor-k", ["alt"]],
  ["walk", "cvc", ["alt"]],                 // no spurious lk blend: only the silent l blocks it
  ["kind", "sor-g1", ["alt"]],
  ["gold", "sor-g1", ["alt"]],
  ["walk", "sor-g1", ["alt"]],
  // -all: the a says /aw/. Every preset without `alt` was told ball/call/tall
  // were decodable (short a + the floss double).
  ["ball", "uk-early", ["alt"]],
  ["call", "uk-early", ["alt"]],
  ["small", "uk-early", ["alt"]],
  ["called", "uk-early", ["alt"]],          // endings taught; the /aw/ is not
  ["wall", "uk-early", ["alt"]],
  ["tall", "cvc", ["alt"]],
  ["fall", "sor-k", ["alt"]],
  ["ball", "sor-g1", ["alt"]],
  // `alt` can now be ticked on its own. A Reception group taught the
  // alternatives but not magic-e must NOT read the y-e words' inflections
  // (they were scored whole — "typ" had no vowel — and needed only the y).
  ["typing", "alt-early", ["magice"]],
  ["typed", "alt-early", ["magice"]],
  ["types", "alt-early", ["magice"]],
  ["styled", "alt-early", ["magice"]],
  ["page", "alt-early", ["magice"]],        // soft g taught; the long a is not
  ["little", "alt-early", ["adv"]],         // alt never unlocks the -le syllable
  ["knot", "alt-early", ["adv"]],
];

/* A "cvc" convenience preset (cvc + double) used by NEEDS_SKILL and
   DECODABLE_UNDER — the app's "Reset to CVC" button state. */
const CVC_PRESET = ["cvc", "double"];
/* CVC + "Two-syllable words": a UK Phase 2 group that reads sunset / picnic
   before any blends are taught. */
const CVC_SYLL_PRESET = ["cvc", "double", "syll"];
/* UK Reception + "Alternative pronunciations": a custom group taught soft c,
   kind/old, walk and gym-type y, but no long-vowel code — the case the `alt`
   split makes possible. */
const ALT_EARLY_PRESET = ["cvc", "double", "digraph", "blend", "syll", "endings", "alt"];

/* ---------------------------------------------------------------
   3. DECODABLE UNDER A LIMITED SET — the positive side: these words
   ARE decodable for the given preset (cat === 'ok'). Guards against a
   hardening change that makes the engine too strict.
   --------------------------------------------------------------- */
const DECODABLE_UNDER = [
  ["cat", "uk-early"], ["hand", "uk-early"], ["ship", "uk-early"],
  // short-vowel neighbours of the closed-syllable exceptions stay decodable
  ["wind", "uk-early"], ["lost", "uk-early"], ["doll", "uk-early"], ["milk", "uk-early"],
  ["children", "uk-early"], ["kind", "all"], ["walk", "all"], ["roll", "all"],
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
  // consonant-le words decode once advanced code is taught (the `all` preset)
  ["little", "all"], ["gentle", "all"], ["table", "all"], ["purple", "all"],
  // word-final soft-g "-ge" words decode once alternative pronunciations are
  // taught — UK Year 1 / UFLI Grade 1 teach them, no advanced code needed
  ["page", "all"], ["huge", "all"], ["large", "all"], ["charge", "all"],
  ["page", "uk-y1"], ["huge", "uk-y1"], ["large", "uk-y1"], ["orange", "ufli-g1"],
  // …and so do soft c, medial y, the closed-syllable long vowels and silent l
  ["city", "uk-y1"], ["ice", "uk-y1"], ["face", "ufli-g1"], ["dance", "uk-y1"],
  ["kind", "ufli-g1"], ["find", "uk-y1"], ["old", "uk-y1"], ["gold", "uk-y1"],
  ["most", "ufli-g1"], ["roll", "uk-y1"], ["child", "uk-y1"], ["walk", "uk-y1"],
  ["half", "ufli-g1"], ["gym", "uk-y1"], ["type", "ufli-g1"], ["crystal", "uk-y1"],
  // …and -all (ball, call, small) — a Year 1 / Grade 1 glued sound
  ["ball", "uk-y1"], ["call", "ufli-g1"], ["small", "uk-y1"], ["calling", "uk-y1"],
  ["ball", "all"], ["shall", "uk-early"], ["tally", "uk-y1"],
  // drop-e / y->i inflections decode once magic-e + teams are taught (uk-y1)
  ["making", "uk-y1"], ["hoped", "uk-y1"], ["gazed", "uk-y1"], ["noses", "uk-y1"],
  ["cried", "uk-y1"], ["crying", "uk-y1"],
  ["change", "all"], ["orange", "all"], ["sponge", "all"],
  // VC|CV two-syllable words are two plain closed syllables — decodable once
  // "Two-syllable words" (syll) is taught, with NO blend skill needed
  // (UK Phase 2 teaches sunset/picnic/laptop alongside CVC, before blends)
  ["sunset", "uk-early"], ["picnic", "uk-early"], ["napkin", "uk-y1"],
  ["laptop", "ufli-g1"], ["tomcat", "sor-g1"], ["pencil", "all"],
  ["sunset", "cvc-syll"], ["picnic", "cvc-syll"], ["napkin", "cvc-syll"],
  ["laptop", "cvc-syll"], ["tomcat", "cvc-syll"],
  // medial-y words decode under the everything preset too…
  ["gym", "all"], ["myth", "all"], ["type", "all"], ["system", "all"],
  // …while compounds whose medial y is a head word's final y stay exactly as
  // decodable as the head word (every / any are uk-y1 words)
  ["everything", "uk-y1"], ["everybody", "uk-y1"], ["anyway", "uk-y1"], ["babysit", "uk-y1"],
  // open syllables are taught with or soon after magic-e: Year 1 / G1 read them
  ["robot", "uk-y1"], ["music", "sor-g1"], ["lion", "ufli-g1"], ["lemon", "sor-g1"],
  // a digraph / x / double between the vowels keeps the vowel short: Reception reads it
  ["bishop", "uk-early"], ["rocket", "uk-early"], ["taxi", "uk-early"], ["hotdog", "uk-early"],
  // -aste words decode once alternative pronunciations are taught (Year 1 / G1)
  ["taste", "uk-y1"], ["waste", "ufli-g1"], ["tasty", "uk-y1"],
  // the mb between vowels was a false AMBER: both letters are sounded
  ["number", "uk-y1"], ["umbrella", "uk-early"], ["member", "uk-y1"],
  // quiet / diet are open syllables, read once open syllables are taught
  ["quiet", "uk-y1"], ["diet", "sor-g1"],
  // and everything new decodes under the everything preset
  ["listen", "all"], ["sign", "all"], ["christmas", "all"], ["picture", "all"], ["hour", "all"],
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
  // The two most common first-person words — both irregular whole words, both
  // stored capitalised in TRICKY and asserted here in their real (capital) form
  // to prove the case-insensitive lookup fires. "I" is a single letter naming a
  // long vowel /aɪ/ (not the short /ɪ/ a lone `i` grapheme would predict); "I'm"
  // is a contraction. Regressing either back to `ok` (decodable) is a build fail.
  "I", "I'm",
  // "all" — a Letters and Sounds Phase 3 tricky word, taught whole long before
  // the -all /aw/ pattern. With -all modelled it would otherwise be amber for
  // every Reception group, though it's on nearly every early heart-word list.
  "all",
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
  // Soft c (c=/s/ before e/i/y) is MODELLED as an alternative pronunciation
  // (`alt`) — see the "soft c"
  // block in DECODABLE (cent, ice, race, cell, space…). FINAL y as a vowel is
  // now modelled too — see the "final y = a VOWEL" block in DECODABLE (city,
  // happy, cry, fancy…), so city is fixed (alt+team) and promoted there.
  // MEDIAL y is modelled too — see the "medial y = a VOWEL" block in DECODABLE
  // (gym, myth, type, system…), so gym/myth/type are promoted there. Its old
  // residue — inflected y-e words (types, typed, typing) losing magic-e and
  // endings because the stripper wanted an a/e/i/o/u in the base — is FIXED
  // (it mattered once `alt` could be ticked without magic-e): see SILENT_E.
  // Soft g (g=/j/ before e/i/y). WORD-FINAL "-ge" is now MODELLED as an
  // alternative pronunciation (`alt`) — see the "soft g at word-final -ge" block in DECODABLE (page, large,
  // change, orange…). That position is exceptionless, so it's hard-asserted and
  // page/charge/etc. are promoted there. ONSET / MEDIAL soft g stays DELIBERATELY
  // unmodelled: a by-rule guess there is unsafe because hard-g-before-e/i/y is
  // extremely common (get, girl, gift, give, begin, finger, anger, longer, tiger,
  // eager, together, forget, target…), so a naive rule would mis-mark ordinary
  // words as advanced code — and a wrong mark in a phonics tool is worse than a
  // known gap. Reliable onset soft-g detection needs a lexicon, out of scope for
  // the by-rule engine, so gem/giant are locked to current (hard-g) behaviour.
  // (gym needs BOTH onset soft g and the medial-y vowel; both are `alt`, so the
  // medial-y rule already scores it correctly and it lives in DECODABLE.)
  { word: "gem", now: [], want: "advanced (onset soft g)", note: "onset g=/j/ unmodelled — shares its slot with get/girl/gift; scored as basic CVC" },
  { word: "giant", now: ["blend", "open", "syll"], want: "advanced (onset soft g)", note: "onset g=/j/ unmodelled; gi·ant's open i and two syllables ARE now read" },

  // Consonant-le syllable (little, apple, gentle, table, purple, uncle…) is now
  // modelled as advanced code (`adv`) — see the "consonant-le syllable" block in
  // DECODABLE. The consonant before -le joins that syllable, so the old false
  // cross-boundary blend (gentle n+t/t+l, table b+l) is gone, and where the -le
  // follows a double (little, apple) the double still scores. Promoted out of
  // KNOWN_LIMITATIONS. One residue stays unmodelled but does NOT change any skill
  // verdict: the OPEN-SYLLABLE long vowel of ta·ble / bu·gle / ti·tle (long a/u/i)
  // is scored as a short cvc vowel — a vowel-length nuance PHASES has no skill for
  // (open syllables aren't a taught skill), not a wrong decodability call.

  // Syllable-boundary consonants (sunset, napkin, picnic…) are now read as a
  // VC|CV split, not a blend — promoted to the DECODABLE corpus (see the
  // "syllable-boundary" block there). One residue stays: when the medial pair
  // is ALSO a legal onset cluster (sk, st, sp…) the split is ambiguous
  // (bas·ket vs. a·stir / se·cret), so the engine stays strict and keeps the
  // blend. Stricter is the safe direction — never a false green.
  { word: "basket", now: ["blend", "syll"], want: "bas+ket — 'sk' split across syllables", note: "medial pair is also a legal onset (sk): ambiguous, kept as a blend" },

  // Doubled medial consonants (rabbit, kitten, tennis, happen, button…) are now
  // scored as `double`, not a spurious blend — promoted to the DECODABLE corpus
  // (see the "doubled consonants" block there). Left this note as a signpost.

  // final s / es / ed stripped as an inflection when it isn't one.
  // FIXED for the clear cases (bus, his, miss, class, this, thing, sled …) —
  // see the DECODABLE "NON-inflections" block, now hard-asserted. Two harder
  // residues remain, each blocked by a *different* engine gap:
  // "-eed": seed/need/speed are ee + d (FIXED: no longer stripped as se|ed and
  // hard-asserted in NEEDS_SKILL). The residue: freed/agreed really are free+d /
  // agree+d, and without a lexicon they read as whole words, so they lose
  // `endings`. Endings is taught before teams in every preset, so this never
  // turns a word green that a group can't read.
  { word: "freed", now: ["blend", "team"], want: "free + d (blend, team, endings)", note: "-eed left whole so seed/need keep the ee team; free+d can't be told apart without a lexicon" },
  { word: "hundred", now: ["blend", "endings"], want: "hun+dred; '-red' is not an -ed inflection", note: "base 'hundr' still has a vowel, so the -ed guard can't reject it — needs a coda/syllable check" },

  // greedy 'wa' grapheme (for want/was) eats w+a before a vowel team — FIXED.
  // The segmenter now drops the "wa" match when it's followed by 'i', so the
  // "ai" team is read (wait -> w + ai + t, waist -> w + ai + s+t). Promoted to
  // the DECODABLE corpus (wait/wail/waif/waist) and asserted as a NEEDS_SKILL
  // false-green regression (wait @ uk-early now needs `team`). Left this
  // signpost so the fix is legible. "ay" (way, sway) is untouched — it already
  // scored `team` via the final-y rule — and "wa"+consonant (wash, swan, want)
  // keeps its current scoring.

  // FIXED: the pronoun "I" and the contraction "I'm" were stored capitalised in
  // TRICKY, but analyseWord lowercases each token before the lookup, so they
  // never matched and scored as decodable. TRICKY is now lowercased on
  // construction, so both fire; promoted to the HEART corpus (asserted `tricky`).
];

/* ---------------------------------------------------------------
   8. SHORTEST-PATH PLANS — computePlan's greedy multi-skill mini-plan
   ("teach these 2 and the whole text works", roadmap #4). Each case
   gives the amber words' missing-skill lists (already taught-independent,
   exactly what analyseWord hands the UI) and the ORDERED plan computePlan
   must return: the untaught skill that unlocks the most still-locked words
   first, ties broken by teaching order, accumulated until every word is
   green. The runner also asserts the key property directly — teaching the
   whole plan unlocks every listed word (100%). Missing lists only ever hold
   untaught skills, so no case plants a taught skill inside one.
   --------------------------------------------------------------- */
const PLANS = [
  // two words, one distinct single skill each -> teach both, in teaching order
  { missing: [["team"], ["diph"]], plan: ["team", "diph"] },
  // one word needing two skills: neither unlocks alone, so the plan is both
  { missing: [["magice", "team"]], plan: ["magice", "team"] },
  // quick win first: {team} greens a word now, then {team,magice} needs magice too
  { missing: [["team"], ["team", "magice"]], plan: ["team", "magice"] },
  // leverage beats teaching order: the skill shared by more words leads
  { missing: [["diph"], ["diph"], ["team"]], plan: ["diph", "team"] },
  // three distinct singles -> all three, teaching order (magice < team < rctrl)
  { missing: [["rctrl"], ["magice"], ["team"]], plan: ["magice", "team", "rctrl"] },
];

/* ---------------------------------------------------------------
   9. INFLECTION SPELLING — the correct-spelling generator (roadmap #3).
   `inflect(base, ending)` must spell every regular English inflection the
   way English spells it, and return null wherever no reliable rule applies
   (irregular past tense, ambiguous multi-syllable doubling). A wrong
   generated spelling in a phonics tool is the worst kind of bug, so these
   are hard, exact-string assertions — the safety net that proves accuracy
   instead of eyeballing it. `null` is asserted as literally null.
   ending is one of "s" | "ing" | "ed".
   --------------------------------------------------------------- */
const INFLECT = [
  // plain add
  ["look", "s", "looks"], ["look", "ing", "looking"], ["look", "ed", "looked"],
  ["yell", "ed", "yelled"], ["yell", "s", "yells"], ["call", "s", "calls"],
  ["end", "ed", "ended"], ["end", "ing", "ending"], ["mend", "ed", "mended"],
  ["halt", "ed", "halted"], ["sprint", "ed", "sprinted"], ["sprint", "ing", "sprinting"],
  ["shout", "ed", "shouted"], ["scream", "ed", "screamed"], ["peek", "ed", "peeked"],
  // double the final consonant (single stressed CVC)
  ["hop", "ed", "hopped"], ["hop", "ing", "hopping"], ["hop", "s", "hops"],
  ["stop", "ed", "stopped"], ["stop", "ing", "stopping"], ["spot", "ed", "spotted"],
  ["skip", "ed", "skipped"], ["jog", "ed", "jogged"], ["trot", "ed", "trotted"],
  ["grab", "ed", "grabbed"], ["get", "ing", "getting"],
  // drop the silent e
  ["race", "ing", "racing"], ["race", "ed", "raced"], ["race", "s", "races"],
  ["gaze", "ing", "gazing"], ["gaze", "ed", "gazed"], ["bounce", "ed", "bounced"],
  ["stare", "ing", "staring"], ["stare", "ed", "stared"],
  // consonant + y -> ies / ied  (vowel + y just adds s / ed)
  ["cry", "s", "cries"], ["cry", "ed", "cried"], ["cry", "ing", "crying"],
  ["play", "s", "plays"], ["play", "ed", "played"], ["boy", "s", "boys"],
  // sibilant -> es
  ["watch", "s", "watches"], ["fix", "s", "fixes"], ["fix", "ed", "fixed"],
  ["dash", "s", "dashes"], ["dash", "ed", "dashed"], ["finish", "s", "finishes"],
  // -ing / -s stay regular even for irregular-past verbs
  ["run", "ing", "running"], ["run", "s", "runs"], ["see", "ing", "seeing"],
  ["make", "ing", "making"], ["make", "s", "makes"], ["take", "ing", "taking"],
  ["find", "ing", "finding"], ["build", "ing", "building"], ["spring", "ing", "springing"],
  // irregular past tense -> null (never *seed / *runned / *maked / *finded / *getted)
  ["see", "ed", null], ["run", "ed", null], ["make", "ed", null], ["take", "ed", null],
  ["find", "ed", null], ["build", "ed", null], ["get", "ed", null], ["spring", "ed", null],
  // multi-syllable CVC — doubling hangs on stress we can't read -> null (never *begining)
  ["begin", "ed", null], ["begin", "ing", null], ["begin", "s", "begins"],
];

/* ---------------------------------------------------------------
   10. FIX-IT SUGGESTIONS — inflection-aware swaps (roadmap #3).
   suggestFor(word) returns up to three decodable swaps. For an inflected
   amber word every swap carries the SAME ending, correctly spelled, and must
   still be decodable for the group — so the returned list scales with both the
   ending and the taught set. Exact-order arrays (cluster order, capped at 3);
   the runner also asserts every returned form is decodable under the preset.
   --------------------------------------------------------------- */
const SUGGEST = [
  // -ed swaps: base needs an untaught skill, cluster-mates' -ed forms don't
  // (gazed/cried used to be offered here — FALSE greens: the engine read the
  // drop-e / y->i forms as short CVC. They now need magic-e / y-as-a-vowel, so
  // a Reception group is no longer offered swaps it can't decode.)
  { word: "looked",  preset: "uk-early", want: ["spotted", "watched"] },
  { word: "leaped",  preset: "uk-early", want: ["hopped", "jumped", "skipped"] },
  { word: "watched", preset: "uk-early", want: ["spotted"] },
  // (called / calls used to be offered here — FALSE greens: the a of -all is
  // /aw/, an alternative pronunciation Reception hasn't been taught.)
  { word: "yelled",  preset: "uk-early", want: [] },
  { word: "yelled",  preset: "uk-y1",    want: ["called", "cried", "shouted"] },
  // -s swaps (3rd-person / plural), sibilant + ies handled by the generator
  { word: "cries",   preset: "uk-early", want: ["yells"] },
  // scales with the taught set: teach vowel teams and peek->peeked qualifies
  { word: "looked",  preset: "uk-y1",    want: ["spotted", "watched", "peeked"] },
  // base-word suggestions (ending "") — unchanged behaviour, no regression
  { word: "great",   preset: "uk-early", want: ["big", "grand"] },   // giant: gi·ant is an open syllable
  { word: "big",     preset: "uk-early", want: ["grand"] },
  // not in the bank (and not a bank inflection) -> no suggestions
  { word: "computer", preset: "uk-early", want: [] },
  { word: "elephant", preset: "uk-early", want: [] },
];

/* detectInflection round-trips: [word, base|null, ending] (null base = not a
   bank inflection). Guards the base-recovery that feeds suggestFor. */
const INFLECTION_DETECT = [
  ["looked", "look", "ed"], ["running", "run", "ing"], ["cries", "cry", "s"],
  ["watches", "watch", "s"], ["hopped", "hop", "ed"], ["raced", "race", "ed"],
  ["spotted", "spot", "ed"], ["leaped", "leap", "ed"], ["fixes", "fix", "s"],
  ["yells", "yell", "s"], ["gazing", "gaze", "ing"],
  ["spring", null, null], ["boy", null, null], ["great", null, null],
];

/* ---------------------------------------------------------------
   12. SILENT-E INFLECTIONS — [inflected form, base]. The form must need
   exactly the base's skills plus `endings`: -ed/-ing drop a silent e
   (make -> making, race -> racing, rage -> raging), -ed turns y to i
   (cry -> cried), and -s after a silent-e base must strip only the s
   (nose -> noses, dance -> dances, table -> tables). Before this, the
   engine read making/hoped/racing/noses/cried as short CVC — FALSE
   greens for any group not yet taught magic-e / soft c / y-as-a-vowel.
   --------------------------------------------------------------- */
const SILENT_E = [
  // magic-e + -ing / -ed (one syllable, undoubled final consonant)
  ["making", "make"], ["baked", "bake"], ["taking", "take"], ["named", "name"],
  ["hoped", "hope"], ["hoping", "hope"], ["liked", "like"], ["riding", "ride"],
  ["smiling", "smile"], ["shaking", "shake"], ["skated", "skate"], ["waved", "wave"],
  ["saving", "save"], ["using", "use"], ["used", "use"], ["hated", "hate"],
  ["poked", "poke"], ["joking", "joke"], ["timed", "time"], ["quaking", "quake"],
  ["gazed", "gaze"], ["gazing", "gaze"], ["staring", "stare"], ["boring", "bore"],
  // soft c / soft g hidden by the dropped e
  ["racing", "race"], ["raced", "race"], ["iced", "ice"], ["raging", "rage"],
  ["paged", "page"], ["dancing", "dance"], ["danced", "dance"], ["forced", "force"],
  ["charging", "charge"], ["judging", "judge"], ["judged", "judge"],
  // consonant-le + -ed
  ["giggled", "giggle"], ["tickled", "tickle"], ["bubbled", "bubble"],
  ["wobbled", "wobble"], ["tumbled", "tumble"],
  // consonant + y -> ied
  ["cried", "cry"], ["tried", "try"], ["dried", "dry"], ["spied", "spy"],
  ["carried", "carry"], ["hurried", "hurry"],
  // y-e (type, style, hype, rhyme): the medial y between consonants is the
  // base's vowel, so -s/-ed/-ing strip and the dropped e is rebuilt like i-e.
  // Before, "typ" had no a/e/i/o/u, so typing/typed/types stayed whole and
  // needed only the y — a false green for a group taught alternatives but
  // not magic-e. (cycled = cycle + ed: the -le e comes back too.)
  ["types", "type"], ["typed", "type"], ["typing", "type"], ["hyped", "hype"],
  ["styles", "style"], ["styled", "style"], ["styling", "style"],
  ["rhymes", "rhyme"], ["rhymed", "rhyme"], ["bytes", "byte"], ["cycled", "cycle"],
  // consonant + y keeps its y before -ing (crying, flying) — the base has no
  // a/e/i/o/u, so the -ing guard now counts that final y as the vowel
  ["crying", "cry"], ["trying", "try"], ["flying", "fly"], ["frying", "fry"],
  // -s after a silent-e base strips only the s (not a sibilant "-es")
  ["noses", "nose"], ["roses", "rose"], ["sizes", "size"], ["prizes", "prize"],
  ["uses", "use"], ["closes", "close"], ["gazes", "gaze"],
  ["dances", "dance"], ["fences", "fence"], ["changes", "change"],
  ["tables", "table"], ["bubbles", "bubble"], ["apples", "apple"],
  ["candles", "candle"],
];

/* Look-alikes that must NOT gain a silent e: [word, exact need].
   Short-vowel bases double (hopped) or never double (x/w: boxed, snowed),
   multi-syllable bases (opened, visited) are ambiguous, -ng can't be
   told apart (hang/sing vs change), -ling is a noun suffix (duckling),
   heart-word bases keep their reading (coming, having), and buses/gases/
   during are listed exceptions. */
const NOT_SILENT_E = [
  ["hopped", ["double", "endings"]], ["hopping", ["double", "endings"]],
  ["jumping", ["blend", "endings"]], ["picked", ["digraph", "endings"]],
  ["boxed", ["endings"]], ["fixing", ["endings"]],
  ["snowed", ["blend", "team", "endings"]], ["played", ["blend", "team", "endings"]],
  ["opened", ["endings", "open", "syll"]], ["visited", ["endings", "open", "syll"]],   // o·pen, vis·it: VCV
  ["hanging", ["digraph", "endings"]], ["singing", ["digraph", "endings"]],
  ["duckling", ["digraph", "endings"]], ["dumpling", ["blend", "endings"]],
  ["coming", ["endings"]], ["having", ["endings"]], ["giving", ["endings"]],
  ["living", ["endings"]],
  ["buses", ["endings"]], ["gases", ["endings"]], ["boxes", ["endings"]],
  ["wishes", ["digraph", "endings"]], ["kisses", ["double", "endings"]],
  ["during", ["rctrl", "endings"]],
];

/* ---------------------------------------------------------------
   13. WHY-HINTS — [word, hint skill, text the hint must contain]. When a
   word is amber, the tooltip says WHY ("the t in listen is silent"). Each
   reason below names the rule that made the word advanced, so a teacher
   sees the real gap, not just a skill name.
   --------------------------------------------------------------- */
const HINTS = [
  ["listen", "adv", "the t in \"listen\" is silent"],
  ["often", "adv", "the t in \"often\" is silent"],
  ["sign", "adv", "the g in \"sign\" is silent"],
  ["hour", "adv", "the h in \"hour\" is silent"],
  ["island", "adv", "the s in \"island\" is silent"],
  ["lamb", "adv", "the b in \"lamb\" is silent"],
  ["knee", "adv", "the k in \"knee\" is silent"],
  ["wrap", "adv", "the w in \"wrap\" is silent"],
  ["Christmas", "adv", "the ch in \"Christmas\" says /k/"],
  ["picture", "adv", "\"ture\" in \"picture\" is read as one chunk"],
  ["hasten", "adv", "the t in \"hasten\" is silent"],    // adv wins over the long a
  ["taste", "alt", "the a in \"taste\" says its name"],
  ["quiet", "open", "the i in \"quiet\" ends its syllable"],
];

module.exports = {
  ALL,
  HINTS,
  CVC_PRESET,
  DECODABLE,
  NEEDS_SKILL,
  DECODABLE_UNDER,
  CVC_SYLL_PRESET,
  ALT_EARLY_PRESET,
  HEART,
  KNOWN,
  PASSAGE,
  KNOWN_LIMITATIONS,
  PLANS,
  INFLECT,
  SUGGEST,
  INFLECTION_DETECT,
  SILENT_E,
  NOT_SILENT_E,
};
