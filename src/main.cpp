#include "prime.h"

#include <iostream>
#include <string>
#include <cerrno>
#include <climits>
#include <cstdlib>

// Attempt to parse a token as a long long.
// Returns true on success and sets 'value'.
// Returns false if the token is not a valid integer or overflows long long.
static bool parse_token(const std::string& token, long long& value)
{
    if (token.empty()) return false;

    std::size_t pos = 0;
    try {
        value = std::stoll(token, &pos);
    } catch (...) {
        return false;
    }
    // Ensure the entire token was consumed (no trailing non-numeric chars)
    if (pos != token.size()) return false;
    return true;
}

static void process_token(const std::string& token, bool& had_error)
{
    long long value = 0;
    if (!parse_token(token, value)) {
        std::cerr << "not a number: " << token << "\n";
        had_error = true;
        return;
    }
    if (is_prime(value)) {
        std::cout << value << " is prime\n";
    } else {
        std::cout << value << " is not prime\n";
    }
}

int main(int argc, char* argv[])
{
    bool had_error = false;

    if (argc > 1) {
        // Argument mode: test each command-line argument
        for (int i = 1; i < argc; ++i) {
            process_token(std::string(argv[i]), had_error);
        }
    } else {
        // Stdin mode: read one token per line until EOF
        std::string line;
        while (std::getline(std::cin, line)) {
            process_token(line, had_error);
        }
    }

    return had_error ? 1 : 0;
}
