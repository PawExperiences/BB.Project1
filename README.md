# romans

A small, typed Python library for converting between integers and Roman numerals over the supported range **1..3999 (inclusive)**. `to_roman(n)` encodes an integer in that range as a Roman numeral; `from_roman(s)` decodes a valid Roman numeral back to its integer. Integers outside 1..3999 and malformed numerals raise `ValueError`.

```python
from romans import to_roman, from_roman

to_roman(1999)         # "MCMXCIX"
from_roman("MCMXCIX")  # 1999
```

## Usage

`to_roman` covers every integer in **1..3999**, emitting canonical numerals with the six subtractive pairs `IV`, `IX`, `XL`, `XC`, `CD` and `CM`:

```python
to_roman(4)     # "IV"
to_roman(9)     # "IX"
to_roman(40)    # "XL"
to_roman(90)    # "XC"
to_roman(400)   # "CD"
to_roman(900)   # "CM"
to_roman(1994)  # "MCMXCIV"
to_roman(3999)  # "MMMCMXCIX"
```

`from_roman` parses exactly those canonical numerals back, subtractive pairs included:

```python
from_roman("IV")  # 4
from_roman("IX")  # 9
from_roman("XL")  # 40
from_roman("XC")  # 90
from_roman("CD")  # 400
from_roman("CM")  # 900
```

## Error contract

Both functions raise `ValueError` (and only `ValueError`) on bad input.

`to_roman(n)`:

- `n < 1` (e.g. `to_roman(0)`, `to_roman(-7)`) raises a `ValueError` whose message names the lower bound `1`.
- `n > 3999` (e.g. `to_roman(4000)`) raises a `ValueError` whose message names the upper bound `3999`.
- A non-integer `n` -- a float (`3.5`), a string (`"42"`), `None`, or a bool (`True`) -- raises a `ValueError` whose message names the valid integer range `1..3999`. `bool` is rejected as non-integer even though it subclasses `int` in Python.

`from_roman(s)`:

- Any character outside `IVXLCDM` raises a `ValueError` naming the offending character: `from_roman("AX")` names `A`. Input is case-sensitive -- lowercase letters are offending characters: `from_roman("iv")` names `i`.
- Valid characters in a non-canonical arrangement raise a `ValueError` naming the offending character: `from_roman` is strict and accepts exactly the canonical forms `to_roman` produces. For example `"IIII"` (more than three `I` in a row), `"VV"` (`V` never repeats), `"IL"` and `"IC"` (`I` may only precede `V` or `X`).
- The empty string raises a `ValueError`.

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
