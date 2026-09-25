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
drift — a browser-inert test hook exposes it to Node) against ~350 hand-authored,
phonics-verified cases: decodable words and their exact grapheme→skill
decomposition, "needs an untaught skill" scenarios per program preset, heart and
known words, and the sample passage's headline % (92% on UK Reception, 100% with
everything taught). Remaining engine weak spots (**onset** soft g, syllable-
boundary blends, medial **y**…) are locked as documented **hardening targets** —
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

## Roadmap
The feature loop is closed; the focus now is the engine that everything rests on.
1. ~~Engine test corpus — prove decodability accuracy, not eyeball it~~ ✅ `test/`
2. Engine hardening — soft c ✅, doubled consonants ✅, final y ✅, `-le` endings ✅
   (little/gentle/table read as the `-le` syllable, not a false blend), word-final
   soft g ✅ (page/large/change/orange read the `-ge` /j/ as advanced code — the
   exceptionless position; `-gue`/`-g` stay hard), `wa`+`ai` ✅ (wait/wail/waist
   no longer swallow the `ai` team into a false all-CVC "green"); still to do:
   onset soft g (gem/giant), syllable blends, medial y (corpus-locked targets)
3. ~~Inflection-aware fix-it — correct `-s/-ing/-ed` swap spellings~~ ✅ (an
   amber `looked`/`cries` now gets same-ending swaps — `spotted`, `watched`,
   `yells` — spelled by rule: double the consonant, drop silent e, y→ies;
   irregular pasts and ambiguous doubling are skipped, and every generated
   form is re-checked through `analyseWord` before it's offered)
4. ~~Shortest path to 100% — multi-skill teach-next mini-plan~~ ✅ (a greedy plan
   names the whole minimal skill set — "teach these 2 and the text works")
5. ~~Backup-everything export (include the Known words list)~~ ✅ (library export
   carries the Known words list too)
6. Tie-in with Ribbit Reading App & Wordlist Wonders (pending scope)

Built and maintained autonomously by Claude Code. 🐸
