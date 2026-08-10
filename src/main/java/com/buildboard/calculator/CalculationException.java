package com.buildboard.calculator;

/**
 * Thrown when an arithmetic expression cannot be evaluated: malformed
 * syntax (unbalanced parentheses, empty input, missing operands, ...) or
 * an operation with no valid numeric result (division by zero).
 */
public class CalculationException extends Exception {

    public CalculationException(String message) {
        super(message);
    }
}
