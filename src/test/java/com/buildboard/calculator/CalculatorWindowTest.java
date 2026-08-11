package com.buildboard.calculator;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.awt.Dimension;
import java.awt.GridBagLayout;
import java.lang.reflect.Method;

import javax.swing.Action;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.SwingConstants;

import org.junit.jupiter.api.Test;

class CalculatorWindowTest {

    private static final String[] REQUIRED_LABELS = {
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
        ".", "+", "-", "*", "/", "(", ")", "C", "="
    };

    private Action keyAction(CalculatorWindow window, String actionMapKey) {
        Action action = window.getRootPane().getActionMap().get(actionMapKey);
        assertNotNull(action, "no key-binding Action registered under '" + actionMapKey + "'");
        return action;
    }

    @Test
    void extendsJFrameWithExactTitle() {
        CalculatorWindow window = new CalculatorWindow();
        assertTrue(window instanceof JFrame);
        assertEquals("Calculator", window.getTitle());
    }

    @Test
    void sizeAndMinimumSizeAreEnforced() {
        CalculatorWindow window = new CalculatorWindow();
        assertEquals(new Dimension(320, 420), window.getSize());
        assertEquals(new Dimension(320, 420), window.getMinimumSize());
    }

    @Test
    void displayIsRightAlignedAndNotEditable() {
        CalculatorWindow window = new CalculatorWindow();
        JTextField display = window.getDisplayField();
        assertEquals(SwingConstants.RIGHT, display.getHorizontalAlignment());
        assertFalse(display.isEditable());
    }

    @Test
    void buttonPanelUsesGridBagLayoutWithExactlyOneButtonPerRequiredLabel() {
        CalculatorWindow window = new CalculatorWindow();
        JPanel panel = window.getButtonPanel();
        assertTrue(panel.getLayout() instanceof GridBagLayout);

        for (String label : REQUIRED_LABELS) {
            JButton button = window.getButton(label);
            assertNotNull(button, "missing button for '" + label + "'");
            assertEquals(label, button.getText());
        }
        assertEquals(REQUIRED_LABELS.length, window.getButtonCount());
    }

    @Test
    void clickingDigitsOperatorsDotAndParensAppendsToDisplay() {
        CalculatorWindow window = new CalculatorWindow();
        for (String label : new String[] {"2", "+", "3", "*", "(", "4", ")", "."}) {
            window.getButton(label).doClick();
        }
        assertEquals("2+3*(4).", window.getDisplayField().getText());
    }

    @Test
    void clickingClearEmptiesDisplayWithoutCallingEvaluator() {
        CalculatorWindow window = new CalculatorWindow();
        window.getButton("(").doClick();
        window.getButton("(").doClick();
        assertDoesNotThrow(() -> window.getButton("C").doClick());
        assertEquals("", window.getDisplayField().getText());
    }

    @Test
    void clickingEqualsShowsFormattedIntegralResult() {
        CalculatorWindow window = new CalculatorWindow();
        for (String label : new String[] {"2", "+", "3", "*", "4"}) {
            window.getButton(label).doClick();
        }
        window.getButton("=").doClick();
        assertEquals("14", window.getDisplayField().getText());
    }

    @Test
    void clickingEqualsFormatsResultToAtMostTenSignificantDigitsNoTrailingZeros() {
        CalculatorWindow window = new CalculatorWindow();
        for (String label : new String[] {"5", "/", "2"}) {
            window.getButton(label).doClick();
        }
        window.getButton("=").doClick();
        assertEquals("2.5", window.getDisplayField().getText());

        CalculatorWindow window2 = new CalculatorWindow();
        for (String label : new String[] {"1", "/", "3"}) {
            window2.getButton(label).doClick();
        }
        window2.getButton("=").doClick();
        assertEquals("0.3333333333", window2.getDisplayField().getText());
    }

    @Test
    void equalsOnInvalidExpressionShowsExceptionMessageWithoutCrashing() {
        CalculatorWindow window = new CalculatorWindow();
        window.getButton("1").doClick();
        window.getButton("/").doClick();
        window.getButton("0").doClick();

        String expectedMessage = assertThrows(CalculationException.class,
                () -> Evaluator.evaluate("1/0")).getMessage();

        assertDoesNotThrow(() -> window.getButton("=").doClick());
        assertEquals(expectedMessage, window.getDisplayField().getText());
    }

    @Test
    void afterSuccessfulEqualsNextDigitStartsFreshExpression() {
        CalculatorWindow window = new CalculatorWindow();
        window.getButton("2").doClick();
        window.getButton("+").doClick();
        window.getButton("3").doClick();
        window.getButton("=").doClick();
        assertEquals("5", window.getDisplayField().getText());

        window.getButton("7").doClick();
        assertEquals("7", window.getDisplayField().getText());
    }

    @Test
    void afterErrorEqualsNextOperatorStartsFreshExpression() {
        CalculatorWindow window = new CalculatorWindow();
        window.getButton("1").doClick();
        window.getButton("/").doClick();
        window.getButton("0").doClick();
        window.getButton("=").doClick();

        window.getButton("9").doClick();
        assertEquals("9", window.getDisplayField().getText());
    }

    @Test
    void afterEqualsBackspaceFirstClearsThenIsNoOp() {
        CalculatorWindow window = new CalculatorWindow();
        window.getButton("2").doClick();
        window.getButton("+").doClick();
        window.getButton("3").doClick();
        window.getButton("=").doClick();
        assertEquals("5", window.getDisplayField().getText());

        keyAction(window, "BACKSPACE").actionPerformed(null);
        assertEquals("", window.getDisplayField().getText());

        assertDoesNotThrow(() -> keyAction(window, "BACKSPACE").actionPerformed(null));
        assertEquals("", window.getDisplayField().getText());
    }

    @Test
    void keyBindingsForDigitsOperatorsAndParensMirrorButtons() {
        CalculatorWindow buttonWindow = new CalculatorWindow();
        CalculatorWindow keyWindow = new CalculatorWindow();

        for (String label : new String[] {"1", "2", "+", "(", "3", ")", "."}) {
            buttonWindow.getButton(label).doClick();
            keyAction(keyWindow, label).actionPerformed(null);
        }

        assertEquals(buttonWindow.getDisplayField().getText(), keyWindow.getDisplayField().getText());
    }

    @Test
    void enterKeyActionTriggersEquals() {
        CalculatorWindow window = new CalculatorWindow();
        window.getButton("6").doClick();
        window.getButton("/").doClick();
        window.getButton("3").doClick();

        keyAction(window, "=").actionPerformed(null);

        assertEquals("2", window.getDisplayField().getText());
    }

    @Test
    void escapeKeyActionTriggersClear() {
        CalculatorWindow window = new CalculatorWindow();
        window.getButton("4").doClick();
        window.getButton("2").doClick();

        keyAction(window, "C").actionPerformed(null);

        assertEquals("", window.getDisplayField().getText());
    }

    @Test
    void backspaceKeyActionRemovesLastCharacterAndIsNoOpOnEmpty() {
        CalculatorWindow window = new CalculatorWindow();
        window.getButton("1").doClick();
        window.getButton("2").doClick();

        keyAction(window, "BACKSPACE").actionPerformed(null);
        assertEquals("1", window.getDisplayField().getText());

        keyAction(window, "BACKSPACE").actionPerformed(null);
        assertEquals("", window.getDisplayField().getText());

        assertDoesNotThrow(() -> keyAction(window, "BACKSPACE").actionPerformed(null));
        assertEquals("", window.getDisplayField().getText());
    }

    @Test
    void declaresNoMainMethod() {
        assertThrows(NoSuchMethodException.class, () -> {
            Method main = CalculatorWindow.class.getDeclaredMethod("main", String[].class);
            throw new AssertionError("unexpected main method found: " + main);
        });
    }
}
