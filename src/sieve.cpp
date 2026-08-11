#include "sieve.h"

std::vector<long long> primes_up_to(long long n) {
    std::vector<long long> primes;
    if (n < 2) {
        return primes;
    }

    std::vector<bool> is_composite(static_cast<size_t>(n) + 1, false);
    for (long long i = 2; i * i <= n; ++i) {
        if (!is_composite[static_cast<size_t>(i)]) {
            for (long long j = i * i; j <= n; j += i) {
                is_composite[static_cast<size_t>(j)] = true;
            }
        }
    }

    for (long long i = 2; i <= n; ++i) {
        if (!is_composite[static_cast<size_t>(i)]) {
            primes.push_back(i);
        }
    }

    return primes;
}
