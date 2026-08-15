## 0.1.0 -- e2e dotnet tool 0.1.0

# Changelog

## [0.1.0] - 2026-08-15

### Added
- `caltool`, a self-contained .NET 8 console tool that prints a single calendar month as a text grid, in the spirit of Unix `cal`.
- CLI contract: no arguments prints the current month (system clock); `caltool <year> <month>` prints the given month (year 1-9999, month 1-12). Any invalid invocation (wrong arg count, non-integer args, month outside 1-12, year outside 1-9999) exits with code 2 and a message naming the accepted ranges.
- Deterministic, invariant-culture English output: header line with month name + year centered over 20 characters, Monday-first `Mo Tu We Th Fr Sa Su` weekday line, and right-aligned day-number grid (4-6 week rows depending on the month).
- `Calendar.cs`: a dedicated `Calendar` class that computes the month grid (Monday-first week rows of 7 day-slots, blanks for out-of-month days) as pure structured data, with no console output, formatting, or argument parsing.
- `caltool.csproj`: net8.0, `OutputType=Exe`, `Nullable=enable`.
- `tests/CalendarTests.csproj`: a .NET unit-test project covering four boundary scenarios — a month starting on Monday (January 2024), a month starting on Sunday (September 2024), leap-year February (2024, 29 days), and non-leap-year February (2023, 28 days). `dotnet test` passes with 0 failures.
- `README.md`: build (`dotnet build`), run (`dotnet run`), and publish (`dotnet publish -c Release -o out`) instructions, plus the CLI usage/exit-code contract.

### Changed
- None (first release).

### Fixed
- None (first release).
