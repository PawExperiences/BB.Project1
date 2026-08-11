# prime_tester

A small C++ command-line tool that reports whether integers are prime.

## Build

```sh
cmake -B build
cmake --build build
```

The `prime_tester` executable is produced under `build/`.

## Usage

Test integers passed as arguments:

```sh
./build/prime_tester 2 4 17
```

Or pipe integers, one per line, via stdin:

```sh
printf '2\n4\n17\n' | ./build/prime_tester
```

Each input produces one line of output in the form `<n> is prime` or
`<n> is not prime`. A token that isn't a valid integer (or doesn't fit in
`long long`) prints `not a number: <token>` to stderr; the program still
processes the remaining input and exits with status 1 if any token was
invalid, or status 0 if all input was valid.
