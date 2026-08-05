# prime_tester

A minimal, dependency-free C++ console application that determines whether integer values are prime numbers.

## Requirements

- CMake 3.16 or newer
- A C++17-capable compiler (GCC, Clang, or MSVC)

## Build

```sh
cmake -B build
cmake --build build
```

The executable is produced at `build/prime_tester` (or `build/prime_tester.exe` on Windows).

## Usage

### Argument mode

Pass one or more integers as command-line arguments:

```sh
./build/prime_tester 2 3 4 97
```

Example output:

```
2 is prime
3 is prime
4 is not prime
97 is prime
```

### Stdin mode

When invoked with no arguments, the program reads one integer per line from standard input until EOF:

```sh
echo -e "5\n9\n13" | ./build/prime_tester
```

Example output:

```
5 is prime
9 is not prime
13 is prime
```

## Error handling

- Tokens that are not valid integers, or whose value overflows `long long`, are reported to **stderr**:
  ```
  not a number: abc
  not a number: 9999999999999999999
  ```
- Processing continues for all remaining tokens after an invalid token.
- The program exits with status **1** if any invalid token was encountered, or **0** if all tokens were valid (including an empty run).

## Algorithm

`is_prime(n)` uses trial division with the 6k±1 optimisation:

1. Returns `false` for any `n < 2`.
2. Returns `true` for `n == 2` or `n == 3`.
3. Returns `false` for any even `n > 2`.
4. For remaining candidates, tests divisors of the form `6k−1` and `6k+1` up to `√n`.
