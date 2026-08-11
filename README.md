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
