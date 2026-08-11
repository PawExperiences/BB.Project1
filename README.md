# prime_tester

A small C++ command-line tool that reports whether integers are prime.

## Build

Configure and build with:

```sh
cmake -B build && cmake --build build
```

The `prime_tester` executable is produced at `build/prime_tester`. Run it
directly, e.g. `./build/prime_tester 17`.

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

## Manual Verification

After building per the Build section above, the following commands can be
run against `build/prime_tester` to confirm its behaviour. Each row shows
the literal command, the exact stdout it produces, and its exit status.
"(empty)" means the command produces no stdout output (a `not a number:`
message, where present, goes to stderr, not stdout).

| Command | Expected stdout | Expected exit status |
| --- | --- | --- |
| `./build/prime_tester 17` | `17 is prime` | `0` |
| `./build/prime_tester 4` | `4 is not prime` | `0` |
| `./build/prime_tester 0` | `0 is not prime` | `0` |
| `./build/prime_tester 1` | `1 is not prime` | `0` |
| `./build/prime_tester -5` | `-5 is not prime` | `0` |
| `./build/prime_tester abc` | (empty) | `1` |
| `printf '' \| ./build/prime_tester` | (empty) | `0` |
| `./build/prime_tester --upto 30` | `2`<br>`3`<br>`5`<br>`7`<br>`11`<br>`13`<br>`17`<br>`19`<br>`23`<br>`29` | `0` |
