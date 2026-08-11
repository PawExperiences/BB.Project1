## 0.1.0 -- e2e word count 0.1.0

## [0.1.0] - 2026-08-11

### Added
- Initial `wordcount` CLI: a Unix `wc`-style tool that counts lines, words, and bytes for named files or stdin (`main.go`, `go.mod`, module `wordcount`, `go 1.22`).
- Tab-separated per-input output `<lines>\t<words>\t<bytes>\t<name>` (`-` as the name for stdin), plus a final `total` line summing counts when more than one file argument is given (omitted for a single input).
- Per-file error handling: an unreadable named file is reported as `wordcount: <name>: <error>` on stderr and skipped, processing continues for the remaining files, and the process exits 1 if any file failed to open (0 if every input was processed cleanly).
- `README.md` documenting build/run usage and the output format.
- Table-driven tests (`count_test.go`) covering four edge cases: an empty reader, a single line with no trailing newline, a line with repeated/multiple consecutive spaces, and multi-byte UTF-8 input where byte count and rune count differ.
- `README.md` usage table showing the exact documented output for each of those same four cases, so tested and documented behavior share one source of truth.

### Changed
- Counting logic extracted out of `main.go` into its own file, `count.go`, which defines a `Counts` struct (lines/words/bytes) and an exported function that fills it from a single pass over an `io.Reader`. `main.go` now contains only argument/flag handling and calls into `count.go`. Pure internal refactor -- no CLI-visible behavior change (flags, output format, and exit codes are unchanged).
