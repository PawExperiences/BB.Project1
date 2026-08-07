#include <iostream>
#include <string>
#include <cerrno>
#include <climits>
#include <stdexcept>
#include "prime.h"

// Trim leading and trailing ASCII whitespace from a string.
static std::string trim(const std::string &s)
{
    const std::string ws = " \t\r\n\f\v";
    std::size_t start = s.find_first_not_of(ws);
    if (start == std::string::npos) return "";
    std::size_t end = s.find_last_not_of(ws);
    return s.substr(start, end - start + 1);
}

// Try to parse token as a long long.
// Returns true and sets value on success.
// Returns false if the token is not a valid integer or overflows long long.
static bool parse_ll(const std::string &token, long long &value)
{
    if (token.empty()) return false;

    std::size_t pos = 0;
    try {
        value = std::stoll(token, &pos);
    } catch (const std::out_of_range &) {
        return false;
    } catch (const std::invalid_argument &) {
        return false;
    }

    // The entire token must have been consumed.
    return pos == token.size();
}

static int process_token(const std::string &token, int exit_code)
{
    long long n = 0;
    if (!parse_ll(token, n)) {
        std::cerr << "not a number: " << token << "\n";
        return 1;
    }
    if (is_prime(n)) {
        std::cout << n << " is prime\n";
    } else {
        std::cout << n << " is not prime\n";
    }
    return exit_code;
}

int main(int argc, char *argv[])
{
    int exit_code = 0;

    if (argc > 1) {
        // Argv mode: treat each argument as a token.
        for (int i = 1; i < argc; ++i) {
            std::string token(argv[i]);
            exit_code = process_token(token, exit_code);
        }
    } else {
        // Stdin mode: read one line at a time until EOF.
        std::string line;
        while (std::getline(std::cin, line)) {
            std::string token = trim(line);
            if (token.empty()) continue;
            exit_code = process_token(token, exit_code);
        }
    }

    return exit_code;
}
