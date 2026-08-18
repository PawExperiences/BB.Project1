# prime_tester -- a small, standalone C++17 command-line prime-number tester.
# Build:  cmake -B build && cmake --build build
# Output: build/prime_tester
cmake_minimum_required(VERSION 3.16)

project(prime_tester LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# The single executable target: the CLI front-end (src/main.cpp) plus the
# reusable is_prime core (src/prime.cpp, interface in src/prime.h).
add_executable(prime_tester
    src/main.cpp
    src/prime.cpp
)
