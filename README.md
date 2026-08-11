# factorlib

A small, typed Python library for prime factorization.

## Planned layout

```
pyproject.toml          # packaging metadata (setuptools, src/ layout)
src/factorlib/
    __init__.py          # public API surface (currently empty)
    py.typed              # PEP 561 marker: factorlib ships inline types
    factor.py             # NOT YET CREATED - owned by the next card
tests/
    test_factor.py        # pins down factorlib.prime_factors(12) == [2, 2, 3]
```

## Status

This card only establishes the installable package skeleton and a
deliberately failing (red) test that pins down the target public API:

```python
import factorlib
factorlib.prime_factors(12) == [2, 2, 3]
```

`src/factorlib/factor.py`, where `prime_factors` will be implemented, is
intentionally **not created in this card**. It belongs to the next sibling
card ("Make it pass"), which will implement `prime_factors` and export it
from `factorlib/__init__.py`. Until that card lands, `import factorlib`
succeeds but `factorlib.prime_factors` does not exist, and `pytest` is
expected to fail with exactly one failing test.
