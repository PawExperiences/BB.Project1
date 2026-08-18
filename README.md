# prime_tester

A small, standalone C++17 command-line program that reports, for each
integer it is given, whether that integer is prime.

The primality check lives in `src/prime.cpp` (`bool is_prime(long long n)`,
declared in `src/prime.h`): trial division up to √n with the 6k±1
optimisation — 2 and 3 are handled directly, then only candidate divisors
of the form 6k−1 and 6k+1 are tested. Numbers below 2 (0, 1 and all
negatives) are not prime; 2 and 3 are prime.

## Build

Requires CMake 3.16+ and a C++17 compiler. No third-party dependencies.

```sh
cmake -B build && cmake --build build
```

This produces the single executable `build/prime_tester`.

## Usage

**Arguments mode** — each command-line argument is one token, echoed
verbatim, and stdin is ignored:

```sh
$ ./build/prime_tester 2 4 17
2 is prime
4 is not prime
17 is prime
```

**stdin mode** — with no arguments, one token is read per line until EOF;
leading/trailing whitespace on a line is ignored, and a line with interior
whitespace (e.g. `3 5`) is a bad token:

```sh
$ printf '2\n4\n17\n' | ./build/prime_tester
2 is prime
4 is not prime
17 is prime
```

For each token the program prints exactly `<n> is prime` or
`<n> is not prime` to stdout, in input order. `<n>` is the parsed integer
in decimal (token `007` prints `7 is prime`); an optional leading `+`/`-`
sign is accepted.

## Errors and exit codes

A token that is not an integer — or that does not fit in a `long long`
(e.g. `99999999999999999999999`) — is reported on stderr as
`not a number: <token>` with the token echoed verbatim, and processing
continues with the remaining input:

```sh
$ ./build/prime_tester 7 abc 12
7 is prime
not a number: abc    # written to stderr
12 is not prime
$ echo $?
1
```

- **Exit 0** — every token parsed cleanly. Empty input (no arguments and
  immediate EOF on stdin) is a clean run that prints nothing.
- **Exit 1** — at least one bad token occurred. Note that a blank or
  all-whitespace stdin line is an empty token and is reported as
  `not a number: `; immediate EOF (zero lines) is not.
