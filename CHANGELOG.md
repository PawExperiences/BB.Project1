## 0.1.0 -- e2e cli greeter 0.1.0

## [0.1.0] - 2026-08-15

First release. No previous version to diff against, so everything below is new.

### Added
- `greet.js` - minimal Node.js CLI greeter run as `node greet.js [names...]`. No arguments prints `Hello, world!`; one name prints `Hello, NAME!`; two or more names are joined with `, ` (e.g. `node greet.js Alice Bob` -> `Hello, Alice, Bob!`); `--help` prints exactly one usage line and exits 0. Plain JavaScript, manual `process.argv` handling, no CLI-parsing dependency (commander/yargs). (#321)
- `src/greet-lib.ts` - standalone `greeting(names: string[]): string` module extracted from the CLI so the sentence-building logic is independently unit-testable: `greeting([])` -> `"Hello, World!"`, `greeting(["Alice"])` -> `"Hello, Alice!"`, `greeting(["Alice","Bob"])` -> `"Hello, Alice and Bob!"`, 3+ names use an Oxford comma (`"Hello, Alice, Bob, and Carol!"`). Pure function, no argv/process I/O. Covered by `src/greet-lib.test.ts`. (#320)
- `check.js` - dependency-free Node self-check that exercises the CLI's four documented behaviours (no name, one name, two names, `--help`), prints per-case pass/fail, and exits non-zero the moment any case's actual output stops matching the expected output. (#322)
- `README.md` - documents all four CLI cases with the literal command and literal expected output, and tells the reader `node check.js` is how to verify them. (#321, expanded in #322)
- Project toolchain scaffolding for the TypeScript module: `package.json`, `package-lock.json`, `tsconfig.json` (first introduction of a build/test toolchain in this repo; `greet.js` and `check.js` remain plain, unbuilt Node scripts). (#320)

### Changed
- n/a (first release)

### Fixed
- n/a (first release)

### Note on the supplied diffstat
The raw diffstat handed to this release shows all 9 files as pure deletions (`9 files changed, 1392 deletions(-)`), which contradicts the commit log (`feat: greet`, `feat: greeting logic in its own file`, `feat: a self-check and the readme`). The per-file line counts match exactly what each ticket describes adding (greet.js 9 lines, README.md 70 lines, check.js 55 lines, src/greet-lib.ts 14 lines, etc.), so this changelog treats the diffstat as reporting the correct file set with an inverted +/- sign (base/target swapped), not as real deletions. Flagging this for whoever generates release diffstats so the sign gets fixed upstream.
