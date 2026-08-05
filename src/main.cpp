#include <iostream>
#include <string>
#include <sstream>
#include <cerrno>
#include <climits>
#include <cstdlib>
#include "prime.h"

// Attempts to parse token as a long long.
// Returns true on success and sets 'value'.
// Returns false if the token is not a valid integer or overflows long long.
static bool parse_token(const std::string& token, long long& value) {
    if (token.empty()) return false;

    // Use stoll via stringstream to detect trailing garbage.
    // We'll use std::stoll with size tracking instead.
    std::size_t pos = 0;
    errno = 0;
    long long result;
    try {
        result = std::stoll(token, &pos);
    } catch (const std::out_of_range&) {
        return false;
    } catch (const std::invalid_argument&) {
        return false;
    }

    // Reject trailing non-whitespace characters.
    if (pos != token.size()) return false;

    value = result;
    return true;
}

static void process_token(const std::string& token, int& exit_code) {
    long long n;
    if (!parse_token(token, n)) {
        std::cerr << "not a number: " << token << "\n";
        exit_code = 1;
    } else {
        if (is_prime(n)) {
            std::cout << n << " is prime\n";
        } else {
            std::cout << n << " is not prime\n";
        }
    }
}

int main(int argc, char* argv[]) {
    int exit_code = 0;

    if (argc > 1) {
        for (int i = 1; i < argc; ++i) {
            process_token(std::string(argv[i]), exit_code);
        }
    } else {
        std::string line;
        while (std::getline(std::cin, line)) {
            process_token(line, exit_code);
        }
    }

    return exit_code;
}
