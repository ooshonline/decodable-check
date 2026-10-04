# Decodable Check

A phonics **decodability workbench** for teachers. Paste a passage, tick the phonics
skills your group has been taught, and instantly see which words are decodable,
which need an untaught skill, and which are tricky/heart words — with a live
decodability score.

**Built on the Science of Reading.** Grounded in scope-and-sequence phonics: the
engine breaks each word into graphemes and only marks it decodable when every
spelling has been taught.

## Run it
Open `index.html` in any browser. No build step, no dependencies.

## Test the engine
`analyseWord()` is the whole tool's credibility — a mis-score hands a teacher a
text they shouldn't use — so it has a regression corpus:

```sh
npm test        # or: node test/engine.test.js
```

The corpus runs the **real** engine straight out of `index.html` (no copy to
drift — a browser-inert test hook exposes it to Node) against ~900 hand-authored,
phonics-verified cases: decodable words and their exact grapheme→skill
decomposition, "needs an untaught skill" scenarios per program preset, heart and
known words, and the sample passage's headline % (92% on UK Reception, 100% with
everything taught). Remaining engine weak spots (**onset** soft g, ambiguous
`sk`/`st` splits…) are locked as documented **hardening targets** —
see `test/corpus.js`. The app stays one self-contained `index.html`; the tests
live in `test/` and use only Node's built-ins.

## Architecture (single file, data-driven)
- `PHASES` — scope-and-sequence skills in teaching order (the checklist).
- `GRAPHEMES` — ordered longest-first grapheme → skill map.
- `TRICKY` — high-frequency irregular / heart-word list.
- `analyseWord()` — greedy grapheme segmenter; a word is decodable only when every
  grapheme's skill is in the taught set. Heart words are excluded from the % (the
  SoR-correct way to score decodability).

## What it does
- Preset scope sequences (UK Letters & Sounds, UFLI, SoR…)
- "Fix-it" mode — decodable swap suggestions for untaught words
- "Teach next" — the highest-leverage skill to teach next
- Known words — set names & class-taught words aside
- Printable decodability report + shareable links
- Save & track passages per class, with JSON backup export/import
- Passage maker — generate a new passage that is 100% decodable for the ticked skills, on a built-in theme or your own

## Roadmap
The feature loop is closed; the focus now is the engine that everything rests on.
1. ~~Engine test corpus — prove decodability accuracy, not eyeball it~~ ✅ `test/`
2. Engine hardening — soft c ✅, doubled consonants ✅, final y ✅, `-le` endings ✅
   (little/gentle/table read as the `-le` syllable, not a false blend), word-final
   soft g ✅ (page/large/change/orange read the `-ge` /j/ as advanced code — the
   exceptionless position; `-gue`/`-g` stay hard), `wa`+`ai` ✅ (wait/wail/waist
   no longer swallow the `ai` team into a false all-CVC "green"), silent-e
   inflections ✅ (making/hoped/racing/raging/giggled/cried/crying/noses no longer
   read as short CVC once the ending is stripped — the dropped e / y→i is rebuilt
   where the spelling is unambiguous), syllable-boundary consonants ✅ (sun·set,
   nap·kin, pic·nic, win·ter read as a VC|CV split, not a false blend — ambiguous
   onset pairs like bas·ket stay strict; the split now needs its own
   **Two-syllable words** skill, on in every preset except SoR Kindergarten), medial y ✅ (gym/myth/type/system read
   y as a vowel — advanced code — not a false blend; every·thing/ba·by·sit keep
   final y's bucket), long vowels in closed syllables ✅ (kind/find/child/old/cold/
   most/roll/bolt read as the long-vowel "closed-syllable exception" — advanced
   code — not short CVC + blend; wind/lost/doll/children keep their short vowel)
   and silent l ✅ (walk/talk/half/calm/folk — no false lk/lf blend), and the
   `adv` catch-all split ✅: soft c, final -ge, medial y, kind/old/most and
   walk/half are now **Alternative pronunciations** (`alt`) — taught in UK
   Year 1 / UFLI Grade 1, so those presets read them, while `adv` keeps the
   truly advanced kn/wr/mb/-dge/-le (saved setups migrate with unchanged
   verdicts; type/style inflections — typing, styled — now need magic-e too),
   and `-all` ✅ (ball/call/tall/small/wall read the a as /aw/ — an alternative
   pronunciation — not short a; shall stays short, and "all" itself is a heart
   word, as in Letters and Sounds Phase 3);
   still to do: onset soft g (gem/giant) (corpus-locked target)
3. ~~Inflection-aware fix-it — correct `-s/-ing/-ed` swap spellings~~ ✅ (an
   amber `looked`/`cries` now gets same-ending swaps — `spotted`, `watched`,
   `yells` — spelled by rule: double the consonant, drop silent e, y→ies;
   irregular pasts and ambiguous doubling are skipped, and every generated
   form is re-checked through `analyseWord` before it's offered)
4. ~~Shortest path to 100% — multi-skill teach-next mini-plan~~ ✅ (a greedy plan
   names the whole minimal skill set — "teach these 2 and the text works")
5. ~~Backup-everything export (include the Known words list)~~ ✅ (library export
   carries the Known words list too)
6. Tie-in with Ribbit Reading App & Wordlist Wonders (on hold — bigger plan to come)
7. Passage maker — generate a passage that is provably decodable. Stage 1 ✅
   (**Make a passage**: focus skill, length, heart words on/off, Known words as
   character names; every word is checked by `analyseWord` before it's placed and
   the passage is only shown if it re-scores at 100%). Stage 2 ✅ (**themes** —
   pets, farm, seaside, park, home, school — and sentences that make sense: a
   small lexicon gives each noun the adjectives that suit it, each animal its own
   verbs and places, each verb where it can happen, so it's "the pink pig digs in
   the mud", never "Sam barks" or "a green cat"). Stage 3 ✅ (a decodable title,
   a large-print **Pupil copy** with a teacher footer of heart words to pre-teach,
   and **Save** to the class library). Stage 4 ✅ (**your own themes** — tick
   words from the built-in word bank, which keep their agreement data and the
   strict 100% gate, or type your own under Things / Animals / Places; typed
   words only go in "safe" sentences that suit any word, never as plurals, and
   one that isn't decodable yet is used but flagged and shown amber. Themes are
   kept in the browser and in library backups)

Built and maintained autonomously by Claude Code. 🐸
