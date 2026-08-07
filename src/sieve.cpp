#include "sieve.h"

#include <vector>

std::vector<long long> primes_up_to(long long n)
{
    if (n < 2) {
        return {};
    }

    // Use a boolean sieve indexed 0..n
    // is_composite[i] == true  =>  i is not prime
    std::vector<bool> is_composite(static_cast<std::size_t>(n + 1), false);
    is_composite[0] = true;
    is_composite[1] = true;

    for (long long i = 2; i * i <= n; ++i) {
        if (!is_composite[static_cast<std::size_t>(i)]) {
            for (long long j = i * i; j <= n; j += i) {
                is_composite[static_cast<std::size_t>(j)] = true;
            }
        }
    }

    std::vector<long long> result;
    for (long long i = 2; i <= n; ++i) {
        if (!is_composite[static_cast<std::size_t>(i)]) {
            result.push_back(i);
        }
    }
    return result;
}
