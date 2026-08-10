# BB.Project1 -- e2e calculator (Claude Code CLI)

A Java 21 / Maven / Swing calculator, built test-first with JUnit 5.

## Build

```
mvn -B test
```

## Planned layout

This card only sets up the Maven skeleton (`pom.xml`, the source
directories, and a placeholder `SkeletonTest`). The files below are
owned by later cards and are not created here:

- `src/main/java/com/buildboard/calculator/Evaluator.java` -- expression
  evaluation core (card: "Expression evaluation core, tests first").
- `src/test/java/com/buildboard/calculator/EvaluatorTest.java` -- tests
  for the evaluator (card: "Expression evaluation core, tests first").
- `src/main/java/com/buildboard/calculator/CalculatorWindow.java` --
  Swing UI (card: "Swing calculator window").
- `src/main/java/com/buildboard/calculator/Main.java` -- application
  entry point and runnable-JAR packaging (card: "Package as a runnable
  JAR").
