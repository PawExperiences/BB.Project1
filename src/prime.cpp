#include "prime.h"

#include <cmath>

bool is_prime(long long n)
{
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0) return false;
    if (n % 3 == 0) return false;

    // Trial divide using candidates of the form 6k-1 and 6k+1
    for (long long k = 5; k * k <= n; k += 6) {
        if (n % k == 0 || n % (k + 2) == 0) {
            return false;
        }
    }
    return true;
}
