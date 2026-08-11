def prime_factors(n: int) -> list[int]:
    """Return the prime factors of n, with multiplicity, in ascending order."""
    if not isinstance(n, int):
        raise TypeError(f"n must be an int, got {type(n).__name__}")
    if n <= 0:
        raise ValueError(f"n must be a positive integer, got {n}")

    factors = []
    remaining = n

    while remaining % 2 == 0:
        factors.append(2)
        remaining //= 2

    divisor = 3
    while divisor * divisor <= remaining:
        while remaining % divisor == 0:
            factors.append(divisor)
            remaining //= divisor
        divisor += 2

    if remaining > 1:
        factors.append(remaining)

    return factors
