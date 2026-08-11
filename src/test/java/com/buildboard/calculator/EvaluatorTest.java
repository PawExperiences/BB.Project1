package com.buildboard.calculator;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class EvaluatorTest {

    private static final double DELTA = 1e-9;

    @Test
    void operatorPrecedenceMultiplicationBindsTighterThanAddition() throws CalculationException {
        assertEquals(14.0, Evaluator.evaluate("2 + 3 * 4"), DELTA);
    }

    @Test
    void operatorPrecedenceDivisionBindsTighterThanSubtraction() throws CalculationException {
        assertEquals(8.0, Evaluator.evaluate("10 - 4 / 2"), DELTA);
    }

    @Test
    void nestedParenthesesOverridePrecedence() throws CalculationException {
        assertEquals(15.0, Evaluator.evaluate("(2 + 3) * (4 - 1)"), DELTA);
    }

    @Test
    void deeplyNestedParenthesesEvaluateCorrectly() throws CalculationException {
        assertEquals(5.0, Evaluator.evaluate("((1 + (2 * (3 - 1))))"), DELTA);
    }

    @Test
    void decimalLiteralsAreParsedAndComputed() throws CalculationException {
        assertEquals(3.75, Evaluator.evaluate("1.5 + 2.25"), DELTA);
    }

    @Test
    void leadingUnaryMinusIsSupported() throws CalculationException {
        assertEquals(-2.0, Evaluator.evaluate("-4 + 2"), DELTA);
    }

    @Test
    void postOperatorUnaryMinusIsSupported() throws CalculationException {
        assertEquals(-6.0, Evaluator.evaluate("2 * -3"), DELTA);
    }

    @Test
    void whitespaceAnywhereIsInsignificant() throws CalculationException {
        assertEquals(5.0, Evaluator.evaluate(" 2  +   3 "), DELTA);
    }

    @Test
    void divisionByZeroThrowsWithNamedProblem() {
        CalculationException ex = assertThrows(CalculationException.class,
                () -> Evaluator.evaluate("1 / 0"));
        assertTrue(ex.getMessage().toLowerCase().contains("division by zero"));
    }

    @Test
    void unbalancedParenthesisThrowsWithNamedProblem() {
        CalculationException ex = assertThrows(CalculationException.class,
                () -> Evaluator.evaluate("(1 + 2"));
        assertTrue(ex.getMessage().toLowerCase().contains("parenthes"));
    }

    @Test
    void emptyStringThrowsWithNamedProblem() {
        CalculationException ex = assertThrows(CalculationException.class,
                () -> Evaluator.evaluate(""));
        assertTrue(ex.getMessage().toLowerCase().contains("empty"));
    }
}
