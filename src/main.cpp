#include "prime.h"

#include <iostream>
#include <string>
#include <cerrno>
#include <climits>
#include <cstdlib>

// Process a single token string.
// Returns true if the token was a valid integer, false otherwise.
// On valid integer: prints result to stdout.
// On invalid/overflow: prints error to stderr.
static bool process_token(const std::string& token) {
    if (token.empty()) {
        std::cerr << "not a number: " << token << "\n";
        return false;
    }

    // Validate: optional leading '-', then all digits, no whitespace.
    std::size_t start = 0;
    if (token[0] == '-' || token[0] == '+') {
        start = 1;
    }
    if (start >= token.size()) {
        // Lone sign character is not a valid integer
        std::cerr << "not a number: " << token << "\n";
        return false;
    }
    for (std::size_t i = start; i < token.size(); ++i) {
        if (token[i] < '0' || token[i] > '9') {
            std::cerr << "not a number: " << token << "\n";
            return false;
        }
    }

    // Parse with stoll, catching overflow and other errors.
    long long n;
    try {
        std::size_t pos;
        n = std::stoll(token, &pos);
        // pos should equal token.size() since we already validated digits
        if (pos != token.size()) {
            std::cerr << "not a number: " << token << "\n";
            return false;
        }
    } catch (const std::out_of_range&) {
        std::cerr << "not a number: " << token << "\n";
        return false;
    } catch (const std::invalid_argument&) {
        std::cerr << "not a number: " << token << "\n";
        return false;
    }

    if (is_prime(n)) {
        std::cout << n << " is prime\n";
    } else {
        std::cout << n << " is not prime\n";
    }
    return true;
}

int main(int argc, char* argv[]) {
    int exit_status = 0;

    if (argc > 1) {
        // argv mode: process each command-line argument
        for (int i = 1; i < argc; ++i) {
            if (!process_token(std::string(argv[i]))) {
                exit_status = 1;
            }
        }
    } else {
        // stdin mode: read one token per line until EOF
        std::string line;
        while (std::getline(std::cin, line)) {
            // Strip trailing \r for Windows-style line endings
            if (!line.empty() && line.back() == '\r') {
                line.pop_back();
            }
            if (line.empty()) {
                continue;
            }
            if (!process_token(line)) {
                exit_status = 1;
            }
        }
    }

    return exit_status;
}
