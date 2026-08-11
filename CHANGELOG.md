## 0.1.0 -- e2e unit converter 0.1.0

# Changelog

## [0.1.0] - 2026-08-11 (first release)

### Added
- New `units` Python package (`pyproject.toml`: `[project] name = "units"`, `version = "0.1.0"`, `requires-python = ">=3.12"`, plus a `[build-system]` table), installable/buildable with `uv`.
- `src/units/tables.py`: typed `LENGTH_FACTORS: dict[str, float]` and `MASS_FACTORS: dict[str, float]` — the single source of truth for conversion factors, each expressed relative to the dimension's base unit (metres for length, grams for mass; the base unit maps to `1.0`).
- `src/units/__init__.py`: public `convert(value: float, frm: str, to: str) -> float` API. Converts within a dimension via the base unit with no rounding; raises `ValueError` naming both units on a cross-dimension request (e.g. a length unit to a mass unit); raises `KeyError` naming the offending symbol for any unit absent from both tables. `LENGTH_FACTORS`/`MASS_FACTORS` are imported from `.tables` (not redefined) and re-exported as public API.
- `tests/test_convert.py`: automated coverage for a within-dimension conversion in both directions, a cross-dimension `ValueError`, and an unknown-unit `KeyError`. `python -m pytest` passes.
- `README.md`: supported units listed by dimension, plus three worked conversion examples.

### Flagged for release sign-off (not resolved by this runbook)
- Task #280 ("Length and mass conversions") acceptance criteria specify unit symbols `inch`/`mile`, require `convert(1, "yd", "m")` to raise `KeyError` (yd unsupported), and list exactly 11 README units (no `mg`). Task #279 ("The conversion tables") — which #280's `__init__.py` is required to import its factors from — instead defines `in`/`mi`, *includes* `yd` as a supported length unit, and adds `mg` as a mass unit (13 units total). These cannot both be true of the same shipped `convert()`. See the release step "Resolve the unit-symbol discrepancy" below.
