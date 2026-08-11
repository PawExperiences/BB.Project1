import argparse
import sys

from factorlib.factor import prime_factors


def main() -> None:
    parser = argparse.ArgumentParser(prog="factorlib")
    parser.add_argument("numbers", type=int, nargs="+")
    args = parser.parse_args()

    for n in args.numbers:
        try:
            factors = prime_factors(n)
        except Exception as exc:
            print(str(exc), file=sys.stderr)
            sys.exit(1)
        print(f"{n}: {' '.join(str(f) for f in factors)}")


if __name__ == "__main__":
    main()
