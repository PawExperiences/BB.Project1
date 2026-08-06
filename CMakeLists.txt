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

enable_testing()

add_test(
    NAME upto_10
    COMMAND prime_tester --upto 10
)
set_tests_properties(upto_10 PROPERTIES
    PASS_REGULAR_EXPRESSION "^2
3
5
7
$"
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

add_test(
    NAME upto_20
    COMMAND prime_tester --upto 20
)
set_tests_properties(upto_20 PROPERTIES
    PASS_REGULAR_EXPRESSION "^2
3
5
7
11
13
17
19
$"
)

add_test(
    NAME upto_negative
    COMMAND prime_tester --upto -1
)
set_tests_properties(upto_negative PROPERTIES
    PASS_REGULAR_EXPRESSION "^$"
)

add_test(
    NAME single_number_17
    COMMAND prime_tester 17
)
set_tests_properties(single_number_17 PROPERTIES
    PASS_REGULAR_EXPRESSION "17 is prime"
)
