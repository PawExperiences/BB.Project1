## 0.4.0 -- e2e calculator cc 0.4.0

## [0.4.0] - 2026-08-11

### Added
- Maven project skeleton targeting Java 21 (`pom.xml`: groupId `com.buildboard`, artifactId `calculator`, version `0.1.0`, packaging `jar`), wired for JUnit 5.10.2 via Surefire 3.2.5, with the standard `src/main/java` / `src/test/java` layout and a placeholder `SkeletonTest` proving `mvn -B test` is green end to end. (#212)
- `Evaluator.evaluate(String)` — the arithmetic core, built test-first (`EvaluatorTest.java` committed before `Evaluator.java`): `+ - * /` with standard precedence, parentheses nested to any depth, decimal literals, leading and post-operator unary minus, and whitespace-insensitive parsing. (#213)
- `CalculationException` — a checked exception naming the specific problem (division by zero, unbalanced parentheses, empty input, invalid syntax); `evaluate` never returns `NaN`/`Infinity`/a sentinel value. (#213)
- `CalculatorWindow` — a 320x420 (fixed minimum size) Swing `JFrame`: right-aligned read-only expression display, `GridBagLayout` button grid (`0`-`9`, `.`, `+ - * /`, `(` `)`, `C`, `=`), full keyboard mirroring (digits/operators, `ENTER` = `=`, `ESCAPE` = `C`, `BACKSPACE` = delete-last), and stale-display-clears-on-next-keystroke behavior after every `=` (success or error). Covered by `CalculatorWindowTest.java`. (#214)
- `Main` — application entry point that constructs and shows `CalculatorWindow` on the Swing Event Dispatch Thread via `SwingUtilities.invokeLater`. (#215)
- `maven-jar-plugin` configuration embedding `Main-Class: com.buildboard.calculator.Main`, so `mvn -B package` produces a directly runnable `target/calculator-0.1.0.jar` (no shade/assembly plugin needed — zero runtime dependencies). (#215)
- `README.md` documents the project layout and, as of #215, the exact build (`mvn -B package`) and run (`java -jar target/calculator-0.1.0.jar`) commands. (#212, #215)

### Changed
- None — initial release.

### Fixed
- None — initial release.
