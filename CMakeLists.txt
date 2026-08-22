# prime_tester -- a small, standalone C++17 command-line prime-number tester.
# Build:  cmake -B build && cmake --build build
# Output: build/prime_tester
cmake_minimum_required(VERSION 3.16)

project(prime_tester LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# The single executable target: the CLI front-end (src/main.cpp), the
# is_prime core (src/prime.cpp, interface in src/prime.h), and the range
# sieve (src/sieve.cpp, interface in src/sieve.h).
add_executable(prime_tester
    src/main.cpp
    src/prime.cpp
    src/sieve.cpp
)

enable_testing()

# CTest coverage for the range sieve (tests/sieve_test.cpp).
add_executable(sieve_test
    tests/sieve_test.cpp
    src/sieve.cpp
)
target_include_directories(sieve_test PRIVATE src)

add_test(NAME sieve_boundaries COMMAND sieve_test)
