// Implementation of the is_prime predicate declared in prime.h.
//
// Trial division up to sqrt(n) with the 6k±1 optimisation: 2 and 3 are
// handled directly, multiples of 2 and 3 are eliminated, and then only
// candidate divisors of the form 6k-1 and 6k+1 are tested (5, 7, 11, 13,
// ...), since every prime above 3 has one of those forms.

#include "prime.h"

bool is_prime(long long n) {
    // Everything below 2 -- 0, 1 and all negatives -- is not prime.
    if (n < 2) return false;

    // 2 and 3 are prime; every larger multiple of 2 or 3 is not.
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;

    // Trial division by 6k-1 (i) and 6k+1 (i+2) up to sqrt(n). The loop
    // bound i <= n / i is the overflow-safe form of i * i <= n, so values
    // near LLONG_MAX cannot wrap.
    for (long long i = 5; i <= n / i; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}
