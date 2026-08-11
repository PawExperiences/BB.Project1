# factorlib

A small, typed Python library for integer factorization.

## Planned layout

```
pyproject.toml          # packaging metadata (setuptools build backend, src layout)
src/factorlib/
    __init__.py          # public API, exported from here
    py.typed             # PEP 561 typed-package marker
    factor.py            # NOT YET IMPLEMENTED — see below
tests/
    test_factor.py        # tests for the public API
```

## Status

This package is being built test-first. The current state establishes the
package skeleton and a single failing test (`tests/test_factor.py`) asserting
`factorlib.prime_factors(12) == [2, 2, 3]`.

`src/factorlib/factor.py` and the `prime_factors` implementation are **not**
part of this card. They are owned by the sibling card **"Make it pass"**,
which will implement `factor.py` and export `prime_factors` from
`factorlib/__init__.py` so the test above turns green.

A command-line front end is likewise out of scope here and is owned by the
sibling card **"A command-line front end"**.

## Development

```
pip install -e ".[test]"
pytest
```
