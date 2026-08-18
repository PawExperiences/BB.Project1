// CTest coverage for the range sieve (src/sieve.h), required by the
// "A sieve for ranges, and a benchmark" card: the boundary cases
//   n < 2   (1, 0 and a negative) -> empty vector
//   n == 2  -> exactly {2}        (N inclusive)
//   n == 30 -> the known range {2,3,5,7,11,13,17,19,23,29}
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

} // namespace

int main() {
    // n < 2: empty for 1, 0 and negatives.
    check("primes_up_to(1)", primes_up_to(1), {});
    check("primes_up_to(0)", primes_up_to(0), {});
    check("primes_up_to(-5)", primes_up_to(-5), {});

    // n == 2: the first prime, included (N inclusive).
    check("primes_up_to(2)", primes_up_to(2), {2});

    // The known range up to 30.
    check("primes_up_to(30)", primes_up_to(30),
          {2, 3, 5, 7, 11, 13, 17, 19, 23, 29});

    if (failures == 0) {
        std::cout << "all sieve boundary checks passed\n";
        return 0;
    }
    std::cerr << failures << " check(s) failed\n";
    return 1;
}
