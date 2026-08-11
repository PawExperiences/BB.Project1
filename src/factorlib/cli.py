"""Command-line front end for factorlib."""

from __future__ import annotations

import argparse
import sys

from factorlib.factor import prime_factors


def main(argv: list[str] | None = None) -> int:
    """Factorise one or more integers given as command-line arguments.

    Processes the integers in order, printing one ``N: p1 x p2 x ... x pk``
    line per integer to stdout. Stops immediately on the first integer that
    ``prime_factors`` raises for, writing the error to stderr and returning
    exit status 1. Returns 0 if all integers succeed.
    """
    parser = argparse.ArgumentParser(
        prog="factorlib",
        description="Print the prime factorisation of one or more integers.",
    )
    parser.add_argument("numbers", type=int, nargs="+", help="integers to factorise")
    args = parser.parse_args(argv)

    for n in args.numbers:
        try:
            factors = prime_factors(n)
        except (TypeError, ValueError) as exc:
            print(str(exc), file=sys.stderr)
            return 1
        print(f"{n}: " + " x ".join(str(p) for p in factors))

    return 0


if __name__ == "__main__":
    sys.exit(main())
