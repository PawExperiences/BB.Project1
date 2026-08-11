cmake_minimum_required(VERSION 3.16)
project(prime_tester CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(prime_tester src/main.cpp src/prime.cpp src/sieve.cpp)

enable_testing()

add_executable(sieve_benchmark src/bench_sieve.cpp src/sieve.cpp)
add_test(NAME sieve_benchmark COMMAND sieve_benchmark)
