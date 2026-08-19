# Calculator (Java Swing)

A desktop calculator application written in Java 21 with a Swing user
interface. The domain logic (arithmetic expression evaluation) is kept in
plain classes with no UI imports so it stays unit-testable; the Swing
window is a thin layer on top.

## Requirements

- JDK 21 or newer (Java 21 is the build and runtime requirement)
- A recent Maven 3.x

## Build

From the repository root:

```sh
mvn -B package
```

This compiles the application, runs the entire JUnit 5 test suite via
Maven Surefire (all tests are enabled; the build fails if any test
fails) and assembles the runnable JAR at `target/calculator-0.1.0.jar`.
`mvn -B package` passes green with the full test suite enabled.

To run only the tests:

```sh
mvn -B test
```

## Run

On any machine with a graphical display and a Java 21 runtime:

```sh
java -jar target/calculator-0.1.0.jar
```

launches the calculator window. The entry point,
`com.buildboard.calculator.Main`, creates and shows the window on the
Swing event dispatch thread via `SwingUtilities.invokeLater`, as Swing
requires.

The JAR is an ordinary thin JAR: the application has **no runtime
dependencies**, so its manifest only needs the
`Main-Class: com.buildboard.calculator.Main` entry, configured in
`pom.xml` via `maven-jar-plugin`. No `maven-shade-plugin` or other
uber-jar mechanism is used — there is nothing to shade. The manifest can
be inspected with:

```sh
unzip -p target/calculator-0.1.0.jar META-INF/MANIFEST.MF
```

## Build definition

The build is defined by `pom.xml` at the repository root: Java 21
(`maven-compiler-plugin` with `<release>21</release>`), JUnit 5
(`org.junit.jupiter:junit-jupiter:5.10.2`, test scope),
`maven-surefire-plugin:3.2.5` for test discovery and execution, and
`maven-jar-plugin` configured with the `Main-Class` manifest entry that
makes `target/calculator-0.1.0.jar` runnable with `java -jar`.

## Layout

All application code lives in package `com.buildboard.calculator` under
the standard Maven directory layout:

- `src/main/java/com/buildboard/calculator/` — application sources
- `src/test/java/com/buildboard/calculator/` — JUnit 5 tests (tests are
  written before the implementation, TDD-style)

### Application sources

- `Evaluator.java` — the arithmetic expression evaluator; a plain class
  with no Swing/UI imports so it stays testable.
- `CalculationException.java` — the exception thrown for malformed or
  unevaluable expressions.
- `CalculatorWindow.java` — the Swing window (UI layer) built on top of
  the evaluator.
- `Main.java` — the application entry point; launches the calculator
  window on the EDT.

### Tests

- `EvaluatorTest.java` — the evaluator test suite.
- `CalculatorWindowTest.java` — the Swing window test suite.
- `MainTest.java` — the tests-first contract for the entry point (the
  class is loadable and declares `public static void main(String[])`);
  it never opens a window, so it also passes on headless machines.
- `SkeletonTest.java` — the original trivially-green placeholder proving
  `mvn -B test` discovers and runs JUnit 5 tests from a clean checkout.

## Unrelated files in this repository

The repository also contains leftovers from earlier, unrelated projects
(a JavaScript game at the repository root and C++ prime-tester sources
such as `src/main.cpp`). They are not part of this application and are
not referenced by the Maven build; they are kept untouched.
