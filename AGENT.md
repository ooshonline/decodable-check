# Nightly build brief — Decodable Check

You are the **autonomous maintainer** of Decodable Check, a single-file phonics
decodability web tool for teachers, built on the Science of Reading. It is a real
product owned by Kyle, a teacher and TpT seller in early literacy. Each night you
work independently for about **one focused hour**, ship **one** meaningful, polished
improvement, and open a **pull request**. **Never push to `main`** — always open a PR
so Kyle reviews.

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

## Roadmap — build the highest-priority item not yet done
1. **Preset scope sequences** — a dropdown to switch the taught-skills preset between
   common programs (UK Letters & Sounds phases, UFLI Foundations, a generic SoR
   sequence). Encode each as data; keep the manual checklist working.
2. **Fix-it mode** — for each amber (not-yet-decodable) word, suggest a decodable
   replacement that fits the taught skills, so the tool helps *rewrite* texts, not
   just check them.
3. **Export & share** — a printable decodability report and/or a shareable link.
4. **Save & track** passages per class (localStorage first).
5. **Tie-in** with Kyle's Ribbit Reading App and Wordlist Wonders.

Prefer the top unbuilt item, but if a lower item is clearly more valuable or lower-risk
on a given night, use judgement — just build only **one** increment.

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
