# calculator

A small Java 21 + Swing calculator app, built with Maven.

## Build

```
mvn -B test
```

## Planned layout

This card only bootstraps the Maven skeleton (`pom.xml`, directory layout, and
a trivial placeholder test). The following files are planned for upcoming
cards and do not exist yet:

- `src/main/java/com/buildboard/calculator/Evaluator.java` -- the expression
  evaluator (domain logic, no UI imports, so it stays independently testable).
- `src/test/java/com/buildboard/calculator/EvaluatorTest.java` -- JUnit 5
  tests for the evaluator, written before the implementation.
- `src/main/java/com/buildboard/calculator/CalculatorWindow.java` -- the
  Swing UI that wraps the evaluator.
- `src/main/java/com/buildboard/calculator/Main.java` -- the application
  entry point, and the `Main-Class` for the runnable JAR.
