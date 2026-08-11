## 0.1.0 -- e2e word count 0.1.0

## [0.1.0] - 2026-08-11

### Added
- Initial Go implementation of a `wc`-style word-count CLI (`go.mod` — module `wordcount`, go 1.22 — and `main.go`). Reads each file named on the command line, or stdin when none are given, and writes one line per input: `<lines>\t<words>\t<bytes>\t<name>` (`-` for stdin).
- `total` summary line printed after the per-file lines whenever more than one input is processed, summing lines/words/bytes across the files that were read successfully.
- Per-file error handling: a file that can't be opened is reported as `wordcount: <name>: <error>` on stderr and skipped, while the run continues; the process exits 1 if any named file failed to open, 0 otherwise.
- `README.md` describing the tool's usage and output format.
- Table-driven tests in `count_test.go` covering four cases: empty input, a line with no trailing newline, runs of consecutive whitespace, and multi-byte UTF-8 input.
- A README usage/output table documenting the exact command and exact output for each of those four test cases.

### Changed
- Counting logic moved out of `main.go` into a new `count.go`, behind an exported `Counts{Lines, Words, Bytes}` struct and an exported `io.Reader`-based counting function; `main.go` now only handles CLI argument/flag parsing and I/O wiring. Pure refactor — CLI output is unchanged for any given input.

### Fixed
- Nothing (first release; no fixes in this bundle).
