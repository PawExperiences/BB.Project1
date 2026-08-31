# romans

A small, typed Python library for converting between integers and Roman numerals over the supported range **1..3999 (inclusive)**. `to_roman(n)` encodes an integer in that range as a Roman numeral; `from_roman(s)` decodes a valid Roman numeral back to its integer. Integers outside 1..3999 and malformed numerals raise `ValueError`.

```python
from romans import to_roman, from_roman

to_roman(1999)         # "MCMXCIX"
from_roman("MCMXCIX")  # 1999
```

## Acceptance criterion

The acceptance gate for this library is a **lossless round-trip over the full supported range**: for every integer `n` in `1..3999` (inclusive),

```python
from_roman(to_roman(n)) == n
```

That identity is the definition of "the library works": each of the 3999 integers converts to a Roman numeral and back to exactly itself, with no loss. Boundary examples: `1 -> "I" -> 1` and `3999 -> "MMMCMXCIX" -> 3999`.

## Running the acceptance check

The criterion is enforced by the test `test_round_trip_conversion` in `tests/test_roundtrip.py`, which performs the round-trip for every `n` in `1..3999`. Run it from the repository root with the project's toolchain (`uv` + `pytest`):

```bash
uv run pytest tests/test_roundtrip.py
```

`uv run` creates and syncs the project environment (including the `pytest` dev dependency) on first use, so no separate setup step is required. The command exits with status 0 when all 3999 round-trips succeed; a non-zero exit means the acceptance criterion is not met.
