package com.buildboard.calculator;

/**
 * Checked exception thrown by {@link Evaluator#evaluate(String)} when the
 * supplied expression is malformed or a calculation error occurs (e.g.
 * division by zero).
 */
public class CalculationException extends Exception {

    /**
     * Constructs a new {@code CalculationException} with the given detail message.
     *
     * @param message a human-readable description of the error; must not be blank
     */
    public CalculationException(String message) {
        super(message);
    }
}
