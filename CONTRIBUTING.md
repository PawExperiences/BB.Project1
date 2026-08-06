# Contributing: Writing Changelog Entries

This guide explains how to write changelog entries for this project so that `CHANGELOG.md` remains readable as a product narrative rather than a commit log.

The only topic covered here is changelog authorship. For code style, pull-request process, or release steps, see `README.md` and `RELEASING.md`.

---

## The User-Facing Voice Rule

**Every changelog entry must describe the observable effect on the user — not the internal action you took as a developer.**

When you write a changelog entry, imagine you are telling a user what is different about the software they are running today compared with yesterday. They cannot see your commit, your function name, or your refactor. They can only see what the software does.

**Self-test:** Before submitting an entry, ask: _"Does this sentence make sense to someone who has never read the source code?"_ If the answer is no, rewrite it.

---

## Wording Guidance

Every entry should read as if you are describing a change in the product to the person using it.

| ✅ DO — user-facing phrasing | ❌ DON'T — commit-log phrasing |
|---|---|
| You can now filter results by date on the results screen. | Added `dateFilter` parameter to `queryResults()`. |
| The boss health bar no longer appears on the win screen. | Refactored health-bar renderer to guard on `winScreenActive`. |
| Restarting after the boss fight no longer triggers duplicate sound effects. | Extracted `_detachWinListeners` helper and called it on scene exit. |
| The game now loads correctly through the level-selection menu. | Deleted legacy `singleLevel` entry point. |

**Prefer:** "You can now…", "The X screen no longer…", "Selecting Y now…", "Players can…"  
**Avoid:** "Refactored…", "Fixed bug in…", "Added method…", "Updated module…"

---

## Changelog Sections

`CHANGELOG.md` uses the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. Changes go under the `[Unreleased]` section at the top of the file, grouped under one of the six headings below. The headings must appear in this order.

For each section you will find:
- **What belongs here** — the kinds of changes that go under this heading.
- **Example entry** — a realistic, correctly worded bullet as it would appear in `CHANGELOG.md`.

---

### Added

**What belongs here:** New features, new screens, new commands, new options, or any capability that did not exist before and that a user can now make use of.

**Example entry:**

```
- You can now earn bonus points by shooting the UFO that crosses the screen every 20 seconds.
```

---

### Changed

**What belongs here:** Modifications to existing behaviour that a user would notice — altered defaults, revised wording, adjusted speeds or timings, or anything that works differently from how it worked before.

**Example entry:**

```
- Enemy invaders now move noticeably faster as fewer of them remain, making the final wave more intense.
```

---

### Deprecated

**What belongs here:** Features or options that still work but are scheduled for removal in a future release. Users should be told what to use instead.

**Example entry:**

```
- The `--legacy-controls` flag is deprecated and will be removed in the next major release; the default control scheme now covers all previously legacy-only actions.
```

---

### Removed

**What belongs here:** Features, options, screens, or behaviours that have been taken out entirely and are no longer available to the user.

**Example entry:**

```
- The single-level practice mode has been removed; all play now starts from Level 1 of the full four-level campaign.
```

---

### Fixed

**What belongs here:** Bugs that have been corrected — things that were broken, wrong, or unexpected from the user's point of view and now work correctly.

**Example entry:**

```
- The boss health bar no longer remains visible after the win screen is displayed.
```

---

### Security

**What belongs here:** Vulnerabilities that have been addressed. Describe what a user was exposed to and confirm it is resolved, without providing an exploitation recipe.

**Example entry:**

```
- A path-traversal issue that could allow an attacker to read files outside the intended directory has been fixed; all file-access requests are now validated against an allowlist.
```

---

## Quick Reference

Before adding a changelog entry, confirm:

- The entry appears under the correct section heading (one of: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`).
- The entry is placed in the `[Unreleased]` section at the top of `CHANGELOG.md`.
- The entry describes what the user can now do, see, or no longer encounters — not what you changed in the code.
- The entry is a single bullet point beginning with a capital letter, written as a complete thought.
