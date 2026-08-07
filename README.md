# Prime Tester

A self-contained C++17 command-line utility that tests whether integers are prime.

---

## Build

Run the following two commands from the repository root:

```sh
cmake -B build
cmake --build build
```

The compiled executable is placed at `./build/prime_tester`.

> **Note:** The task specification refers to the executable as `./build/prime`; however, the `CMakeLists.txt` in this repository names the target `prime_tester`, so the binary produced by the build is `./build/prime_tester`. The worked examples below use the actual binary name. If you see references to `./build/prime` elsewhere, substitute `./build/prime_tester`.

---

## Usage

### Single-number mode (argv)

Pass one or more integers as command-line arguments:

```sh
./build/prime_tester 7
./build/prime_tester 2 3 4 5
```

### Stdin mode

Pipe whitespace-delimited integers to the binary:

```sh
echo '17 18 19' | ./build/prime_tester
```

### Range mode (`--upto N`)

Print every prime up to N:

```sh
./build/prime_tester --upto 30
```

---

## Worked Examples

The table below documents the expected behaviour for eight representative inputs.
All commands are run from the repository root after building.
Stdout and exit status were recorded from the `./build/prime_tester` binary.

| # | Command | Expected stdout | Expected exit status |
|---|---------|-----------------|----------------------|
| 1 | `./build/prime_tester 7` | `7 is prime` | `0` |
| 2 | `./build/prime_tester 9` | `9 is not prime` | `0` |
| 3 | `./build/prime_tester 0` | `0 is not prime` | `0` |
| 4 | `./build/prime_tester 1` | `1 is not prime` | `0` |
| 5 | `./build/prime_tester -5` | `-5 is not prime` | `0` |
| 6 | `./build/prime_tester abc` | *(empty — error goes to stderr: `not a number: abc`)* | non-zero (`1`) |
| 7 | `echo \| ./build/prime_tester` | *(empty — error goes to stderr: `not a number: `)* | non-zero (`1`) |
| 8 | `./build/prime_tester --upto 30` | `2 3 5 7 11 13 17 19 23 29` | `0` |

**Notes:**

- For rows 6 and 7 the error text is written to **stderr**, not stdout; stdout is empty.
- Exit status `1` is returned whenever any token fails to parse as a valid integer.
- Negative integers (row 5) are not prime but are not parse errors; the process exits `0`.
- The `--upto` range mode (row 8) prints each prime separated by a newline; the table shows them space-joined for compactness.
