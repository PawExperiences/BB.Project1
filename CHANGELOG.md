## 0.1.0 -- e2e cli greeter 0.1.0

# Changelog

## [0.1.0] - 2026-08-12
Initial release.

### Added
- `greet.js`: minimal Node.js CLI. `node greet.js` (no args) prints `Hello, world!`; `node greet.js Alice` prints `Hello, Alice!`; `node greet.js Alice Bob Carol` prints `Hello, Alice, Bob, Carol!` (names comma-joined, no "and"); `node greet.js --help` prints a single usage line and greets no one. Plain JavaScript, no external dependencies, no build step, no package.json. (#303)
- `README.md`: documents all four `greet.js` invocation cases (no args, one name, multiple names, `--help`) with their exact expected output. (#303, #304)
- `check.js`: dependency-free self-check script (built-in Node modules only — assert/child_process/process) that runs `greet.js` for the no-name, one-name, two-name, and `--help` cases, compares actual stdout to the exact expected output for each, prints which case failed and exits non-zero on any mismatch, and prints success and exits 0 when all four pass. (#304)
- README section documenting the four `check.js`-covered cases (exact command + exact expected output per case) and stating `node check.js` is how to verify them. (#304)
- `src/greet-lib.ts`: standalone, pure `greeting(names: string[]): string` formatter — 0 names -> `"Hello, World!"`, 1 -> `"Hello, Alice!"`, 2 -> `"Hello, Alice and Bob!"` (no comma), 3+ -> serial/Oxford-comma joined (e.g. `"Hello, Alice, Bob, and Carol!"`). Does no argv parsing, `--help` handling, or process I/O. Not yet imported by `greet.js`. (#302)
- `src/greet-lib.test.ts`: Vitest unit tests for `greeting()` covering the 0/1/2/3/4-name cases. (#302)
- Minimal Node+TypeScript project scaffolding: `package.json` (test/lint scripts), `tsconfig.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc.json`, `.gitignore`. No CLI-only dependencies (no commander/yargs) and no `bin/` entry were added, per the groomed scope. (#302)

### Changed
- Repository reset for this build cycle (`chore: reset for the next e2e project`, f3ec2bd) preceded the three feature commits above.

### Fixed
- N/A (initial release, nothing to fix yet).

### Maintainer note
- `greet.js`'s name-joining rule (comma-separated, no "and", lowercase `world` for zero names) intentionally differs today from `src/greet-lib.ts`'s `greeting()` (serial/Oxford comma + "and", capitalized `World`) — the two are not wired together yet. Each matches its own task's acceptance criteria; see the release runbook's manual verification steps before assuming this is a bug.
