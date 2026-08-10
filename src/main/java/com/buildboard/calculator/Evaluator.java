package com.buildboard.calculator;

/**
 * Pure arithmetic core for the calculator. Parses and evaluates standard
 * four-function expressions ({@code + - * /}) with operator precedence,
 * arbitrarily nested parentheses, decimal literals, and unary minus. Has
 * no dependency on any UI toolkit so it can be unit-tested in isolation
 * and reused unchanged by the Swing UI.
 */
public final class Evaluator {

    private Evaluator() {
    }

    public static double evaluate(String expression) throws CalculationException {
        if (expression == null || expression.trim().isEmpty()) {
            throw new CalculationException("Expression is empty");
        }

        Parser parser = new Parser(expression);
        double result = parser.parseExpression();
        parser.skipWhitespace();
        if (!parser.isAtEnd()) {
            throw new CalculationException(
                    "Unexpected character '" + parser.peek() + "' at position " + parser.pos);
        }

        if (Double.isNaN(result) || Double.isInfinite(result)) {
            throw new CalculationException("Result is not a finite number");
        }
        return result;
    }

    /**
     * Recursive-descent parser implementing:
     * expression := term (('+' | '-') term)*
     * term       := factor (('*' | '/') factor)*
     * factor     := '-' factor | '(' expression ')' | number
     */
    private static final class Parser {
        private final String input;
        private int pos;

        Parser(String input) {
            this.input = input;
            this.pos = 0;
        }

        double parseExpression() throws CalculationException {
            double value = parseTerm();
            while (true) {
                skipWhitespace();
                if (isAtEnd()) {
                    break;
                }
                char c = peek();
                if (c == '+') {
                    pos++;
                    value += parseTerm();
                } else if (c == '-') {
                    pos++;
                    value -= parseTerm();
                } else {
                    break;
                }
            }
            return value;
        }

        double parseTerm() throws CalculationException {
            double value = parseFactor();
            while (true) {
                skipWhitespace();
                if (isAtEnd()) {
                    break;
                }
                char c = peek();
                if (c == '*') {
                    pos++;
                    value *= parseFactor();
                } else if (c == '/') {
                    pos++;
                    double divisor = parseFactor();
                    if (divisor == 0.0) {
                        throw new CalculationException("Division by zero");
                    }
                    value /= divisor;
                } else {
                    break;
                }
            }
            return value;
        }

        double parseFactor() throws CalculationException {
            skipWhitespace();
            if (isAtEnd()) {
                throw new CalculationException("Unexpected end of expression");
            }
            char c = peek();
            if (c == '-') {
                pos++;
                return -parseFactor();
            }
            if (c == '(') {
                pos++;
                double value = parseExpression();
                skipWhitespace();
                if (isAtEnd() || peek() != ')') {
                    throw new CalculationException("Missing closing parenthesis");
                }
                pos++;
                return value;
            }
            return parseNumber();
        }

        double parseNumber() throws CalculationException {
            skipWhitespace();
            int start = pos;
            while (!isAtEnd() && (Character.isDigit(peek()) || peek() == '.')) {
                pos++;
            }
            if (pos == start) {
                String found = isAtEnd() ? "end of expression" : String.valueOf(peek());
                throw new CalculationException(
                        "Expected a number at position " + pos + " but found '" + found + "'");
            }
            String token = input.substring(start, pos);
            try {
                return Double.parseDouble(token);
            } catch (NumberFormatException e) {
                throw new CalculationException("Invalid number literal '" + token + "'");
            }
        }

        void skipWhitespace() {
            while (!isAtEnd() && Character.isWhitespace(peek())) {
                pos++;
            }
        }

        boolean isAtEnd() {
            return pos >= input.length();
        }

        char peek() {
            return input.charAt(pos);
        }
    }
}
