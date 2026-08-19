package com.buildboard.calculator;

/**
 * Signals that an arithmetic expression could not be evaluated: the input
 * was malformed (empty or blank text, unbalanced parentheses, an operator
 * with no right-hand operand, stray characters) or the computation itself
 * was undefined (division by zero) or produced a non-finite result.
 *
 * <p>This is a <em>checked</em> exception — it extends
 * {@link java.lang.Exception}, not {@code RuntimeException} — so every
 * caller of {@link Evaluator#evaluate(String)} is forced by the compiler
 * to handle the failure instead of discovering it at runtime.
 */
public class CalculationException extends Exception {

    private static final long serialVersionUID = 1L;

    /**
     * Creates the exception with a message that names the problem.
     *
     * @param message human-readable description of what went wrong
     */
    public CalculationException(String message) {
        super(message);
    }

    /**
     * Creates the exception with a message and an underlying cause.
     *
     * @param message human-readable description of what went wrong
     * @param cause   the lower-level failure that triggered this one
     */
    public CalculationException(String message, Throwable cause) {
        super(message, cause);
    }
}
