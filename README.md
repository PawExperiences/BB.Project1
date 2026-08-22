# prime_tester (C++)

A self-contained C++17 command-line prime-number tester, built with CMake.
It answers "is this number prime?" for numbers supplied on the command
line or piped in on stdin.

## Build, run, and test

From the repository root:

```sh
cmake -B build
cmake --build build
```

This produces the `prime_tester` executable at `build/prime_tester`. The
build has no third-party dependencies (standard library only).

Run it by piping a number on stdin, or with `--upto` for range mode:

```sh
echo 7 | ./build/prime_tester
./build/prime_tester --upto 30
```

Run the test suite (covers the range sieve behind `--upto`) with CTest:

```sh
ctest --test-dir build
```

## Worked examples

Each row below was produced by building `build/prime_tester` from the
current source and running the exact command shown, capturing its stdout
and its exit status (`echo $?`).

| Command | Expected stdout | Exit status |
|---|---|---|
| `echo 7 \| ./build/prime_tester` | `7 is prime` | `0` |
| `echo 9 \| ./build/prime_tester` | `9 is not prime` | `0` |
| `echo 0 \| ./build/prime_tester` | `0 is not prime` | `0` |
| `echo 1 \| ./build/prime_tester` | `1 is not prime` | `0` |
| `echo "-5" \| ./build/prime_tester` | `-5 is not prime` | `0` |
| `echo abc \| ./build/prime_tester` | (no output) | `1` |
| `printf '' \| ./build/prime_tester` | (no output) | `0` |
| `./build/prime_tester --upto 30` | `2`, `3`, `5`, `7`, `11`, `13`, `17`, `19`, `23`, `29`, each on its own line | `0` |

Notes:

- For the `abc` row, the program writes `not a number: abc` to **stderr**,
  not stdout; stdout is empty for that command, which is why the table
  shows no stdout output there.
- For the empty-stdin row, the program writes nothing to either stdout or
  stderr and exits `0`.

## Usage

### Arguments mode

Pass one or more integers as arguments:

```sh
$ ./build/prime_tester 7 8 1 -3 2
7 is prime
8 is not prime
1 is not prime
-3 is not prime
2 is prime
$ echo $?
0
```

### Stdin mode

With no arguments, the program reads integers from stdin, one per line,
until EOF:

```sh
$ printf '11\n12\n' | ./build/prime_tester
11 is prime
12 is not prime
```

### Bad input

A token that is not an integer, or an integer that does not fit in a
`long long`, is reported on stderr as `not a number: <token>`. The
program keeps processing the remaining tokens/lines rather than
stopping:

```sh
$ ./build/prime_tester 5 abc 6
5 is prime
6 is not prime
$ echo $?
1
```

(`not a number: abc` is printed on stderr.)

### Exit codes

- `0` — every token parsed cleanly (including the case of empty input:
  no arguments and empty/closed stdin, which prints nothing and exits
  0).
- `1` — at least one token was rejected as not a number, regardless of
  how many.

## Layout

- `CMakeLists.txt` — build definition for the `prime_tester` executable.
- `src/prime.h` / `src/prime.cpp` — `bool is_prime(long long n)`: trial
  division up to the square root with the 6k±1 optimisation.
- `src/main.cpp` — command-line front-end: argument/stdin parsing and
  output formatting.

## Unrelated files in this repository

The repository also contains leftovers from earlier, unrelated
projects (a JavaScript game at the repository root, a Java Swing
calculator under `src/main/java` and `src/test/java` with its own
`pom.xml`, and `src/sieve.h` / `src/sieve.cpp` / `tests/sieve_test.cpp`
for a range-sieve feature that is not part of this executable). They
are not referenced by `CMakeLists.txt` and are kept untouched.
