#include <chrono>
#include <iostream>

#include "sieve.h"

int main() {
    constexpr long long kN = 10000000;

    const auto start = std::chrono::steady_clock::now();
    const auto primes = primes_up_to(kN);
    const auto end = std::chrono::steady_clock::now();

    const std::chrono::duration<double> elapsed = end - start;
    std::cout << "primes_up_to(" << kN << ") found " << primes.size()
               << " primes in " << elapsed.count() << " seconds\n";

    return 0;
}
