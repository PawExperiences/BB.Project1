#include <iostream>
#include <sstream>
#include <string>
#include <cstdlib>

#include "prime.h"
#include "sieve.h"

int main(int argc, char* argv[]) {
    // --upto N mode
    if (argc >= 2 && std::string(argv[1]) == "--upto") {
        if (argc < 3) {
            std::cerr << "Usage: prime_tester --upto N" << std::endl;
            return 1;
        }
        std::string arg = argv[2];
        long long n = 0;
        try {
            std::size_t pos = 0;
            n = std::stoll(arg, &pos);
            if (pos != arg.size()) {
                std::cerr << "Usage: prime_tester --upto N" << std::endl;
                return 1;
            }
        } catch (...) {
            std::cerr << "Usage: prime_tester --upto N" << std::endl;
            return 1;
        }
        if (n < 2) {
            return 0;
        }
        auto primes = primes_up_to(n);
        for (long long p : primes) {
            std::cout << p << "\n";
        }
        return 0;
    }

    // Single-number / stdin mode
    int exit_code = 0;

    if (argc >= 2) {
        // Argument mode: test each argument
        for (int i = 1; i < argc; ++i) {
            std::string token = argv[i];
            try {
                std::size_t pos = 0;
                long long val = std::stoll(token, &pos);
                if (pos != token.size()) {
                    throw std::invalid_argument("not a number");
                }
                if (is_prime(val)) {
                    std::cout << val << " is prime" << std::endl;
                } else {
                    std::cout << val << " is not prime" << std::endl;
                }
            } catch (...) {
                std::cerr << "not a number: " << token << std::endl;
                exit_code = 1;
            }
        }
    } else {
        // Stdin mode: read tokens until EOF
        std::string token;
        while (std::cin >> token) {
            try {
                std::size_t pos = 0;
                long long val = std::stoll(token, &pos);
                if (pos != token.size()) {
                    throw std::invalid_argument("not a number");
                }
                if (is_prime(val)) {
                    std::cout << val << " is prime" << std::endl;
                } else {
                    std::cout << val << " is not prime" << std::endl;
                }
            } catch (...) {
                std::cerr << "not a number: " << token << std::endl;
                exit_code = 1;
            }
        }
    }

    return exit_code;
}
