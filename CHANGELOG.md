## 0.1.0 -- e2e word count 0.1.0

## [0.1.0] - 2026-08-11

### Added
- `wordcount`: a dependency-free `wc`-style CLI in Go (`go.mod`, `main.go`). Reads one or more files named on the command line, or stdin when no arguments are given, and prints `<lines>\t<words>\t<bytes>\t<name>` per input (using `-` as the name for stdin), plus a combined `<total-lines>\t<total-words>\t<total-bytes>\ttotal` line when more than one input is given. Unreadable files log `wordcount: <name>: ...` to stderr, are skipped, and the process exits 1; a fully successful run exits 0. (#257)
- `count.go`: an exported `Counts` struct (line/word/byte counts) and `func Count(r io.Reader) (Counts, error)`, extracting counting into a self-contained, testable unit. Words follow `bufio.ScanWords` semantics, lines are counted as `\n` bytes (`wc -l` semantics), and bytes are raw byte counts (not runes). (#258)
- `count_test.go`: table-driven tests over the four highest-risk edge cases — empty input, a single line with no trailing newline, a line with repeated/consecutive spaces, and input containing a multi-byte UTF-8 character where byte count and rune count differ.
- README.md usage/output table showing the exact, verified CLI output for those same four inputs, alongside build/run instructions.

### Changed
- Counting logic moved out of `main.go` into `count.go`; `main.go` now only parses arguments/flags, opens the input source(s), calls into `count.go`, and formats/prints results. Observable CLI output is unchanged by this refactor. (#258)

### Fixed
- N/A — first release.

