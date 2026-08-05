cmake_minimum_required(VERSION 3.16)
project(prime_tester CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(prime_tester
    src/main.cpp
    src/prime.cpp
)

target_include_directories(prime_tester PRIVATE src)

if(MSVC)
    target_compile_options(prime_tester PRIVATE /W4)
else()
    target_compile_options(prime_tester PRIVATE -Wall -Wextra -Wpedantic)
endif()
