// prime_tester -- command-line front-end for the is_prime core (prime.h).
//
// Input modes:
//   * with command-line arguments, each argv element is one token and
//     stdin is ignored entirely;
//   * with no arguments, tokens are read one per line from stdin until EOF
//     (leading/trailing whitespace on a line is ignored; the trimmed line
//     is the token).
//
// For every token that parses as a long long (optional leading '+'/'-'
// sign, then decimal digits only) exactly one line is printed to stdout,
// in input order:
//   <n> is prime
//   <n> is not prime
// where <n> is the parsed integer value in decimal (token "007" prints
// "7 is prime").
//
// A token that is not an integer, or that does not fit in a long long, is
// reported on stderr as:
//   not a number: <token>
// with the token echoed verbatim, and processing continues with the
// remaining input. The exit status is 1 if any bad token occurred and 0
// on a fully clean run -- including empty input (no arguments, immediate
// EOF), which prints nothing and exits 0.

#include <exception>
#include <iostream>
#include <string>

#include "prime.h"

namespace {

// Whitespace trimmed from stdin lines. '\r' is included so input piped
// from CRLF-terminated files still parses.
const char* const kWhitespace = " \t\r\n\f\v";

// Returns text with leading and trailing whitespace removed.
std::string trim(const std::string& text) {
    const std::string::size_type first = text.find_first_not_of(kWhitespace);
    if (first == std::string::npos) return std::string();
    const std::string::size_type last = text.find_last_of(kWhitespace);
    return text.substr(first, last - first + 1);
}

// Strict integer parse: an optional leading '+' or '-' sign followed by
// one or more decimal digits and nothing else, with the value required to
// fit in a long long. Returns true and stores the value on success.
bool parse_integer(const std::string& token, long long& value) {
    if (token.empty()) return false;

    std::string::size_type start = 0;
    if (token[0] == '+' || token[0] == '-') start = 1;
    if (start == token.size()) return false; // a sign alone is not a number

    for (std::string::size_type i = start; i < token.size(); ++i) {
        if (token[i] < '0' || token[i] > '9') return false;
    }

    // The format is fully validated above, so the only remaining failure
    // is a value outside the long long range (std::out_of_range), e.g.
    // 99999999999999999999999 -- reported as a bad token, never wrapped.
    try {
        value = std::stoll(token);
    } catch (const std::exception&) {
        return false;
    }
    return true;
}

// Processes one token: prints the primality verdict to stdout, or reports
// the bad token to stderr. Returns false exactly when the token was bad.
bool process_token(const std::string& token) {
    long long value = 0;
    if (!parse_integer(token, value)) {
        std::cerr << "not a number: " << token << '\n';
        return false;
    }
    std::cout << value << (is_prime(value) ? " is prime" : " is not prime") << '\n';
    return true;
}

} // namespace

int main(int argc, char* argv[]) {
    bool all_ok = true;

    if (argc > 1) {
        // argv mode: each argument is one token, used and echoed verbatim;
        // stdin is never touched.
        for (int i = 1; i < argc; ++i) {
            if (!process_token(argv[i])) all_ok = false;
        }
    } else {
        // stdin mode: one token per line until EOF. Each line is trimmed
        // and the trimmed text is the token -- it is also what error
        // messages echo. (Consequence of "each stdin line is ONE token":
        // an empty or all-whitespace line is an empty token and is
        // reported as "not a number: "; truly empty input -- immediate
        // EOF -- produces no tokens and is a clean run.)
        std::string line;
        while (std::getline(std::cin, line)) {
            if (!process_token(trim(line))) all_ok = false;
        }
    }

    return all_ok ? 0 : 1;
}
