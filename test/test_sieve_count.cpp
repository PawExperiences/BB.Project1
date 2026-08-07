#include <cstdlib>
#include <iostream>
#include "sieve.h"

int main()
{
    auto primes = primes_up_to(1000000LL);
    if (primes.size() == 78498) {
        std::cout << "PASS: primes_up_to(1000000) returned 78498 primes.\n";
        return EXIT_SUCCESS;
    } else {
        std::cerr << "FAIL: primes_up_to(1000000) returned " << primes.size()
                  << " primes (expected 78498).\n";
        return EXIT_FAILURE;
    }
}
