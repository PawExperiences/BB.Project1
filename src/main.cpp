#include <iostream>
#include <string>
#include <cstdlib>

#include "prime.h"
#include "sieve.h"

int main(int argc, char* argv[])
{
    // --upto N mode
    if (argc >= 2 && std::string(argv[1]) == "--upto") {
        if (argc < 3) {
            std::cerr << "Usage: prime_tester --upto <N>\n";
            return 1;
        }
        long long n = 0;
        try {
            std::size_t pos = 0;
            n = std::stoll(std::string(argv[2]), &pos);
            if (pos != std::string(argv[2]).size()) {
                std::cerr << "not a number: " << argv[2] << "\n";
                return 1;
            }
        } catch (...) {
            std::cerr << "not a number: " << argv[2] << "\n";
            return 1;
        }
        auto primes = primes_up_to(n);
        for (long long p : primes) {
            std::cout << p << "\n";
        }
        return 0;
    }

    // Argv mode: test each argument
    if (argc > 1) {
        int exit_code = 0;
        for (int i = 1; i < argc; ++i) {
            std::string token(argv[i]);
            long long num = 0;
            bool valid = true;
            try {
                std::size_t pos = 0;
                num = std::stoll(token, &pos);
                if (pos != token.size()) {
                    valid = false;
                }
            } catch (...) {
                valid = false;
            }
            if (!valid) {
                std::cerr << "not a number: " << token << "\n";
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

    // Stdin mode: read whitespace-delimited tokens until EOF
    {
        int exit_code = 0;
        std::string token;
        while (std::cin >> token) {
            long long num = 0;
            bool valid = true;
            try {
                std::size_t pos = 0;
                num = std::stoll(token, &pos);
                if (pos != token.size()) {
                    valid = false;
                }
            } catch (...) {
                valid = false;
            }
            if (!valid) {
                std::cerr << "not a number: " << token << "\n";
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
