package com.buildboard.calculator;

/**
 * Signals that an expression could not be evaluated (malformed input,
 * division by zero, etc.). The message names the specific problem.
 */
public class CalculationException extends Exception {

    public CalculationException(String message) {
        super(message);
    }
}
