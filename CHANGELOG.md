## 0.1.0 -- e2e calculator 0.1.0

# Changelog

## [0.1.0] — Initial Release

### Added
- **Maven project skeleton** (`pom.xml`): `groupId=com.buildboard`, `artifactId=calculator`, `version=0.1.0`, Java 21 via `maven-compiler-plugin`, JUnit Jupiter 5.10.2 (test scope), `maven-surefire-plugin` 3.2.5.
- **Placeholder smoke test** (`src/test/java/com/buildboard/calculator/SkeletonTest.java`): single `@Test` asserting `assertTrue(true)` — confirms `mvn -B test` passes on a clean checkout.
- **Expression evaluator** (`src/main/java/com/buildboard/calculator/Evaluator.java`): pure-Java recursive-descent parser supporting `+`, `-`, `*`, `/`, operator precedence, parentheses to arbitrary depth, decimal literals, leading and post-operator unary minus, insignificant whitespace.
- **Checked exception** (`src/main/java/com/buildboard/calculator/CalculationException.java`): extends `Exception`, carries a descriptive message; thrown on division-by-zero and malformed input; no `NaN`/`Infinity` is ever returned.
- **Evaluator test suite** (`src/test/java/com/buildboard/calculator/EvaluatorTest.java`): covers precedence, nested parentheses, decimals, unary minus (leading and post-operator), division-by-zero, unbalanced parentheses, empty string, whitespace insignificance.
- **Swing calculator window** (`src/main/java/com/buildboard/calculator/CalculatorWindow.java`): `JFrame` (title `"Calculator"`, 320×420 px, not resizable); right-aligned non-editable `JTextField` display; full button grid (`0`–`9`, `.`, `+`, `-`, `*`, `/`, `(`, `)`, `C`, `=`); keyboard mapping (`Enter`=evaluate, `Escape`=clear, `Backspace`=delete-last); result formatted to ≤10 significant digits with no trailing zeros; error message shown on `CalculationException` with fresh-expression-on-next-keystroke behaviour.
- **Application entry point** (`src/main/java/com/buildboard/calculator/Main.java`): launches `CalculatorWindow` on the Swing EDT via `SwingUtilities.invokeLater`.
- **Runnable JAR packaging** (`pom.xml` updated): `maven-jar-plugin` sets `Main-Class: com.buildboard.calculator.Main`; final artifact `target/calculator-0.1.0.jar`.
- **README.md**: project purpose, build/run instructions (`mvn -B test`, `mvn -B package`, `java -jar target/calculator-0.1.0.jar`), planned file layout, confirmation that all tests pass during package.
- **CI build workflow** (`.github/workflows/build.yml`): BuildBoard-managed workflow scaffolded for this project.
