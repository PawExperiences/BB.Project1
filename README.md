# calculator

A small Java 21 + Swing calculator app, built with Maven.

## Build

```
mvn -B package
```

This runs all tests (none disabled/skipped) and, on success, produces
`target/calculator-0.1.0.jar` with `Main-Class: com.buildboard.calculator.Main`
set in the jar manifest via `maven-jar-plugin`.

## Run

```
java -jar target/calculator-0.1.0.jar
```
