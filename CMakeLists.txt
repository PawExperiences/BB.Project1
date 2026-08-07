cmake_minimum_required(VERSION 3.16)
project(prime_tester CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(prime_tester
    src/main.cpp
    src/prime.cpp
    src/sieve.cpp
)

target_include_directories(prime_tester PRIVATE src)

if(MSVC)
    target_compile_options(prime_tester PRIVATE /W3)
else()
    target_compile_options(prime_tester PRIVATE -Wall -Wextra)
endif()

# CTest: verify that primes_up_to(1000000) returns 78498 primes
enable_testing()

add_executable(test_sieve_count
    test/test_sieve_count.cpp
    src/sieve.cpp
)
target_include_directories(test_sieve_count PRIVATE src)
if(MSVC)
    target_compile_options(test_sieve_count PRIVATE /W3)
else()
    target_compile_options(test_sieve_count PRIVATE -Wall -Wextra)
endif()

add_test(NAME sieve_count_1000000 COMMAND test_sieve_count)
