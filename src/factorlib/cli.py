"""Command-line front end for factorlib."""

from __future__ import annotations

import argparse
import sys

from factorlib import prime_factors


def main(argv: list[str] | None = None) -> int:
    """Parse CLI arguments, print factorizations, and return the exit status."""
    parser = argparse.ArgumentParser(
        prog="factorlib",
        description="Print the prime factorization of one or more integers.",
    )
    parser.add_argument(
        "numbers",
        metavar="N",
        type=int,
        nargs="+",
        help="integers to factorise",
    )
    args = parser.parse_args(argv)

    had_error = False
    for n in args.numbers:
        try:
            factors = prime_factors(n)
        except Exception as exc:  # noqa: BLE001 -- surface any prime_factors error, not just known ones
            print(f"factorlib: error factorising {n}: {exc}", file=sys.stderr)
            had_error = True
            continue
        print(f"{n}: {' '.join(str(factor) for factor in factors)}")

    return 1 if had_error else 0


if __name__ == "__main__":
    sys.exit(main())
