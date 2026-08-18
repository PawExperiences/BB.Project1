# prime_tester

A small, standalone C++17 command-line program that reports, for each
integer it is given, whether that integer is prime.

The primality check lives in `src/prime.cpp` (`bool is_prime(long long n)`,
declared in `src/prime.h`): trial division up to √n with the 6k±1
optimisation — 2 and 3 are handled directly, then only candidate divisors
of the form 6k−1 and 6k+1 are tested. Numbers below 2 (0, 1 and all
negatives) are not prime; 2 and 3 are prime.

A second mode, `--upto N`, prints every prime up to N (the sieve in
`src/sieve.cpp`, interface in `src/sieve.h`); the worked examples at the
end of this file show its exact output.

## Build

Requires CMake 3.16+ and a C++17 compiler. No third-party dependencies.
From the repository root, run the two commands in order:

```sh
cmake -B build
cmake --build build
```

This produces the single executable `build/prime_tester` (the
`prime_tester` target defined in `CMakeLists.txt`).

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

## Worked examples (manual verification)

Build first (the two commands in the Build section above), then run each
row below from the repository root and compare what you see against the
row: the **Expected stdout** column is byte-for-byte, and the **Expected
exit status** column is what `echo $?` prints immediately after the
command exits.

Formatting conventions used in the table:

- stdout is shown exactly as printed; every line shown ends with a
  trailing newline (`\n`), including the last one.
- "(empty)" means the command writes nothing at all to stdout (zero
  bytes).
- stderr is a separate stream and is not part of the comparison; where a
  row produces a stderr message, its exact text is noted in the row for
  completeness.

| Scenario | Command | Expected stdout | Expected exit status |
| --- | --- | --- | --- |
| A prime number | `./build/prime_tester 7` | `7 is prime` | 0 |
| A composite number | `./build/prime_tester 9` | `9 is not prime` | 0 |
| Zero | `./build/prime_tester 0` | `0 is not prime` | 0 |
| One | `./build/prime_tester 1` | `1 is not prime` | 0 |
| A negative integer | `./build/prime_tester -7` | `-7 is not prime` | 0 |
| A non-numeric token | `./build/prime_tester abc` | (empty — stderr carries `not a number: abc`) | 1 |
| Empty stdin | `./build/prime_tester < /dev/null` | (empty) | 0 |
| All primes up to 30 | `./build/prime_tester --upto 30` | `2`<br>`3`<br>`5`<br>`7`<br>`11`<br>`13`<br>`17`<br>`19`<br>`23`<br>`29` | 0 |

If every row matches — stdout byte-for-byte and the same exit status —
the build behaves exactly as documented.
