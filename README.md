# greet.js

A minimal Node.js greeting CLI. No dependencies, no build step — just run it
with `node`.

## Usage

```
node greet.js [name...]
```

## Behaviour

| Invocation                      | Output                        |
| -------------------------------- | ------------------------------ |
| `node greet.js`                  | `Hello, world!`                |
| `node greet.js Alice`            | `Hello, Alice!`                |
| `node greet.js Alice Bob Carol`  | `Hello, Alice, Bob, Carol!`    |
| `node greet.js --help`           | `Usage: node greet.js [name...]  (e.g. node greet.js Alice Bob)` |

- With no arguments, the tool greets `world`.
- With one name, it greets that name.
- With two or more names, it greets all of them, joined with `, ` before the
  final `!`.
- `--help` prints the usage line above instead of greeting anyone.

Each case prints exactly the shown line followed by a newline, and exits with
code `0`.

## Self-check

`check.js` is a plain Node.js script (no test framework, no dependencies)
that runs the CLI for the four cases below and checks its stdout against the
exact expected output.

No name argument:

```
$ node greet.js
Hello, world!
```

One name argument:

```
$ node greet.js Alice
Hello, Alice!
```

Two name arguments:

```
$ node greet.js Alice Bob
Hello, Alice, Bob!
```

`--help` flag:

```
$ node greet.js --help
Usage: node greet.js [name...]  (e.g. node greet.js Alice Bob)
```

Run `node check.js` to verify these four cases. It exits `0` and reports
success when all four match, or exits non-zero and reports which case failed
otherwise.
