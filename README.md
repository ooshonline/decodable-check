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
1. Engine test corpus — prove decodability accuracy, not eyeball it
2. Engine hardening — syllable blends, soft c/g, `-le` endings, schwa
3. Inflection-aware fix-it — correct `-s/-ing/-ed` swap spellings
4. Shortest path to 100% — multi-skill teach-next mini-plan
5. Backup-everything export (include the Known words list)
6. Tie-in with Ribbit Reading App & Wordlist Wonders (pending scope)

Built and maintained autonomously by Claude Code. 🐸
