#include "prime.h"
#include "sieve.h"

#include <iostream>
#include <string>
#include <stdexcept>
#include <cerrno>
#include <cstdlib>

int main(int argc, char* argv[])
{
    // --upto N mode
    for (int i = 1; i < argc; ++i) {
        std::string arg(argv[i]);
        if (arg == "--upto") {
            if (i + 1 >= argc) {
                std::cerr << "Error: --upto requires an integer argument.\n"
                          << "Usage: prime_tester --upto N\n";
                return 1;
            }
            std::string val(argv[i + 1]);
            long long n = 0;
            std::size_t pos = 0;
            try {
                n = std::stoll(val, &pos);
            } catch (const std::invalid_argument&) {
                std::cerr << "Error: '" << val << "' is not a valid integer.\n"
                          << "Usage: prime_tester --upto N\n";
                return 1;
            } catch (const std::out_of_range&) {
                std::cerr << "Error: '" << val << "' is out of range for long long.\n"
                          << "Usage: prime_tester --upto N\n";
                return 1;
            }
            if (pos != val.size()) {
                std::cerr << "Error: '" << val << "' is not a valid integer.\n"
                          << "Usage: prime_tester --upto N\n";
                return 1;
            }
            auto primes = primes_up_to(n);
            for (long long p : primes) {
                std::cout << p << '\n';
            }
            return 0;
        }
    }

    // Single-number / stdin mode (original card 1 behaviour)
    if (argc > 1) {
        // Argument mode: test each argument
        int exit_code = 0;
        for (int i = 1; i < argc; ++i) {
            std::string token(argv[i]);
            std::size_t pos = 0;
            long long num = 0;
            bool valid = true;
            try {
                num = std::stoll(token, &pos);
                if (pos != token.size()) valid = false;
            } catch (...) {
                valid = false;
            }
            if (!valid) {
                std::cerr << "not a number: " << token << '\n';
                exit_code = 1;
            } else {
                if (is_prime(num)) {
                    std::cout << num << " is prime\n";
                } else {
                    std::cout << num << " is not prime\n";
                }
            }
        }
        return exit_code;
    } else {
        // Stdin mode: read tokens until EOF
        int exit_code = 0;
        std::string token;
        while (std::cin >> token) {
            std::size_t pos = 0;
            long long num = 0;
            bool valid = true;
            try {
                num = std::stoll(token, &pos);
                if (pos != token.size()) valid = false;
            } catch (...) {
                valid = false;
            }
            if (!valid) {
                std::cerr << "not a number: " << token << '\n';
                exit_code = 1;
            } else {
                if (is_prime(num)) {
                    std::cout << num << " is prime\n";
                } else {
                    std::cout << num << " is not prime\n";
                }
            }
        }
        return exit_code;
    }
}
