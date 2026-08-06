# Prime Tester

A self-contained C++17 command-line utility that tests whether integers are prime.

## Build

Requires CMake 3.16+ and a C++17-capable compiler (GCC, Clang, or MSVC).

```sh
cmake -B build && cmake --build build
```

The executable is produced at `build/prime_tester` (or `build/prime_tester.exe` on Windows).

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
|-----------|---------|
| `0` | All tokens were valid integers; clean run. |
| `1` | At least one token was invalid or overflowed `long long`. |

## Algorithm

`is_prime` uses trial division up to √n with the 6k±1 optimisation:

- Returns `false` for n < 2 (covers negatives, 0, and 1).
- Returns `true` for n = 2 and n = 3.
- Returns `false` for even n > 2 or n divisible by 3.
- Tests candidate divisors i = 5, 11, 17, … (i.e. 6k−1 and 6k+1 pairs) up to √n.
