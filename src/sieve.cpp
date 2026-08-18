// prime_tester -- range prime generation (implementation).
//
// The classic Sieve of Eratosthenes over 2..n: a boolean composite
// table is swept candidate by candidate, and each prime found crosses
// off its multiples starting at its own square (smaller multiples were
// already crossed off by smaller primes). Roughly O(n log log n) time
// and one bit per candidate, which makes ranges like --upto 10000000 a
// sub-second affair. Standard library only.
//
// The single-number trial division in src/prime.cpp is deliberately
// untouched: ranges sieve, single numbers trial-divide.
#include "sieve.h"

#include <cstddef>

std::vector<long long> primes_up_to(long long n) {
    // 1, 0 and every negative: there are no primes at or below n.
    if (n < 2) {
        return {};
    }

    const std::size_t limit = static_cast<std::size_t>(n);

    // composite[i] == true means i has been crossed off as non-prime.
    // vector<bool> packs one bit per entry, so 10^7 candidates cost
    // only ~1.2 MB.
    std::vector<bool> composite(limit + 1, false);

    for (std::size_t p = 2; p * p <= limit; ++p) {
        if (composite[p]) {
            continue;
        }
        // p is prime: cross off its multiples from p*p upward.
        for (std::size_t multiple = p * p; multiple <= limit; multiple += p) {
            composite[multiple] = true;
        }
    }

    // Collect the survivors in ascending order.
    std::vector<long long> primes;
    for (std::size_t i = 2; i <= limit; ++i) {
        if (!composite[i]) {
            primes.push_back(static_cast<long long>(i));
        }
    }
    return primes;
}
