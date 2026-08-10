# BB.Project1 -- e2e calculator (Claude Code CLI)

A Java 21 / Maven / Swing calculator, built test-first with JUnit 5.

## Build

```
mvn -B package
```

`mvn -B package` passes with all tests enabled (none are skipped) and
produces `target/calculator-0.1.0.jar`, a single executable JAR with
`Main-Class: com.buildboard.calculator.Main` in its manifest.

## Run

```
java -jar target/calculator-0.1.0.jar
```

No `-cp`/`-classpath` argument is needed -- the project has no runtime
dependencies, so the JAR runs standalone.

## Layout

- `src/main/java/com/buildboard/calculator/Evaluator.java` -- expression
  evaluation core.
- `src/test/java/com/buildboard/calculator/EvaluatorTest.java` -- tests
  for the evaluator.
- `src/main/java/com/buildboard/calculator/CalculatorWindow.java` --
  Swing UI.
- `src/main/java/com/buildboard/calculator/Main.java` -- application
  entry point; shows `CalculatorWindow` on the Swing Event Dispatch
  Thread and is packaged as the runnable JAR's `Main-Class`.
