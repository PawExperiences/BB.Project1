package com.buildboard.calculator;

import java.util.ArrayList;
import java.util.List;

/**
 * Arithmetic expression evaluation core. Supports {@code + - * /} with
 * standard precedence, arbitrarily nested parentheses, decimal literals,
 * leading and post-operator unary minus, and insignificant whitespace.
 */
public final class Evaluator {

    private Evaluator() {
    }

    public static double evaluate(String expression) throws CalculationException {
        if (expression == null || expression.trim().isEmpty()) {
            throw new CalculationException("Empty input");
        }

        List<Token> tokens = tokenize(expression);
        if (tokens.isEmpty()) {
            throw new CalculationException("Empty input");
        }

        Parser parser = new Parser(tokens);
        double result = parser.parseExpression();
        if (!parser.isAtEnd()) {
            throw new CalculationException("Unexpected token: " + parser.peek().text);
        }
        return result;
    }

    private enum TokenType {
        NUMBER, PLUS, MINUS, STAR, SLASH, LPAREN, RPAREN
    }

    private static final class Token {
        final TokenType type;
        final String text;
        final double numberValue;

        Token(TokenType type, String text, double numberValue) {
            this.type = type;
            this.text = text;
            this.numberValue = numberValue;
        }
    }

    private static List<Token> tokenize(String expression) throws CalculationException {
        List<Token> tokens = new ArrayList<>();
        int i = 0;
        int length = expression.length();

        while (i < length) {
            char c = expression.charAt(i);

            if (Character.isWhitespace(c)) {
                i++;
                continue;
            }

            switch (c) {
                case '+':
                    tokens.add(new Token(TokenType.PLUS, "+", 0));
                    i++;
                    continue;
                case '-':
                    tokens.add(new Token(TokenType.MINUS, "-", 0));
                    i++;
                    continue;
                case '*':
                    tokens.add(new Token(TokenType.STAR, "*", 0));
                    i++;
                    continue;
                case '/':
                    tokens.add(new Token(TokenType.SLASH, "/", 0));
                    i++;
                    continue;
                case '(':
                    tokens.add(new Token(TokenType.LPAREN, "(", 0));
                    i++;
                    continue;
                case ')':
                    tokens.add(new Token(TokenType.RPAREN, ")", 0));
                    i++;
                    continue;
                default:
                    break;
            }

            if (Character.isDigit(c) || c == '.') {
                int start = i;
                boolean sawDot = false;
                while (i < length && (Character.isDigit(expression.charAt(i)) || expression.charAt(i) == '.')) {
                    if (expression.charAt(i) == '.') {
                        if (sawDot) {
                            throw new CalculationException("Invalid number literal near position " + i);
                        }
                        sawDot = true;
                    }
                    i++;
                }
                String text = expression.substring(start, i);
                try {
                    tokens.add(new Token(TokenType.NUMBER, text, Double.parseDouble(text)));
                } catch (NumberFormatException e) {
                    throw new CalculationException("Invalid number literal: " + text);
                }
                continue;
            }

            throw new CalculationException("Invalid character in expression: '" + c + "'");
        }

        return tokens;
    }

    private static final class Parser {
        private final List<Token> tokens;
        private int pos;

        Parser(List<Token> tokens) {
            this.tokens = tokens;
            this.pos = 0;
        }

        boolean isAtEnd() {
            return pos >= tokens.size();
        }

        Token peek() {
            return isAtEnd() ? null : tokens.get(pos);
        }

        private boolean check(TokenType type) {
            return !isAtEnd() && peek().type == type;
        }

        private Token advance() {
            return tokens.get(pos++);
        }

        double parseExpression() throws CalculationException {
            double value = parseTerm();
            while (check(TokenType.PLUS) || check(TokenType.MINUS)) {
                Token op = advance();
                double right = parseTerm();
                value = op.type == TokenType.PLUS ? value + right : value - right;
            }
            return value;
        }

        private double parseTerm() throws CalculationException {
            double value = parseFactor();
            while (check(TokenType.STAR) || check(TokenType.SLASH)) {
                Token op = advance();
                double right = parseFactor();
                if (op.type == TokenType.STAR) {
                    value = value * right;
                } else {
                    if (right == 0.0) {
                        throw new CalculationException("Division by zero");
                    }
                    value = value / right;
                }
            }
            return value;
        }

        private double parseFactor() throws CalculationException {
            if (check(TokenType.MINUS)) {
                advance();
                return -parseFactor();
            }
            if (check(TokenType.PLUS)) {
                advance();
                return parseFactor();
            }
            return parsePrimary();
        }

        private double parsePrimary() throws CalculationException {
            if (isAtEnd()) {
                throw new CalculationException("Unexpected end of expression");
            }

            Token token = peek();
            if (token.type == TokenType.NUMBER) {
                advance();
                return token.numberValue;
            }
            if (token.type == TokenType.LPAREN) {
                advance();
                double value = parseExpression();
                if (!check(TokenType.RPAREN)) {
                    throw new CalculationException("Unbalanced parenthesis: missing closing ')'");
                }
                advance();
                return value;
            }

            throw new CalculationException("Unexpected token: " + token.text);
        }
    }
}
