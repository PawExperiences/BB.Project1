cmake_minimum_required(VERSION 3.16)
project(prime_tester CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(prime_tester
    src/main.cpp
    src/prime.cpp
    src/sieve.cpp
)

enable_testing()

add_test(
    NAME upto_10
    COMMAND prime_tester --upto 10
)
set_tests_properties(upto_10 PROPERTIES
    PASS_REGULAR_EXPRESSION "^2\n3\n5\n7\n$"
)

add_test(
    NAME upto_1
    COMMAND prime_tester --upto 1
)
set_tests_properties(upto_1 PROPERTIES
    PASS_REGULAR_EXPRESSION "^$"
)

add_test(
    NAME upto_0
    COMMAND prime_tester --upto 0
)
set_tests_properties(upto_0 PROPERTIES
    PASS_REGULAR_EXPRESSION "^$"
)

add_test(
    NAME upto_29
    COMMAND prime_tester --upto 29
)
set_tests_properties(upto_29 PROPERTIES
    PASS_REGULAR_EXPRESSION "29"
)
