# prime_tester

A small C++17 command-line tool that reports whether each given integer is prime.

## Build

```
cmake -B build
cmake --build build
```

The `prime_tester` executable is produced under `build/`.

## Run

Pass integers as command-line arguments:

```
./build/prime_tester 2 3 4 17 18
```

Or, with no arguments, feed integers one per line on stdin (terminated by EOF):

```
printf '2\n4\n17\n' | ./build/prime_tester
```

Each value produces one line of output: `<n> is prime` or `<n> is not prime`.

A token that isn't a valid integer (or is out of `long long` range) is reported
to stderr as `not a number: <token>`; processing continues for the remaining
input, and the program exits with status 1 once done. A run with no bad tokens
exits 0.

## Manual Verification

Build first (see [Build](#build) above), then run each command below from the
repository root and compare its output to the table. All commands redirect
stderr into stdout (`2>&1`) so any error message the program prints appears
in the captured output alongside normal results. An empty Expected stdout
cell means the command prints nothing at all; a `<br>` inside a cell marks a
line break in the program's actual output.

Note: the CLI has no `--upto` flag. `prime_tester` only ever reads plain
integer tokens (from argv or stdin) — it does not parse option flags. The
`--upto 30` row below documents the CLI's real (current) behavior when given
that input: `--upto` is rejected as a non-numeric token and `30` is then
processed normally as a separate integer argument. If a range/sieve mode is
actually wanted, that's a feature gap in the "Prime tester console app" task,
not something fixed here.

| Command | Expected stdout | Expected exit status |
| --- | --- | --- |
| `./build/prime_tester 17 2>&1` | `17 is prime` | `0` |
| `./build/prime_tester 18 2>&1` | `18 is not prime` | `0` |
| `./build/prime_tester 0 2>&1` | `0 is not prime` | `0` |
| `./build/prime_tester 1 2>&1` | `1 is not prime` | `0` |
| `./build/prime_tester -7 2>&1` | `-7 is not prime` | `0` |
| `./build/prime_tester abc 2>&1` | `not a number: abc` | `1` |
| `printf '' \| ./build/prime_tester 2>&1` | *(empty)* | `0` |
| `./build/prime_tester --upto 30 2>&1` | `not a number: --upto`<br>`30 is not prime` | `1` |
