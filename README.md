# factorlib

A small, typed Python library for integer factorization.

## Package layout

```
pyproject.toml          Packaging metadata (setuptools backend, src/ layout)
src/factorlib/
    __init__.py          Public API surface (currently empty)
    py.typed             PEP 561 marker — factorlib ships inline type hints
    factor.py             NOT YET IMPLEMENTED — owned by a subsequent card
tests/
    test_factor.py        Locks in the target public API: factorlib.prime_factors
```

`src/factorlib/factor.py` and the `prime_factors` implementation it will
provide are intentionally not part of this card. This card only sets up the
installable package skeleton and a failing test that pins down the intended
public API (`factorlib.prime_factors(n) -> list[int]`). Implementing the
factoring logic itself belongs to the sibling card "Make it pass".

## Development

Install the package in editable mode and run the test suite:

```
pip install -e .
pytest
```
