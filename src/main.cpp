#include <cerrno>
#include <cstdlib>
#include <iostream>
#include <string>

#include "prime.h"

namespace {

std::string trim(const std::string& s) {
    const auto first = s.find_first_not_of(" \t\r\n\f\v");
    if (first == std::string::npos) {
        return "";
    }
    const auto last = s.find_last_not_of(" \t\r\n\f\v");
    return s.substr(first, last - first + 1);
}

// Parses a full token as a long long. Rejects empty input, trailing
// garbage after the number, and values that overflow long long.
bool parse_integer(const std::string& token, long long& out) {
    if (token.empty()) {
        return false;
    }
    errno = 0;
    char* end = nullptr;
    const long long value = std::strtoll(token.c_str(), &end, 10);
    if (end == token.c_str() || *end != '\0') {
        return false;
    }
    if (errno == ERANGE) {
        return false;
    }
    out = value;
    return true;
}

void report(long long n) {
    std::cout << n << (is_prime(n) ? " is prime" : " is not prime") << "\n";
}

bool process_token(const std::string& token) {
    long long value = 0;
    if (!parse_integer(token, value)) {
        std::cerr << "not a number: " << token << "\n";
        return false;
    }
    report(value);
    return true;
}

} // namespace

int main(int argc, char* argv[]) {
    bool had_error = false;

    if (argc > 1) {
        for (int i = 1; i < argc; ++i) {
            if (!process_token(argv[i])) {
                had_error = true;
            }
        }
    } else {
        std::string line;
        while (std::getline(std::cin, line)) {
            const std::string trimmed = trim(line);
            if (trimmed.empty()) {
                continue;
            }
            if (!process_token(trimmed)) {
                had_error = true;
            }
        }
    }

    return had_error ? 1 : 0;
}
