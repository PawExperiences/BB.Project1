#include "prime.h"

bool is_prime(long long n) {
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0) return false;

    for (long long k = 5; k * k <= n; k += 6) {
        if (n % k == 0 || n % (k + 2) == 0) return false;
    }
    return true;
}
