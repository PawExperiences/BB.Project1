package com.buildboard.calculator;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class EvaluatorTest {

    private static final double DELTA = 1e-9;

    @Test
    void appliesStandardPrecedence() {
        assertEquals(14.0, Evaluator.evaluate("2 + 3 * 4"), DELTA);
    }

    @Test
    void supportsNestedParentheses() {
        assertEquals(21.0, Evaluator.evaluate("((1 + 2) * (3 + 4))"), DELTA);
    }

    @Test
    void parsesDecimalLiterals() {
        assertEquals(5.0, Evaluator.evaluate("3.5 + 1.5"), DELTA);
    }

    @Test
    void supportsLeadingUnaryMinus() {
        assertEquals(-2.0, Evaluator.evaluate("-4 + 2"), DELTA);
    }

    @Test
    void supportsPostOperatorUnaryMinus() {
        assertEquals(-6.0, Evaluator.evaluate("2 * -3"), DELTA);
    }

    @Test
    void ignoresWhitespaceAnywhere() {
        assertEquals(5.0, Evaluator.evaluate(" 2  +  3 "), DELTA);
    }

    @Test
    void divisionByZeroThrowsCalculationException() {
        CalculationException ex = assertThrows(CalculationException.class,
                () -> Evaluator.evaluate("1 / 0"));
        assertTrue(ex.getMessage().toLowerCase().contains("zero"));
    }

    @Test
    void unbalancedParenthesisThrowsCalculationException() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate("(1 + 2"));
    }

    @Test
    void emptyStringThrowsCalculationException() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate(""));
    }

    @Test
    void extraClosingParenthesisThrowsCalculationException() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate("1 + 2)"));
    }

    @Test
    void malformedExpressionThrowsCalculationException() {
        assertThrows(CalculationException.class, () -> Evaluator.evaluate("1 + * 2"));
    }
}
