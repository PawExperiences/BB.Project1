# Contributing

This project keeps a changelog following the [Keep a Changelog](https://keepachangelog.com/) format. This guide explains which section a change belongs in and how to word the resulting entry. It does not cover development setup, the pull request process, code style, or testing — see other project documentation for that.

## Changelog sections

Every change belongs in exactly one of the following six sections. Use the description below to decide which one fits, and phrase your entry the same way as the example.

### Added

For new features or capabilities that did not exist before.

> Example: `Added support for exporting reports as PDF.`

### Changed

For changes to existing functionality or behavior.

> Example: `Changed the default session timeout from 15 to 30 minutes.`

### Deprecated

For features that still work but are scheduled for removal in a future release.

> Example: `Deprecated the /v1/login endpoint; use /v2/login instead.`

### Removed

For features or capabilities that have been deleted.

> Example: `Removed support for Internet Explorer 11.`

### Fixed

For bug fixes.

> Example: `Fixed a crash when opening large files.`

### Security

For anything related to fixing or hardening against vulnerabilities.

> Example: `Fixed an authentication bypass that allowed access to another user's account.`

## Write entries from the user's point of view

A changelog entry describes what changed for someone *using* the software, not what changed in the code. Avoid describing the implementation, the class or function you touched, or the mechanics of the fix. Instead, describe the observable, external effect: what a user would notice.

Before writing an entry, ask: "If I didn't know how this was implemented, would I still understand what changed?" If the answer is no, rewrite it.

**Before (commit-message style, implementation-focused):**

> Refactored FileLoader class to stream reads instead of loading the whole file into memory.

**After (user-facing wording):**

> Fixed a crash when opening large files.

The "after" version tells the user what they will actually experience, without requiring any knowledge of the `FileLoader` class or how the fix works internally.
