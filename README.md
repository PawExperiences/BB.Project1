# prime_tester

A minimal, dependency-free C++17 console application that tests whether integers are prime numbers.

## Build

```sh
cmake -B build
cmake --build build
```

The executable is produced at `build/prime_tester`.

## Usage

### Command-line arguments

Pass one or more integers as arguments:

```sh
./build/prime_tester 7 4 97
```

Output:

```
7 is prime
4 is not prime
97 is prime
```

### Standard input

With no arguments, the program reads one token per line from stdin until EOF:

```sh
echo -e '2\n3\n4' | ./build/prime_tester
```

Output:

```
2 is prime
3 is prime
4 is not prime
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0`  | All tokens parsed and tested successfully (including empty input) |
| `1`  | At least one token was not a valid integer or overflowed `long long` |

Invalid tokens are reported on **stderr**:

```sh
./build/prime_tester 5 abc 7
# stdout: 5 is prime / 7 is prime
# stderr: not a number: abc
# exit:   1
```

## Algorithm

`is_prime` uses trial division with the **6k ± 1 optimisation**:

- Returns `false` for `n < 2`.
- Returns `true` for `n == 2` or `n == 3`.
- Returns `false` for even `n > 2`.
- Otherwise, checks divisibility by `k` and `k+2` for `k = 5, 11, 17, …` (incrementing by 6) up to `√n`.
