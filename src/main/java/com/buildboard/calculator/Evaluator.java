package com.buildboard.calculator;

/**
 * Arithmetic expression evaluator: the calculator's computation engine as
 * a plain, UI-free class (no {@code javax.swing} / {@code java.awt}
 * imports) so it stays unit-testable on its own. The Swing window is a
 * thin layer on top of this class.
 *
 * <p>Supported grammar (whitespace is insignificant anywhere):
 *
 * <pre>
 * expression := term (('+' | '-') term)*
 * term       := factor (('*' | '/') factor)*
 * factor     := '-' factor | '(' expression ')' | number
 * number     := a decimal literal such as 12 or 3.5
 * </pre>
 *
 * <p>That is: {@code *} and {@code /} bind tighter than {@code +} and
 * {@code -} (left-associative within a level), parentheses override
 * precedence and nest to any depth, and unary minus works both in leading
 * position ({@code -4}) and after an operator ({@code 2 * -3}).
 *
 * <p>Error contract: every input either yields a finite {@code double} or
 * throws {@link CalculationException}. Division by zero, malformed input
 * and non-finite results (overflow) are all reported via the exception —
 * never as NaN, Infinity or a sentinel value.
 */
public final class Evaluator {

    private Evaluator() {
        // Utility class: static entry point only, never instantiated.
    }

    /**
     * Evaluates an arithmetic expression.
     *
     * @param expression the expression text, e.g. {@code "(2 + 3) * 4"}
     * @return the finite result of the computation
     * @throws CalculationException if the expression is null, empty or
     *         blank, malformed, divides by zero, or yields a non-finite
     *         result
     */
    public static double evaluate(String expression) throws CalculationException {
        if (expression == null) {
            throw new CalculationException("Expression is null");
        }
        if (expression.isBlank()) {
            throw new CalculationException("Expression is empty");
        }
        double result = new Parser(expression).parse();
        if (!Double.isFinite(result)) {
            // Overflow (e.g. a 400-digit literal) must surface as an
            // error, never as Infinity/NaN leaking to the caller.
            throw new CalculationException("Result is not a finite number");
        }
        return result;
    }

    /**
     * Recursive-descent parser over the raw input text. One instance per
     * evaluation; {@code pos} is the cursor into {@code input}.
     */
    private static final class Parser {

        private final String input;
        private int pos;

        Parser(String input) {
            this.input = input;
        }

        /** Parses a whole expression and demands it consume all input. */
        double parse() throws CalculationException {
            double value = parseExpression();
            skipWhitespace();
            if (pos < input.length()) {
                throw new CalculationException(
                    "Unexpected character '" + input.charAt(pos) + "' at position " + pos);
            }
            return value;
        }

        /** expression := term (('+' | '-') term)* — lowest precedence level. */
        private double parseExpression() throws CalculationException {
            double value = parseTerm();
            while (true) {
                skipWhitespace();
                if (match('+')) {
                    value += parseTerm();
                } else if (match('-')) {
                    value -= parseTerm();
                } else {
                    return value;
                }
            }
        }

        /** term := factor (('*' | '/') factor)* — binds tighter than + and -. */
        private double parseTerm() throws CalculationException {
            double value = parseFactor();
            while (true) {
                skipWhitespace();
                if (match('*')) {
                    value *= parseFactor();
                } else if (match('/')) {
                    double divisor = parseFactor();
                    if (divisor == 0.0) {
                        throw new CalculationException("Division by zero");
                    }
                    value /= divisor;
                } else {
                    return value;
                }
            }
        }

        /** factor := '-' factor | '(' expression ')' | number. */
        private double parseFactor() throws CalculationException {
            skipWhitespace();
            if (match('-')) {
                // Unary minus: leading ("-4") and post-operator ("2 * -3")
                // both land here, as does "-(1 + 2)".
                return -parseFactor();
            }
            if (match('(')) {
                double value = parseExpression();
                skipWhitespace();
                if (!match(')')) {
                    throw new CalculationException(
                        "Unbalanced parenthesis: missing ')' at position " + pos);
                }
                return value;
            }
            return parseNumber();
        }

        /** number := a run of digits with at most one decimal point. */
        private double parseNumber() throws CalculationException {
            skipWhitespace();
            int start = pos;
            while (pos < input.length()
                    && (Character.isDigit(input.charAt(pos)) || input.charAt(pos) == '.')) {
                pos++;
            }
            if (start == pos) {
                if (pos >= input.length()) {
                    throw new CalculationException(
                        "Expected a number but reached the end of the expression");
                }
                throw new CalculationException(
                    "Expected a number but found '" + input.charAt(pos) + "' at position " + pos);
            }
            String token = input.substring(start, pos);
            try {
                return Double.parseDouble(token);
            } catch (NumberFormatException e) {
                // e.g. "1.2.3" — digits and dots, but not a valid decimal.
                throw new CalculationException(
                    "Invalid number '" + token + "' at position " + start, e);
            }
        }

        private void skipWhitespace() {
            while (pos < input.length() && Character.isWhitespace(input.charAt(pos))) {
                pos++;
            }
        }

        /** Consumes {@code c} at the cursor if present; reports whether it did. */
        private boolean match(char c) {
            if (pos < input.length() && input.charAt(pos) == c) {
                pos++;
                return true;
            }
            return false;
        }
    }
}
