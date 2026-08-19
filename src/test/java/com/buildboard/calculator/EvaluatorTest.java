package com.buildboard.calculator;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

/**
 * Test suite for {@link Evaluator} — written tests-first (TDD): this file
 * is authored and committed BEFORE the Evaluator implementation exists
 * (red: it does not even compile, let alone pass), and the implementation
 * is then written to turn it green.
 *
 * <p>Pure unit tests: no {@code javax.swing} / {@code java.awt} imports
 * anywhere in this file, which is what keeps the evaluation core
 * verifiable without a UI.
 */
class EvaluatorTest {

    /** Tolerance for floating-point comparisons. */
    private static final double EPSILON = 1e-9;

    /**
     * Evaluates {@code expression} and asserts the returned value is a
     * finite double — the robustness contract says every successful call
     * yields a finite result, never NaN, Infinity or a sentinel value.
     */
    private static double evaluateFinite(String expression) throws CalculationException {
        double result = Evaluator.evaluate(expression);
        assertTrue(
            Double.isFinite(result),
            () -> "Result of \"" + expression + "\" must be finite but was " + result);
        return result;
    }

    // --- operator precedence -------------------------------------------

    @Test
    void multiplicationBindsTighterThanAddition() throws CalculationException {
        assertEquals(14.0, evaluateFinite("2 + 3 * 4"), EPSILON);
    }

    @Test
    void divisionBindsTighterThanSubtraction() throws CalculationException {
        assertEquals(7.0, evaluateFinite("10 - 6 / 2"), EPSILON);
    }

    @Test
    void operatorsAreLeftAssociativeWithinALevel() throws CalculationException {
        assertEquals(1.0, evaluateFinite("8 / 4 / 2"), EPSILON); // (8/4)/2, not 8/(4/2)
        assertEquals(2.0, evaluateFinite("10 - 5 - 3"), EPSILON); // (10-5)-3, not 10-(5-3)
    }

    // --- parentheses ----------------------------------------------------

    @Test
    void parenthesesOverridePrecedence() throws CalculationException {
        assertEquals(20.0, evaluateFinite("(2 + 3) * 4"), EPSILON);
    }

    @Test
    void nestedParenthesesEvaluateInsideOut() throws CalculationException {
        assertEquals(16.0, evaluateFinite("((1 + 2) * (3 + 4)) - 5"), EPSILON);
    }

    // --- decimal literals ------------------------------------------------

    @Test
    void decimalLiteralsAreSupported() throws CalculationException {
        assertEquals(3.75, evaluateFinite("3.5 + 0.25"), EPSILON);
    }

    // --- unary minus ------------------------------------------------------

    @Test
    void unaryMinusInLeadingPositionNegates() throws CalculationException {
        assertEquals(-4.0, evaluateFinite("-4"), EPSILON);
    }

    @Test
    void unaryMinusAfterAnOperatorNegates() throws CalculationException {
        assertEquals(-6.0, evaluateFinite("2 * -3"), EPSILON);
    }

    @Test
    void unaryMinusAppliesToParenthesisedExpressions() throws CalculationException {
        assertEquals(-5.0, evaluateFinite("-(2 + 3)"), EPSILON);
    }

    // --- whitespace --------------------------------------------------------

    @Test
    void whitespaceIsInsignificant() throws CalculationException {
        assertEquals(15.0, evaluateFinite("  12  +  3 "), EPSILON);
    }

    // --- error behaviour ----------------------------------------------------

    @Test
    void divisionByZeroThrowsAndNamesTheProblem() {
        CalculationException exception = assertThrows(
            CalculationException.class,
            () -> Evaluator.evaluate("1 / 0"));
        String message = exception.getMessage().toLowerCase();
        assertTrue(
            message.contains("division") && message.contains("zero"),
            () -> "Message should name division by zero but was: " + exception.getMessage());
    }

    @Test
    void unbalancedParenthesisThrowsAndNamesTheProblem() {
        CalculationException exception = assertThrows(
            CalculationException.class,
            () -> Evaluator.evaluate("(2 + 3"));
        assertTrue(
            exception.getMessage().toLowerCase().contains("parenthes"),
            () -> "Message should name the parenthesis problem but was: " + exception.getMessage());
    }

    @Test
    void emptyStringThrowsAndNamesTheProblem() {
        CalculationException exception = assertThrows(
            CalculationException.class,
            () -> Evaluator.evaluate(""));
        assertTrue(
            exception.getMessage().toLowerCase().contains("empty"),
            () -> "Message should name the problem but was: " + exception.getMessage());
    }

    @Test
    void blankStringThrowsAndNamesTheProblem() {
        CalculationException exception = assertThrows(
            CalculationException.class,
            () -> Evaluator.evaluate("   "));
        assertTrue(
            exception.getMessage().toLowerCase().contains("empty"),
            () -> "Message should name the problem but was: " + exception.getMessage());
    }

    @Test
    void missingOperandAfterAnOperatorThrows() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate("2 +"));
    }

    // --- robustness -----------------------------------------------------------

    @Test
    void nonFiniteResultsAreRejectedNotReturned() {
        // A 400-digit literal overflows double; the evaluator must throw
        // rather than hand Infinity back to the caller.
        assertThrows(
            CalculationException.class,
            () -> Evaluator.evaluate("9".repeat(400)));
    }

    // --- exception contract ----------------------------------------------------

    @Test
    void calculationExceptionIsACheckedException() {
        assertTrue(
            Exception.class.isAssignableFrom(CalculationException.class),
            "CalculationException must extend java.lang.Exception");
        assertFalse(
            RuntimeException.class.isAssignableFrom(CalculationException.class),
            "CalculationException must not extend RuntimeException — it must be checked");
    }
}
