// prime_tester -- command-line front-end.
//
// Modes:
//   prime_tester --upto <n>   range mode: every prime <= n, one per
//                             line, ascending, on stdout; n < 2 prints
//                             nothing. A missing or non-integer <n> is
//                             a diagnostic on stderr and exit 1.
//   prime_tester <n> [n ...]  arguments mode: each argument is one
//                             token, echoed and answered on stdout as
//                             "<n> is prime" / "<n> is not prime";
//                             stdin is ignored.
//   prime_tester              stdin mode: one token per line until
//                             EOF; leading/trailing whitespace on a
//                             line is ignored, so a line with interior
//                             whitespace (e.g. "3 5") is a bad token.
//
// A token that is not an integer -- or that does not fit in a
// long long (e.g. "99999999999999999999999") -- is reported on stderr
// as "not a number: <token>" with the token echoed verbatim,
// processing continues with the remaining input, and the program
// exits 1. Exit 0 means every token parsed cleanly; empty input (no
// arguments and immediate EOF on stdin) is a clean run that prints
// nothing.
//
// The single-number primality check (trial division, 6k+/-1) lives in
// src/prime.cpp and serves the arguments/stdin modes; the range sieve
// in src/sieve.cpp serves --upto. This file only parses arguments and
// dispatches.

#include <cctype>
#include <exception>
#include <iostream>
#include <string>

#include "prime.h"
#include "sieve.h"

namespace {

// Parse a whole token as a long long: an optional leading +/- sign,
// then decimal digits only, the entire token consumed, and the value
// must fit in a long long. Anything else (empty token, interior
// whitespace, trailing junk, overflow) returns false.
bool parse_integer(const std::string& token, long long& value) {
    try {
        std::size_t used = 0;
        value = std::stoll(token, &used);
        return used == token.size();
    } catch (const std::exception&) {
        return false;
    }
}

// Trim leading/trailing whitespace from a stdin line; what remains
// (possibly nothing) is the line's token. Interior whitespace is kept,
// which is exactly what makes "3 5" a bad token downstream.
std::string trim(const std::string& line) {
    std::size_t first = 0;
    while (first < line.size() &&
           std::isspace(static_cast<unsigned char>(line[first]))) {
        ++first;
    }
    std::size_t last = line.size();
    while (last > first &&
           std::isspace(static_cast<unsigned char>(line[last - 1]))) {
        --last;
    }
    return line.substr(first, last - first);
}

// Answer one token on stdout: "<n> is prime" or "<n> is not prime",
// with <n> the parsed value in decimal (so "007" prints as 7 and an
// optional leading sign is accepted). A bad token is reported on
// stderr and returns false so the exit status reflects it while
// processing of the remaining input continues.
bool answer_token(const std::string& token) {
    long long n = 0;
    if (!parse_integer(token, n)) {
        std::cerr << "not a number: " << token << '\n';
        return false;
    }
    std::cout << n << (is_prime(n) ? " is prime" : " is not prime") << '\n';
    return true;
}

} // namespace

int main(int argc, char* argv[]) {
    if (argc > 1 && std::string(argv[1]) == "--upto") {
        // Range mode: exactly one value is expected after --upto.
        if (argc != 3) {
            std::cerr << "--upto requires exactly one integer argument\n";
            return 1;
        }
        long long n = 0;
        if (!parse_integer(argv[2], n)) {
            std::cerr << "not a number: " << argv[2] << '\n';
            return 1;
        }
        for (long long p : primes_up_to(n)) {
            std::cout << p << '\n';
        }
        return 0;
    }

    bool all_parsed = true;
    if (argc > 1) {
        // Arguments mode: one token per argument, in order; stdin is
        // never touched.
        for (int i = 1; i < argc; ++i) {
            all_parsed = answer_token(argv[i]) && all_parsed;
        }
    } else {
        // stdin mode: one token per line until EOF. Immediate EOF
        // (zero lines) is a clean, silent run; a blank or
        // all-whitespace line trims to an empty token, which is
        // skipped silently rather than treated as a bad token.
        std::string line;
        while (std::getline(std::cin, line)) {
            std::string token = trim(line);
            if (token.empty()) {
                continue;
            }
            all_parsed = answer_token(token) && all_parsed;
        }
    }
    return all_parsed ? 0 : 1;
}
