#include <cctype>
#include <charconv>
#include <iostream>
#include <string>
#include <string_view>

#include "prime.h"
#include "sieve.h"

namespace {

std::string_view trim(std::string_view s) {
    size_t start = 0;
    while (start < s.size() && std::isspace(static_cast<unsigned char>(s[start]))) {
        ++start;
    }
    size_t end = s.size();
    while (end > start && std::isspace(static_cast<unsigned char>(s[end - 1]))) {
        --end;
    }
    return s.substr(start, end - start);
}

bool parse_token(std::string_view raw, long long& value) {
    std::string_view token = trim(raw);
    if (token.empty()) {
        return false;
    }
    auto [ptr, ec] = std::from_chars(token.data(), token.data() + token.size(), value);
    return ec == std::errc() && ptr == token.data() + token.size();
}

bool process_token(std::string_view raw) {
    long long value;
    if (!parse_token(raw, value)) {
        std::cerr << "not a number: " << raw << "\n";
        return false;
    }
    std::cout << value << (is_prime(value) ? " is prime" : " is not prime") << "\n";
    return true;
}

int run_upto_mode(std::string_view arg) {
    long long n;
    if (!parse_token(arg, n)) {
        std::cerr << "not a number: " << arg << "\n";
        return 1;
    }
    for (long long p : primes_up_to(n)) {
        std::cout << p << "\n";
    }
    return 0;
}

}  // namespace

int main(int argc, char** argv) {
    if (argc == 3 && std::string_view(argv[1]) == "--upto") {
        return run_upto_mode(argv[2]);
    }

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
            if (!process_token(line)) {
                had_error = true;
            }
        }
    }

    return had_error ? 1 : 0;
}
