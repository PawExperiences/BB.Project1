# cli-greeter

A minimal Node.js CLI greeter.

## Usage

### No arguments

```
$ node greet.js
Hello, world!
```

### One name

```
$ node greet.js Alice
Hello, Alice!
```

### Multiple names

```
$ node greet.js Alice Bob
Hello, Alice, Bob!
```

### Help

```
$ node greet.js --help
Usage: node greet.js [name...]
```

## Self-check

`check.js` is a standalone, dependency-free Node script that exercises the CLI's
four documented cases and fails loudly (non-zero exit) if any of them stops
matching its expected output. Run it with `node check.js` to verify the CLI
still behaves as documented, without configuring or running the Vitest suite.

The four cases it checks, each with the exact command and exact expected output:

### No name given

```
$ node greet.js
Hello, world!
```

### One name given

```
$ node greet.js Alice
Hello, Alice!
```

### Two names given

```
$ node greet.js Alice Bob
Hello, Alice, Bob!
```

### `--help`

```
$ node greet.js --help
Usage: node greet.js [name...]
```
