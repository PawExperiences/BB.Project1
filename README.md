# factorlib

A small, typed Python library for prime factorization.

## Planned package layout

```
pyproject.toml
src/
  factorlib/
    __init__.py    # public API surface
    factor.py       # prime_factors() implementation -- owned by the "Make it pass" card, not present yet
tests/
  test_factor.py
```

`src/factorlib/factor.py` is intentionally not present yet. It is owned by the
next card ("Make it pass"), which will implement `prime_factors` and wire it
into `factorlib/__init__.py`. Until then, `tests/test_factor.py` contains a
single failing test that pins down the target public API:
`factorlib.prime_factors(12) == [2, 2, 3]`.

## Development

Install in editable mode and run the test suite:

```
pip install -e .
pytest
```
