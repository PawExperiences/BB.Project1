## 0.1.0 -- e2e unit converter 0.1.0

# Changelog

All notable changes to the `units` package are documented in this file.

## [0.1.0] - 2026-08-11

> **Release-runbook note - resolve and remove before publishing:** the two bundled tasks behind this release specify different supported-unit sets. "Length and mass conversions" (#246) requires `convert()` to support length {m, km, cm, mm, inch, ft, mile} and mass {g, kg, oz, lb} (11 units, with explicit inch/ft/mile/oz/lb factors). "The conversion tables" (#245) defines `LENGTH_FACTORS = {mm, cm, m, km}` and `MASS_FACTORS = {mg, g, kg}` instead - a different 7-unit set that includes `mg` and omits `inch`, `ft`, `mile`, `oz`, `lb` entirely, and requires `__init__.py` to import (not redefine) these exact tables. Both specs cannot be true of the same shipped code. See the runbook step "Reconcile the conflicting supported-unit specs" - verify the real `LENGTH_FACTORS`/`MASS_FACTORS` and correct the list below before this file is committed.

### Added
- Initial release of `units`, a dependency-free Python 3.12+ library for converting values between length units and between mass units.
- Public API: `from units import convert` - `convert(value: float, frm: str, to: str) -> float` converts within a dimension with no rounding applied. Confirmed against both candidate unit specs: `convert(1000, "m", "km") == 1.0`, `convert(1, "kg", "g") == 1000.0`, `convert(1, "cm", "mm") == 10.0`.
- `convert()` raises `ValueError` naming both units when `frm` and `to` belong to different dimensions (e.g. a length unit and a mass unit), and raises `KeyError` naming the unit when `frm` or `to` is not a supported unit string.
- `src/units/tables.py` adds the `LENGTH_FACTORS` and `MASS_FACTORS` lookup tables (factor to the dimension's base unit - metres for length, grams for mass); `src/units/__init__.py` imports and re-exports both rather than duplicating the values.
- `tests/test_convert.py` adds pytest coverage for same-dimension conversion in both directions, cross-dimension rejection, and unrecognized-unit rejection.
- `README.md` documents every supported unit grouped by dimension, with three worked conversion examples.

### Docs
- `README.md`: added the package overview, install instructions, and the full unit reference table.

