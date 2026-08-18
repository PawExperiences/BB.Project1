# Calculator (Java Swing)

A desktop calculator application written in Java 21 with a Swing user
interface. The domain logic (arithmetic expression evaluation) is kept in
plain classes with no UI imports so it stays unit-testable; the Swing
window is a thin layer on top.

## Build and test

Requires a JDK 21+ and Maven. From the repository root:

```sh
mvn -B test
```

runs the JUnit 5 test suite via Maven Surefire, and

```sh
mvn package
```

runs the tests and assembles the JAR. (Runnable-JAR packaging — a
`Main-Class` manifest entry via maven-jar-plugin or maven-shade-plugin —
is owned by the later card "Package as a runnable JAR".)

The build is defined by `pom.xml` at the repository root: Java 21
(`maven-compiler-plugin` with `<release>21</release>`), JUnit 5
(`org.junit.jupiter:junit-jupiter:5.10.2`, test scope) and
`maven-surefire-plugin:3.2.5` for test discovery and execution.

## Layout

All application code lives in package `com.buildboard.calculator` under
the standard Maven directory layout:

- `src/main/java/com/buildboard/calculator/` — application sources
- `src/test/java/com/buildboard/calculator/` — JUnit 5 tests (tests are
  written before the implementation, TDD-style)

### Planned files (owned by later cards — documented here, not created yet)

- `src/main/java/com/buildboard/calculator/Evaluator.java` — the
  arithmetic expression evaluator; a plain class with no Swing/UI imports
  so it stays testable.
- `src/test/java/com/buildboard/calculator/EvaluatorTest.java` — the
  JUnit 5 test suite for the evaluator, written tests-first by its owning
  card.
- `src/main/java/com/buildboard/calculator/CalculatorWindow.java` — the
  Swing window (UI layer) built on top of the evaluator.
- `src/main/java/com/buildboard/calculator/Main.java` — the application
  entry point that launches the calculator window.

### Present today (this skeleton card)

- `pom.xml` — the Maven build described above.
- `src/test/java/com/buildboard/calculator/SkeletonTest.java` — a
  trivially-green placeholder test proving `mvn -B test` discovers and
  runs JUnit 5 tests from a clean checkout.
