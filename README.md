# e2e Calculator

A simple end-to-end calculator application built with Java 21, Maven, and Swing.

## Purpose

This project provides a GUI calculator that evaluates arithmetic expressions. The
codebase is structured so that the domain logic (`Evaluator`) is fully decoupled
from the Swing UI (`CalculatorWindow`), keeping it independently unit-testable.

## Prerequisites

- Java 21 (JDK)
- Apache Maven 3.9+

## How to Build and Test

```bash
# Run all tests (must exit with BUILD SUCCESS)
mvn -B test

# Package into a JAR (also runs tests)
mvn package
```

## Project Structure

```
calculator/
├── pom.xml
├── README.md
└── src/
    ├── main/
    │   └── java/
    │       └── com/buildboard/calculator/
    │           ├── Evaluator.java          # owned by: Expression Evaluator card
    │           ├── CalculatorWindow.java   # owned by: Swing UI card
    │           └── Main.java              # owned by: Runnable JAR card
    └── test/
        └── java/
            └── com/buildboard/calculator/
                ├── SkeletonTest.java       # placeholder — this card
                └── EvaluatorTest.java     # owned by: Expression Evaluator card
```

## Planned Files (not yet created)

The following files are owned by sibling cards and will be added via their own
PRs and reviews. They do **not** exist in this skeleton:

| File | Owning Card |
|------|-------------|
| `src/main/java/com/buildboard/calculator/Evaluator.java` | Expression Evaluator |
| `src/test/java/com/buildboard/calculator/EvaluatorTest.java` | Expression Evaluator |
| `src/main/java/com/buildboard/calculator/CalculatorWindow.java` | Swing UI |
| `src/main/java/com/buildboard/calculator/Main.java` | Runnable JAR / Entry Point |

## Dependencies

| Dependency | Version | Scope |
|------------|---------|-------|
| `org.junit.jupiter:junit-jupiter` | 5.10.2 | test |

## Build Plugins

| Plugin | Version | Purpose |
|--------|---------|--------|
| `maven-compiler-plugin` | 3.12.1 | Compile with Java 21 (`--release 21`) |
| `maven-surefire-plugin` | 3.2.5 | Run JUnit 5 tests |
