# units

A small typed Python library for converting between common length and mass
units.

## Usage

```python
from units import convert

convert(1, "km", "m")     # 1000.0
convert(1, "inch", "cm")  # 2.54
convert(1, "lb", "g")     # 453.59237
```

`convert(value, frm, to)` converts `value` from unit `frm` to unit `to` and
returns the raw, unrounded `float`. `frm` and `to` must belong to the same
dimension (both length, or both mass); mixing dimensions raises `ValueError`.
An unrecognised unit raises `KeyError`.

## Supported units

**Length** (base unit: metres): `m`, `km`, `cm`, `mm`, `inch`, `ft`, `mile`

**Mass** (base unit: grams): `g`, `kg`, `oz`, `lb`

## Examples

```python
>>> convert(1, "km", "m")
1000.0
>>> convert(1, "inch", "cm")
2.54
>>> convert(1, "lb", "g")
453.59237
```
