#ifndef PRIME_TESTER_PRIME_H
#define PRIME_TESTER_PRIME_H

// The reusable primality predicate at the core of prime_tester.
//
// Returns true when n is a prime number, false otherwise. Every n < 2
// (0, 1 and all negative values) is not prime; 2 and 3 are prime; even
// numbers above 2 are not prime.
bool is_prime(long long n);

#endif // PRIME_TESTER_PRIME_H
