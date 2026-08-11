# calculator

A Java 21 desktop calculator, built with Maven and Swing.

## Build

This project uses the standard Maven layout. Run the test suite with:

```sh
mvn -B test
```

## Planned layout

This card only bootstraps the project skeleton (`pom.xml`, the Maven
directory layout, and a placeholder `SkeletonTest`). The following files are
owned by future cards and are not created here:

| File | Location | Purpose |
| --- | --- | --- |
| `Evaluator.java` | `src/main/java/com/buildboard/calculator/` | Expression evaluation logic (plain class, no UI imports). |
| `EvaluatorTest.java` | `src/test/java/com/buildboard/calculator/` | JUnit 5 tests for `Evaluator`, written before the implementation. |
| `CalculatorWindow.java` | `src/main/java/com/buildboard/calculator/` | Swing UI for the calculator. |
| `Main.java` | `src/main/java/com/buildboard/calculator/` | Application entry point. |

Domain logic (`Evaluator`) is kept free of UI imports so it stays testable
independently of Swing.
