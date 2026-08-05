package com.buildboard.calculator;

/**
 * Pure-Java arithmetic expression evaluator.
 *
 * <p>Supports:
 * <ul>
 *   <li>Operators: {@code +}, {@code -}, {@code *}, {@code /}</li>
 *   <li>Standard operator precedence ({@code *} and {@code /} bind tighter)</li>
 *   <li>Parentheses to arbitrary nesting depth</li>
 *   <li>Decimal (double) literals</li>
 *   <li>Unary minus in leading and post-operator positions</li>
 *   <li>Insignificant whitespace</li>
 * </ul>
 *
 * <p>Throws {@link CalculationException} on division by zero or malformed input.
 * Never returns {@link Double#NaN}, {@link Double#POSITIVE_INFINITY}, or
 * {@link Double#NEGATIVE_INFINITY}.
 *
 * <p><strong>No UI imports are present in this class.</strong>
 */
public class Evaluator {

    // Prevent instantiation — this is a utility class.
    private Evaluator() {
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Evaluates an arithmetic expression and returns its value as a
     * {@code double}.
     *
     * @param expression the expression to evaluate; must not be {@code null}
     * @return the numeric result
     * @throws CalculationException if the expression is malformed or a
     *                              calculation error occurs
     */
    public static double evaluate(String expression) throws CalculationException {
        if (expression == null) {
            throw new CalculationException("Expression must not be null.");
        }

        // Strip all whitespace so the parser never has to deal with it.
        String stripped = expression.replaceAll("\\s+", "");

        if (stripped.isEmpty()) {
            throw new CalculationException(
                    "Expression must not be empty or blank.");
        }

        Parser parser = new Parser(stripped);
        double result = parser.parseExpression();

        // Ensure the entire input was consumed.
        if (parser.hasMore()) {
            throw new CalculationException(
                    "Unexpected token at position " + parser.position()
                    + ": '" + parser.current() + "'.");
        }

        // Guard against NaN / Infinity — these are always programming errors
        // (or edge cases we handle explicitly, e.g. division by zero above).
        if (Double.isNaN(result) || Double.isInfinite(result)) {
            throw new CalculationException(
                    "Calculation produced an undefined or infinite result.");
        }

        return result;
    }

    // -----------------------------------------------------------------------
    // Recursive-descent parser (private, stateful)
    // -----------------------------------------------------------------------

    /**
     * A simple recursive-descent parser for the grammar:
     *
     * <pre>
     * expression := term   ( ('+' | '-') term   )*
     * term       := unary  ( ('*' | '/') unary  )*
     * unary      := '-' unary | primary
     * primary    := NUMBER | '(' expression ')'
     * </pre>
     */
    private static final class Parser {

        private final String input;
        private int pos;

        Parser(String input) {
            this.input = input;
            this.pos = 0;
        }

        // --- helpers --------------------------------------------------------

        boolean hasMore() {
            return pos < input.length();
        }

        char current() {
            return input.charAt(pos);
        }

        int position() {
            return pos;
        }

        private char consume() {
            return input.charAt(pos++);
        }

        // --- grammar rules --------------------------------------------------

        /**
         * expression := term ( ('+' | '-') term )*
         */
        double parseExpression() throws CalculationException {
            double value = parseTerm();

            while (hasMore() && (current() == '+' || current() == '-')) {
                char op = consume();
                double right = parseTerm();
                if (op == '+') {
                    value += right;
                } else {
                    value -= right;
                }
            }

            return value;
        }

        /**
         * term := unary ( ('*' | '/') unary )*
         */
        private double parseTerm() throws CalculationException {
            double value = parseUnary();

            while (hasMore() && (current() == '*' || current() == '/')) {
                char op = consume();
                double right = parseUnary();
                if (op == '*') {
                    value *= right;
                } else {
                    if (right == 0.0) {
                        throw new CalculationException(
                                "Division by zero is not allowed.");
                    }
                    value /= right;
                }
            }

            return value;
        }

        /**
         * unary := '-' unary | primary
         */
        private double parseUnary() throws CalculationException {
            if (hasMore() && current() == '-') {
                consume(); // eat '-'
                return -parseUnary();
            }
            return parsePrimary();
        }

        /**
         * primary := NUMBER | '(' expression ')'
         */
        private double parsePrimary() throws CalculationException {
            if (!hasMore()) {
                throw new CalculationException(
                        "Unexpected end of expression — expected a number or '('.");
            }

            char ch = current();

            // Parenthesised sub-expression
            if (ch == '(') {
                consume(); // eat '('
                double value = parseExpression();
                if (!hasMore() || current() != ')') {
                    throw new CalculationException(
                            "Missing closing ')' in expression.");
                }
                consume(); // eat ')'
                return value;
            }

            // Numeric literal
            if (Character.isDigit(ch) || ch == '.') {
                return parseNumber();
            }

            throw new CalculationException(
                    "Invalid character '" + ch + "' at position " + pos + ".");
        }

        /**
         * Reads a decimal number (integer or floating-point) from the current
         * position.
         */
        private double parseNumber() throws CalculationException {
            int start = pos;
            while (hasMore() && (Character.isDigit(current()) || current() == '.')) {
                pos++;
            }
            String token = input.substring(start, pos);
            try {
                return Double.parseDouble(token);
            } catch (NumberFormatException e) {
                throw new CalculationException(
                        "Invalid numeric literal '" + token + "'.");
            }
        }
    }
}
