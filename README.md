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
