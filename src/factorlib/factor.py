"""Prime factorization via trial division."""


def prime_factors(n: int) -> list[int]:
    """Return the prime factorization of ``n`` as an ascending list of primes.

    Duplicates are included for repeated prime factors, e.g.
    ``prime_factors(12) == [2, 2, 3]``. By convention, ``prime_factors(1)``
    returns ``[]``.
    """
    if not isinstance(n, int):
        raise TypeError(f"n must be an int, got {type(n).__name__}")
    if n == 1:
        return []
    if n <= 0:
        raise ValueError(f"n must be a positive integer, got {n}")

    factors: list[int] = []
    remaining = n

    while remaining % 2 == 0:
        factors.append(2)
        remaining //= 2

    candidate = 3
    while candidate * candidate <= remaining:
        while remaining % candidate == 0:
            factors.append(candidate)
            remaining //= candidate
        candidate += 2

    if remaining > 1:
        factors.append(remaining)

    return factors
