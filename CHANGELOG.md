## 0.1.0 -- e2e unit converter 0.1.0

## [0.1.0] - 2026-08-11

### Added
- `units` package: a small, typed, PEP 517-installable library (`pyproject.toml`, `requires-python >= 3.12`) exposing `convert(value, frm, to)` for length and mass conversions.
- `src/units/tables.py`: single source of truth for conversion factors -- `LENGTH_FACTORS` (m, km, cm, mm, relative to metres) and `MASS_FACTORS` (g, kg, mg, relative to grams) -- imported by `src/units/__init__.py` rather than duplicated.
- `convert()` raises `ValueError` naming both units when asked to convert across dimensions (length vs mass), and `KeyError` naming the unknown unit for any unrecognized unit code.
- `convert()` returns the raw, unrounded float result of `value * (factor(frm) / factor(to))`.
- `tests/test_convert.py`: pytest suite covering round-trip conversions for each dimension, cross-dimension rejection, and unknown-unit rejection.
- `README.md`: supported-units reference grouped by dimension (Length: m, km, cm, mm; Mass: g, kg, mg) plus three worked conversion examples.

### Changed
- Repository reset to a clean slate (commit `ac9ae3d`) ahead of this project's history -- no functional change.
