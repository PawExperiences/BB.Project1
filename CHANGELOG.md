## 0.4.0 -- e2e calculator cc 0.4.0

# Changelog

## [0.4.0] - 2026-08-10

### Added
- Maven project skeleton targeting Java 21 with JUnit 5.10.2 + Surefire 3.2.5, so `mvn -B test` runs green from an empty project (#192).
- `Evaluator.evaluate(String)`: a UI-independent four-function arithmetic engine with correct `*`/`/` over `+`/`-` precedence, arbitrarily nested parentheses, decimal literals, and unary minus (leading and post-operator); whitespace is insignificant (#193).
- `CalculationException`: a checked exception thrown for division by zero and malformed input (unbalanced parentheses, empty string, etc.) so `evaluate()` never returns `NaN`/`Infinity` (#193).
- `CalculatorWindow`: a Swing `JFrame` ("Calculator", 320x420 minimum) with a non-editable right-aligned display, a `GridBagLayout` button grid (digits, `.`, `+ - * /`, `(` `)`, `C`, `=`), and full keyboard mirroring (digits/operators, Enter=`=`, Escape=`C`, Backspace) (#194).
- `Main`: application entry point that launches `CalculatorWindow` on the Swing EDT via `SwingUtilities.invokeLater` (#195).
- `maven-jar-plugin` configuration producing a self-contained, directly runnable `target/calculator-0.1.0.jar` (`Main-Class: com.buildboard.calculator.Main`); no shade/assembly plugin needed since there are no runtime dependencies (#195).

### Changed
- `README.md` expanded across the series (#192, #195): documents the planned/actual source layout and the exact build (`mvn -B package`) and run (`java -jar target/calculator-0.1.0.jar`) commands.

### Fixed
- N/A -- first tracked release.

### Note
- Commit `a021393` ("chore: add a dummy text file (sample untracked PR)", #191) added `test/sample-pr.txt`. It is outside the groomed scope of every bundled task for this release; called out here for visibility only, not treated as a v0.4.0 feature.
