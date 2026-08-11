# units

A small, dependency-free Python library for converting values between length units and between mass units.

## Usage

```python
from units import convert

convert(1, "mile", "m")   # 1609.344
convert(1000, "m", "km")  # 1.0
convert(1, "kg", "g")     # 1000.0
convert(1, "lb", "g")     # 453.59237
```

`convert(value, frm, to)` scales `value` through the base unit of its dimension (metres for
length, grams for mass) with no rounding applied. Converting between a length unit and a mass
unit raises `ValueError`. Passing a unit string that isn't supported raises `KeyError`.

## Supported units

### Length (base unit: metres)

- `m` — metre
- `km` — kilometre
- `cm` — centimetre
- `mm` — millimetre
- `inch` — inch
- `ft` — foot
- `mile` — mile

### Mass (base unit: grams)

- `g` — gram
- `kg` — kilogram
- `oz` — ounce
- `lb` — pound
