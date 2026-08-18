// prime_tester -- range prime generation (interface).
//
// The Sieve of Eratosthenes counterpart to the single-number trial
// division in src/prime.h: primes_up_to(n) answers "which numbers in
// 2..n are prime?" in roughly O(n log log n), which is what bulk
// generation and the --upto CLI mode (src/main.cpp) are built on.
// is_prime() stays the tool for single numbers; nothing here moves,
// replaces or rewrites it.
#ifndef PRIME_TESTER_SIEVE_H
#define PRIME_TESTER_SIEVE_H

#include <vector>

// All primes p with 2 <= p <= n (n inclusive), in ascending order.
// Returns an empty vector for every n < 2 (1, 0 and all negatives).
std::vector<long long> primes_up_to(long long n);

#endif // PRIME_TESTER_SIEVE_H
