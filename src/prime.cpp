#include "prime.h"

#include <cmath>

bool is_prime(long long n) {
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0) return false;
    if (n % 3 == 0) return false;

    // Trial division with 6k+/-1 optimisation
    // Every prime > 3 is of the form 6k-1 or 6k+1.
    // We test divisors i = 5, 11, 17, ... (6k-1) and i+2 = 7, 13, 19, ... (6k+1).
    for (long long i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}
