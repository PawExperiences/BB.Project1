import argparse
import sys

from factorlib.factor import prime_factors


def main() -> int:
    parser = argparse.ArgumentParser(prog="factorlib")
    parser.add_argument("numbers", type=int, nargs="+")
    args = parser.parse_args()

    for n in args.numbers:
        try:
            factors = prime_factors(n)
        except Exception as exc:
            print(f"Error factoring {n}: {exc}", file=sys.stderr)
            return 1
        print(f"{n}: {' '.join(str(f) for f in factors)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
