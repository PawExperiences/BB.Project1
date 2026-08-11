# units

A small, typed, importable library exposing a single `convert(value, frm, to)`
function that converts values between units of length and between units of
mass.

## Usage

```python
from units import convert

convert(1, "km", "m")     # 1000.0
convert(1, "inch", "cm")  # 2.54
convert(1, "kg", "g")     # 1000.0
```

## Supported units

**Length**: `m`, `km`, `cm`, `mm`, `inch`, `ft`, `mile`

**Mass**: `g`, `kg`, `oz`, `lb`
