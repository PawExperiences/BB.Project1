# caltool

A small, self-contained .NET console tool that prints a single calendar month
to the terminal as a text grid, in the spirit of the Unix `cal` command.

## Build & run

Requires the [.NET 8 SDK](https://dotnet.microsoft.com/download).

```
dotnet run
```

runs the tool from source and prints the current month (per the system
clock). To print a specific month:

```
dotnet run -- <year> <month>
```

for example:

```
dotnet run -- 2026 8
```

## Publish

```
dotnet publish -c Release -o out
```

produces a runnable executable in `out` (e.g. `out/caltool` on Linux/macOS,
`out/caltool.exe` on Windows).

## Tests

```
dotnet test tests/CalendarTests.csproj
```

runs the calendar-grid unit tests (`tests/CalendarTests.csproj`), which cover
months starting on a Monday and on a Sunday, and leap-year vs. non-leap-year
Februaries.

## Usage

```
caltool                # prints the current month
caltool <year> <month> # prints the given month
```

- `year` and `month` are positional integer arguments, year first.
- `month` must be in the range 1-12.
- `year` must be in the range 1-9999 (the range `System.DateTime` supports).

### Output format

```
    August 2026
Mo Tu We Th Fr Sa Su
                1  2
 3  4  5  6  7  8  9
10 11 12 13 14 15 16
17 18 19 20 21 22 23
24 25 26 27 28 29 30
31
```

1. Header line: full month name and 4-digit year, centered over a
   20-character width.
2. Weekday line: 2-letter initials, Monday first (`Mo Tu We Th Fr Sa Su`).
3. One line per week, with day numbers right-aligned in 2-character columns
   and blank columns for days outside the month at the start/end of the
   grid. The number of week rows depends on the month's actual layout
   (4-6 rows).

Month names and weekday initials are rendered with fixed, invariant-culture
English text, so output is deterministic regardless of the host OS locale.

### Exit codes

- `0` — a month was printed successfully.
- `2` — invalid invocation: an argument count other than 0 or 2, a
  non-integer argument, a month outside 1-12, or a year outside 1-9999. An
  error message naming the accepted ranges is printed in this case.
