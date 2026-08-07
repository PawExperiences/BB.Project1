#include "prime.h"

bool is_prime(long long n)
{
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0) return false;
    if (n % 3 == 0) return false;

    // Trial division with 6k+/-1 optimisation.
    // Candidates: 5, 7, 11, 13, 17, 19, ...
    // i steps by 6 each outer iteration; we test i (6k-1) and i+2 (6k+1).
    for (long long i = 5; i <= n / i; i += 6) {
        if (n % i == 0) return false;
        if (n % (i + 2) == 0) return false;
    }
    return true;
}
