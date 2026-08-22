// CTest coverage for the range sieve (src/sieve.h), required by the
// "A sieve for ranges, and a benchmark" card: the boundary cases
//   n < 2       (1, 0 and a negative) -> empty vector
//   n == 2      -> exactly {2}        (N inclusive)
//   n == 3      -> exactly {2,3}      (N inclusive)
//   n == 30     -> the known range {2,3,5,7,11,13,17,19,23,29}
//   n == 100    -> 25 primes, last one 97
//   n == 10^6   -> 78498 primes, last one 999983
// A tiny assertion binary, standard library only: exits 0 when every
// check passes and 1 otherwise. Registered with CTest as the test
// "sieve_boundaries" (see CMakeLists.txt); run it via
//   (cd build && ctest)

#include <cstddef>
#include <iostream>
#include <vector>

#include "sieve.h"

namespace {

int failures = 0;

// Compare one call's result against the expected prime list; report
// and count a mismatch, stay silent on a pass.
void check(const char* label, const std::vector<long long>& actual,
           const std::vector<long long>& expected) {
    if (actual == expected) {
        return;
    }
    ++failures;
    std::cerr << "FAIL: " << label << " -> got {";
    for (std::size_t i = 0; i < actual.size(); ++i) {
        std::cerr << (i ? "," : "") << actual[i];
    }
    std::cerr << "}, expected {";
    for (std::size_t i = 0; i < expected.size(); ++i) {
        std::cerr << (i ? "," : "") << expected[i];
    }
    std::cerr << "}\n";
}

// Check a result's size and last element without spelling out the
// whole expected list -- used for the 100 and 1,000,000 counts, where
// the full list would be unwieldy to write inline.
void check_count(const char* label, const std::vector<long long>& actual,
                  std::size_t expected_size, long long expected_last) {
    if (actual.size() == expected_size &&
        (actual.empty() || actual.back() == expected_last)) {
        return;
    }
    ++failures;
    std::cerr << "FAIL: " << label << " -> got size " << actual.size();
    if (!actual.empty()) {
        std::cerr << ", last " << actual.back();
    }
    std::cerr << "; expected size " << expected_size << ", last "
              << expected_last << '\n';
}

} // namespace

int main() {
    // n < 2: empty for 1, 0 and negatives.
    check("primes_up_to(1)", primes_up_to(1), {});
    check("primes_up_to(0)", primes_up_to(0), {});
    check("primes_up_to(-5)", primes_up_to(-5), {});
    check("primes_up_to(-7)", primes_up_to(-7), {});

    // n == 2 and n == 3: the exact boundary cases (N inclusive).
    check("primes_up_to(2)", primes_up_to(2), {2});
    check("primes_up_to(3)", primes_up_to(3), {2, 3});

    // A small range and the known range up to 30.
    check("primes_up_to(10)", primes_up_to(10), {2, 3, 5, 7});
    check("primes_up_to(30)", primes_up_to(30),
          {2, 3, 5, 7, 11, 13, 17, 19, 23, 29});

    // Larger counts: exact size and last element.
    check_count("primes_up_to(100)", primes_up_to(100), 25, 97);
    check_count("primes_up_to(1000000)", primes_up_to(1000000), 78498, 999983);

    if (failures == 0) {
        std::cout << "all sieve boundary checks passed\n";
        return 0;
    }
    std::cerr << failures << " check(s) failed\n";
    return 1;
}
