package com.buildboard.calculator;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for {@link Evaluator#evaluate(String)}.
 * Written before the implementation (test-first workflow).
 */
class EvaluatorTest {

    // -----------------------------------------------------------------------
    // Basic arithmetic
    // -----------------------------------------------------------------------

    @Test
    void addition() throws CalculationException {
        assertEquals(5.0, Evaluator.evaluate("2+3"), 1e-10);
    }

    @Test
    void subtraction() throws CalculationException {
        assertEquals(1.0, Evaluator.evaluate("3-2"), 1e-10);
    }

    @Test
    void multiplication() throws CalculationException {
        assertEquals(6.0, Evaluator.evaluate("2*3"), 1e-10);
    }

    @Test
    void division() throws CalculationException {
        assertEquals(2.5, Evaluator.evaluate("5/2"), 1e-10);
    }

    // -----------------------------------------------------------------------
    // Operator precedence
    // -----------------------------------------------------------------------

    @Test
    void operatorPrecedenceMulOverAdd() throws CalculationException {
        // 2 + 3*4 = 2 + 12 = 14
        assertEquals(14.0, Evaluator.evaluate("2+3*4"), 1e-10);
    }

    @Test
    void operatorPrecedenceDivOverSub() throws CalculationException {
        // 10 - 6/3 = 10 - 2 = 8
        assertEquals(8.0, Evaluator.evaluate("10-6/3"), 1e-10);
    }

    // -----------------------------------------------------------------------
    // Parentheses
    // -----------------------------------------------------------------------

    @Test
    void simpleParentheses() throws CalculationException {
        assertEquals(20.0, Evaluator.evaluate("(2+3)*4"), 1e-10);
    }

    @Test
    void doubleNestedParentheses() throws CalculationException {
        assertEquals(20.0, Evaluator.evaluate("((2+3)*4)"), 1e-10);
    }

    @Test
    void tripleNestedParentheses() throws CalculationException {
        // (((2+3))*4) — depth 3
        assertEquals(20.0, Evaluator.evaluate("(((2+3))*4)"), 1e-10);
    }

    @Test
    void deeplyNestedParentheses() throws CalculationException {
        // ((1+2)*(3+4)) = 3*7 = 21
        assertEquals(21.0, Evaluator.evaluate("((1+2)*(3+4))"), 1e-10);
    }

    // -----------------------------------------------------------------------
    // Decimal literals
    // -----------------------------------------------------------------------

    @Test
    void decimalAddition() throws CalculationException {
        assertEquals(4.0, Evaluator.evaluate("1.5+2.5"), 1e-10);
    }

    @Test
    void decimalMultiplication() throws CalculationException {
        assertEquals(8.75, Evaluator.evaluate("3.5*2.5"), 1e-10);
    }

    @Test
    void decimalLiteralAlone() throws CalculationException {
        assertEquals(100.0, Evaluator.evaluate("100.0"), 1e-10);
    }

    // -----------------------------------------------------------------------
    // Unary minus
    // -----------------------------------------------------------------------

    @Test
    void unaryMinusLeadingPosition() throws CalculationException {
        assertEquals(-4.0, Evaluator.evaluate("-4"), 1e-10);
    }

    @Test
    void unaryMinusPostOperatorPosition() throws CalculationException {
        assertEquals(-6.0, Evaluator.evaluate("2*-3"), 1e-10);
    }

    @Test
    void unaryMinusInParentheses() throws CalculationException {
        assertEquals(-5.0, Evaluator.evaluate("(-5)"), 1e-10);
    }

    @Test
    void unaryMinusChained() throws CalculationException {
        // 10 + -3 = 7
        assertEquals(7.0, Evaluator.evaluate("10+-3"), 1e-10);
    }

    // -----------------------------------------------------------------------
    // Whitespace insignificance
    // -----------------------------------------------------------------------

    @Test
    void whitespaceInsignificant() throws CalculationException {
        assertEquals(Evaluator.evaluate("2+3"), Evaluator.evaluate(" 2 + 3 "), 1e-10);
    }

    @Test
    void whitespaceAroundOperators() throws CalculationException {
        assertEquals(14.0, Evaluator.evaluate(" 2 + 3 * 4 "), 1e-10);
    }

    // -----------------------------------------------------------------------
    // Division by zero
    // -----------------------------------------------------------------------

    @Test
    void divisionByZeroThrowsCalculationException() {
        CalculationException ex = assertThrows(
                CalculationException.class,
                () -> Evaluator.evaluate("1/0")
        );
        assertNotNull(ex.getMessage(), "Exception message must not be null");
        assertFalse(ex.getMessage().isBlank(), "Exception message must not be blank");
    }

    @Test
    void divisionByZeroDecimalThrowsCalculationException() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate("5/0.0"));
    }

    // -----------------------------------------------------------------------
    // Malformed input
    // -----------------------------------------------------------------------

    @Test
    void emptyStringThrowsCalculationException() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate(""));
    }

    @Test
    void blankStringThrowsCalculationException() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate("   "));
    }

    @Test
    void unbalancedOpenParenthesisThrowsCalculationException() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate("(1+2"));
    }

    @Test
    void unbalancedCloseParenthesisThrowsCalculationException() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate("1+2)"));
    }

    @Test
    void invalidTokenThrowsCalculationException() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate("1+abc"));
    }

    @Test
    void missingOperandThrowsCalculationException() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate("1+"));
    }

    @Test
    void doubleOperatorThrowsCalculationException() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate("1++2"));
    }

    // -----------------------------------------------------------------------
    // No NaN / Infinity return values
    // -----------------------------------------------------------------------

    @Test
    void resultIsNeverNaN() throws CalculationException {
        double result = Evaluator.evaluate("1.5+2.5");
        assertFalse(Double.isNaN(result), "evaluate() must never return NaN");
    }

    @Test
    void resultIsNeverInfinite() throws CalculationException {
        double result = Evaluator.evaluate("100.0/4.0");
        assertFalse(Double.isInfinite(result), "evaluate() must never return Infinity");
    }
}
