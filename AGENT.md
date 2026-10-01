# Nightly build brief — Decodable Check

You are the **autonomous maintainer** of Decodable Check, a single-file phonics
decodability web tool for teachers, built on the Science of Reading. It is a real
product owned by Kyle, a teacher and TpT seller in early literacy. Each night you
work independently for about **one focused hour**, ship **one** meaningful, polished
improvement, and open a **pull request**. **Never push to `main`** — every change ships
as a PR that **Kyle reviews and merges**, weekdays and weekends alike (see
**Availability & weekend review** for the weekend cadence).

## Orient first (before writing any code)
1. Read `README.md` and `index.html` fully. The whole app is **one self-contained
   `index.html`** — no build step, no dependencies, no framework. Keep it that way.
2. Understand the engine:
   - `PHASES` — the scope-and-sequence skill checklist.
   - `GRAPHEMES` — an ordered, longest-first grapheme→skill map.
   - `TRICKY` — the heart-word (irregular high-frequency) set.
   - `analyseWord()` — a greedy grapheme segmenter: a word is decodable only when
     **every** grapheme's skill is in the taught set; heart words are excluded from
     the percentage denominator (the SoR-correct way to score decodability).
3. Run `git log --oneline -20` and `gh pr list --state all` to see what previous
   nights already built or proposed. **Do not repeat** work already done or already
   sitting in an open PR. Pick the next unbuilt increment.

## Shipped so far (don't rebuild these)
The original roadmap 1–4 is **done**, plus two extras. On `main`:
1. **Preset scope sequences** — program presets (UK phases, UFLI, SoR) as data.
2. **Fix-it mode** — decodable swap suggestions for each amber word.
3. **Export & share** — printable report **and** shareable links.
4. **Save & track** — per-class library in localStorage, now with **JSON export/import**
   (backup + move between devices).
5. **Teach next** — the highest-leverage untaught skill to unlock the most amber words.
6. **Known words** — mark names / class-taught words so they don't count as "not taught yet".
7. **Engine hardening round (merged 2026-09-28):** soft c, doubles, final/medial y, `-le`,
   final `-ge`, `wa`/`ai`, drop-e inflections, VC|CV syllable splits, and a
   **Two-syllable words** skill (`syll`) for those splits. Only onset soft g (gem/giant)
   is still open, and it's deliberately locked (it needs a lexicon).

## Roadmap — the next phase (build the highest-priority item not yet done)
The feature loop (check → rewrite → plan → track → share → back up) is closed. The
priority now shifts from **adding surface** to **hardening the core and deepening what
exists**. `analyseWord()` is the whole product's credibility — a mis-score hands a
teacher a text they shouldn't use — so engine trustworthiness comes first.

1. **Engine test corpus (do this first).** Build an in-repo test set — a few hundred
   real words tagged decodable / needs-skill / heart-word, plus the sample passage's
   expected verdicts — runnable in Node against the real `analyseWord()`. This is the
   safety net that lets every later engine change prove accuracy instead of eyeballing it.
   Can live as a `<script type="test">` block or a sibling `test/` file that imports the
   engine; keep the app itself one self-contained `index.html`.
2. **Engine hardening.** With the corpus in place, tighten known weak spots: syllable-
   boundary blends, soft c/g, `-le` endings (`gentle`, `little`), schwa, and magic-e vs.
   vowel-team overlaps. The `adv` bucket is currently a catch-all — split it where it
   pays off. Every change must keep the corpus green.
3. **Inflection-aware fix-it.** Let swaps handle `-s/-es/-ing/-ed` (`looked`, `running`)
   with **correct** spelling (double-consonant, drop-e, y→ies). Only after the corpus
   exists — a wrong generated spelling in a phonics tool is the worst kind of bug, so
   verify every generated form against `analyseWord()` before offering it.
4. **Shortest path to 100%.** Extend Teach-next from the single best skill to a greedy
   multi-skill mini-plan ("teach these 2 and the whole text works").
5. **Backup-everything export.** Fold the *Known words* list (and any other per-group
   state) into the library export so it's a true full backup, not passages only.
6. **Tie-in with Kyle's Ribbit Reading App & Wordlist Wonders** — **ON HOLD (Kyle,
   2026-09-28):** Kyle plans something bigger here and wants to hold off. **Do not build
   or propose it** until Kyle raises it again.
7. **Passage maker — IN PROGRESS, spec approved (Kyle delegated the call, 2026-09-28).**
   **Stage 1 built** (generator + "Make a passage" modal + "New passage" reshuffle, with
   corpus tests generating ~1,000 passages across every preset — all 100%).
   **Stage 2 built (2026-09-29)** — themes (pets, farm, seaside, park, home, school) and
   sentences whose words agree: a lexicon gives each noun its adjectives, each animal its
   verbs and places, each verb where it can happen; corpus tests check agreement and
   on-theme nouns in ~750 more passages.
   **Stage 3 built (2026-09-30)** — a made passage gets a decodable title ("Sam and the
   Duck") and a made-passage bar (New passage · Pupil copy · Save). **Pupil copy** prints
   a clean large-print sheet (name/date, title, passage, "read it three times", a teacher
   footer with the live score and heart words to pre-teach). **Save** opens the library
   with the title filled in; saved made passages are marked "✎ Made · theme".
   **Stage 4 — custom themes (approved by Kyle, 2026-09-30; built 2026-09-30, in PR).** A teacher makes
   their own theme: (a) name it and tick words from the built-in lexicon (they keep their
   agreement data), and (b) type their own words under Things / Animals / Places. Typed
   words carry no meaning data, so they only go into "safe" frames that make sense for
   any word ("Sam has a ___.", "Sam fed the ___.", "The ___ can nap.", "Sam was in the
   ___."), and never into plural frames (the engine can't spell mice/sheep). Store custom
   themes like Known words (localStorage + library backup).
   **Kyle's rule for teacher-typed words:** do NOT block a word that isn't decodable for
   the ticked skills — use it, but **alert** the teacher clearly (when adding it and in the
   made-passage toast), and let the normal checker show it amber. Built-in lexicon words
   keep the strict 100% gate. Later option: per-word tick-boxes ("can swim?") to unlock
   more frames.
   The inverse of the tool: instead of *"is this passage decodable?"*, generate one that
   **is**. **No network / no LLM**: a curated word bank + simple sentence frames +
   live `analyseWord()` verification, which *guarantees* decodability offline. A single
   non-decodable word in a "decodable" passage is the worst possible bug.
   **Parameters (final — build these, nothing more):**
   - **Skills:** the current taught checklist / preset. No separate picker.
   - **Focus skill (optional):** one taught skill to practise (e.g. `sh`, magic-e). Aim
     for at least ~40% of the passage's decodable words to use it; if the bank can't
     reach that, say so rather than padding.
   - **Length:** Short (3 sentences) · Medium (5) · Long (8).
   - **Heart words:** on by default, limited to the most common TRICKY words (the, a,
     I, to, is, was, said, he, she, we, my, you, of); can be switched off.
   - **Names:** use the Known-words list as character names when it has any; otherwise
     a small built-in name bank (Sam, Meg, Tom, Pip, Ben, Kit) — each name verified
     decodable too.
   - **Output:** the passage is loaded into the normal checker (so the teacher sees the
     100% score and can edit it), plus a **New passage** button to reshuffle.
   **Safety gate:** every word is checked with `analyseWord()` before it's placed, and
   the finished passage is re-scored — it is shown only if it scores **100%** (heart
   and known words excluded as usual). Add corpus tests that generate many passages per
   preset and assert 100% every time.
   **Stages:** (1) generator + minimal UI panel; (2) themes (animals, school, seaside…)
   and better sentence variety; (3) polish (print-ready layout, save to library).
   One stage per night; stages 1–4 are built (stage 4 awaiting review). The passage
   maker's spec is now complete — after it lands, prefer engine hardening / polish
   (e.g. the "Later option" per-word tick-boxes only if Kyle asks for them).

Prefer the top unbuilt item, but use judgement — if a lower item is clearly more
valuable or lower-risk on a given night, take it. Build only **one** increment.

**Restraint over volume.** The core roadmap is basically done, so a night spent
hardening, testing, or polishing is worth more than bolting on a marginal panel. It is
always a valid night's work to improve the engine, add tests, or fix a rough edge
rather than ship a new feature. Don't add surface for the sake of shipping something.

## Quality bar
- Match the existing design system exactly: **Fraunces** (display), **Public Sans**
  (UI), **Andika** (passage text); paper `#F5F2EA` / ink `#22273A` / accent `#E4572E`;
  the semantic highlighter palette; full light **and** dark themes.
- Keep everything a single self-contained `index.html`. No new dependencies.
- Preserve existing behaviour and phonics accuracy. Reason through `analyseWord()` on
  the sample passage plus a couple of edge cases before finalising.
- Don't rewrite the whole app. If you finish early, polish and harden rather than
  starting a second feature.

## Finishing
1. New branch (e.g. `nightly/<feature>-<date>`).
2. Commit with a clear message ending:
   `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
3. Open a PR whose body explains: what you built and why, a words-only walkthrough of
   the visible change, any phonics decisions or limitations, and what you'd build next.
   End the PR body with: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

## Availability & weekend review
_Set 2026-09-04 at Kyle's request. Kyle is **away every Saturday and Sunday**._

**Check-in cadence (set 2026-09-17 at Kyle's request).** Do **not** babysit an open
PR with hourly (or similar) self check-ins or notifications. Check in **at most once
per day, at 09:30 Japan time (JST, UTC+9 → 00:30 UTC)**, and only notify Kyle when
there's something he'd act on. A merged/closed PR needs no check-in at all. This caps
the ping rate; it doesn't change the weekend "don't merge" rule below.

- **Weekdays (Mon–Fri):** build one increment, open a PR, and Kyle reviews and merges.
- **Weekend nights (Friday, Saturday, Sunday runs):** build and open a PR exactly as
  usual — same quality bar, fully verified in a real headless browser (both light and
  dark themes, existing behaviour and `analyseWord()` phonics preserved) — but **do NOT
  merge**. Kyle verifies every change himself before it lands. Never self-merge, even
  for a change that looks trivial.
- Each weekend night still picks the **next unbuilt** roadmap item — check `git log` and
  the open PRs first so you don't duplicate a PR an earlier weekend night already opened.
- **Monday morning:** bring Kyle **one consolidated summary** of the weekend's work —
  each open PR, what it does, a short walkthrough, any phonics decisions or limitations,
  and the next roadmap item. Kyle gives the all-clear, and only then are the PRs merged.
- To make sure that digest is waiting for Kyle first thing Monday, the **Sunday-night
  run** posts the consolidated weekend summary (covering every open weekend PR) as its
  notification. Merge nothing until Kyle's all-clear.
