# e2e Calculator

A simple end-to-end calculator application built with Java 21, Maven, and Swing.

## Purpose

This project provides a GUI calculator that evaluates arithmetic expressions. The
codebase is structured so that the domain logic (`Evaluator`) is fully decoupled
from the Swing UI (`CalculatorWindow`), keeping it independently unit-testable.

## Prerequisites

- Java 21 (JDK)
- Apache Maven 3.9+

## How to Build and Run

### Build (and test)

```bash
mvn -B package
```

This command compiles all sources, runs all JUnit 5 tests (including
`SkeletonTest.skeletonSmokeTest` and the full `EvaluatorTest` suite), and
packages the application. **All tests pass during `mvn -B package`.**

### Run

```bash
java -jar target/calculator-0.1.0.jar
```

No Maven installation is required at runtime — only a JDK 21 (or later) JRE.

## Packaging Notes

The JAR is built with `maven-jar-plugin`, which sets `Main-Class` in
`META-INF/MANIFEST.MF` to `com.buildboard.calculator.Main`. There are **no
runtime dependencies** beyond the JDK (Swing ships with every standard JDK), so
no fat/shade JAR is needed. Neither `maven-shade-plugin` nor
`maven-assembly-plugin` is present in `pom.xml`. If a runtime dependency is
ever introduced, `README.md` must be updated with an explicit rationale section
explaining why a shade/assembly plugin was added.

## Project Structure

```
calculator/
├── pom.xml
├── README.md
└── src/
    ├── main/
    │   └── java/
    │       └── com/buildboard/calculator/
    │           ├── Evaluator.java          # arithmetic expression parser
    │           ├── CalculationException.java
    │           ├── CalculatorWindow.java   # Swing UI
    │           └── Main.java              # entry point — launches CalculatorWindow
    └── test/
        └── java/
            └── com/buildboard/calculator/
                ├── SkeletonTest.java       # Maven/JUnit 5 wiring smoke test
                └── EvaluatorTest.java     # full evaluator unit tests
```

## Dependencies

| Dependency | Version | Scope |
|------------|---------|-------|
| `org.junit.jupiter:junit-jupiter` | 5.10.2 | test |

## Build Plugins

| Plugin | Version | Purpose |
|--------|---------|--------|
| `maven-compiler-plugin` | 3.12.1 | Compile with Java 21 (`--release 21`) |
| `maven-surefire-plugin` | 3.2.5 | Run JUnit 5 tests |
| `maven-jar-plugin` | 3.3.0 | Set `Main-Class` manifest entry; produce `calculator-0.1.0.jar` |
