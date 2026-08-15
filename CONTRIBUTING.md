# Contributing

This guide covers one thing: how to write a good changelog entry for this
project. It doesn't cover dev environment setup, the PR process, coding
style, or testing — those aren't documented elsewhere in this repo yet, so
they're left out here too.

## Changelog categories

This project follows [Keep a Changelog](https://keepachangelog.com/). Every
entry belongs in exactly one of the following sections:

- **Added** — a new feature or capability that didn't exist before.
  - `- Added a --dry-run flag to preview changes before they are applied.`
- **Changed** — a change to existing, already-shipped behaviour.
  - `- Changed the default output format from plain text to JSON.`
- **Deprecated** — a feature that still works today but will be removed in a future release.
  - `- Deprecated the --legacy-auth flag; it will be removed in a future release.`
- **Removed** — a feature or capability that no longer exists.
  - `- Removed support for the deprecated --legacy-auth flag.`
- **Fixed** — a bug fix, described by the incorrect behaviour that is now correct.
  - `- Fixed a crash when running the CLI in a directory with no write permissions.`
- **Security** — a change that closes a vulnerability or hardens a security-relevant behaviour.
  - `- Security: fixed an issue where API tokens could be written to log files.`

## How to word an entry

Write every entry from the point of view of someone *using* the CLI, not
someone reading the diff. Describe the observable behaviour, capability, or
fix — never a file name, function name, or "refactored X" style description
of the implementation. If a user couldn't notice the change by using the
tool, it probably doesn't belong in the changelog at all.

**Before (commit-style, implementation-focused):**

```
- Refactored parseArgs() in cli/args.go to use a switch statement.
```

**After (user-facing, behaviour-focused):**

```
- Fixed the CLI ignoring the --output flag when combined with --verbose.
```

The "after" version tells a user what actually changed for them. The
"before" version only makes sense to someone who has read the code — it
names a function and a file, and describes the refactor rather than its
effect. When writing an entry, ask "what would a user see or notice
because of this change?" and write that sentence down.
