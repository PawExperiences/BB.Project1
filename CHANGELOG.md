## 0.1.0 -- e2e word count 0.1.0

## 0.1.0 - 2026-08-11

### Added
- Initial Go implementation of the `wordcount` CLI (`go.mod` declaring module `wordcount`, Go 1.22; `main.go`; `README.md`), matching classic `wc -lwc` behaviour: reads one or more files named on the command line, or stdin when none are given, and reports lines/words/bytes for each.
- Tab-separated output `<lines>\t<words>\t<bytes>\t<name>` per input, with stdin labelled `-`, and a summed `total` line when more than one input is given (omitted for a single input).
- Per-file error handling: an unreadable file is reported as `wordcount: <name>: <error>` on stderr, processing continues for the remaining inputs, and the process exits 1 if any file failed (0 if all succeeded).
- `count.go`: an exported `Counts` struct (lines/words/bytes) and an exported counting function operating on any `io.Reader`, independent of CLI/file-opening logic.
- `count_test.go`: table-driven tests for the counting logic covering four edge cases -- empty input, a single line with no trailing newline, a line with repeated/consecutive spaces, and input containing multi-byte UTF-8 characters (byte count vs. rune count).
- README usage table documenting the exact CLI output for those same four cases.

### Changed
- `main.go` reduced to argument parsing and I/O setup only; all line/word/byte counting logic moved to `count.go` (pure refactor, no behaviour change, verified by identical output before/after and by the new tests).

### Fixed
- N/A (first release).

