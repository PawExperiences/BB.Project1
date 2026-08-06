# Prime Tester

A self-contained C++17 command-line utility that tests whether integers are prime.

## Build

Requires CMake 3.16+ and a C++17-capable compiler (GCC, Clang, or MSVC).

```sh
cmake -B build && cmake --build build
```

The executable is produced at `build/prime_tester` (or `build/prime_tester.exe` on Windows).

## Build & Run

### Build commands

From the repository root (clean clone):

```bash
cmake -B build
cmake --build build
```

The compiled binary is at `build/prime_tester` (Linux/macOS) or `build/prime_tester.exe` (Windows).

### Worked examples

> **Note:** The table below was produced by deriving expected output from the documented source behaviour
> (`src/prime.cpp`, `src/sieve.cpp`, and the existing README) together with the CTest definitions in
> `CMakeLists.txt`. Rows 1–7 use stdin mode (no arguments); row 8 uses the `--upto` flag.
> Exit status `0` means all tokens were valid integers; `1` means at least one token was invalid.

| # | Command | Expected stdout | Expected exit status |
|---|---------|-----------------|----------------------|
| 1 | `echo 7 \| ./build/prime_tester` | `7 is prime` | `0` |
| 2 | `echo 9 \| ./build/prime_tester` | `9 is not prime` | `0` |
| 3 | `echo 0 \| ./build/prime_tester` | `0 is not prime` | `0` |
| 4 | `echo 1 \| ./build/prime_tester` | `1 is not prime` | `0` |
| 5 | `echo -5 \| ./build/prime_tester` | `-5 is not prime` | `0` |
| 6 | `echo abc \| ./build/prime_tester` | _(nothing on stdout; `not a number: abc` on stderr)_ | `1` |
| 7 | `echo '' \| ./build/prime_tester` (empty stdin) | _(no output)_ | `0` |
| 8 | `./build/prime_tester --upto 30` | `2`<br>`3`<br>`5`<br>`7`<br>`11`<br>`13`<br>`17`<br>`19`<br>`23`<br>`29` | `0` |

**Notes on individual rows:**

- **Row 5 (negative input):** `-5` is a syntactically valid `long long`, so it is parsed successfully.
  `is_prime` returns `false` for any n < 2, so the output is `-5 is not prime` and the exit status is `0`.
- **Row 6 (non-numeric token):** `abc` cannot be parsed as an integer. The error is reported on **stderr**
  (`not a number: abc`); stdout receives nothing for that token. The process exits with status `1`.
- **Row 7 (empty stdin):** When stdin supplies no tokens before EOF, the program processes zero inputs,
  produces no output, and exits cleanly with status `0`.
- **Row 8 (`--upto 30`):** The sieve prints every prime ≤ 30, one per line: `2 3 5 7 11 13 17 19 23 29`.
  (30 = 2 × 3 × 5 is composite and is not printed.)

## Usage

### Argument mode

Pass one or more integers as command-line arguments:

```sh
./build/prime_tester 2 4 7
```

Expected output (stdout):

```
2 is prime
4 is not prime
7 is prime
```

### Stdin mode

When invoked with no arguments, the program reads one token per line from stdin until EOF:

```sh
echo -e '2\n4\n7' | ./build/prime_tester
```

Expected output (stdout):

```
2 is prime
4 is not prime
7 is prime
```

Or interactively:

```sh
./build/prime_tester
97
97 is prime
100
100 is not prime
^D
```

### Invalid tokens

A token that is not a valid integer, or whose value does not fit in a `long long`, is reported on **stderr** and does not appear on stdout:

```sh
./build/prime_tester 2 abc 7
# stdout:
2 is prime
7 is prime
# stderr:
not a number: abc
```

Processing continues after a bad token; all remaining arguments are still handled.

## Exit-code semantics

| Exit code | Meaning |
|-----------|----------|
| `0` | All tokens were valid integers; clean run. |
| `1` | At least one token was invalid or overflowed `long long`. |

## Algorithm

`is_prime` uses trial division up to √n with the 6k±1 optimisation:

- Returns `false` for n < 2 (covers negatives, 0, and 1).
- Returns `true` for n = 2 and n = 3.
- Returns `false` for even n > 2 or n divisible by 3.
- Tests candidate divisors i = 5, 11, 17, … (i.e. 6k−1 and 6k+1 pairs) up to √n.
