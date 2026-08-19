package com.buildboard.calculator;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeFalse;

import java.awt.BorderLayout;
import java.awt.Component;
import java.awt.GraphicsEnvironment;
import java.awt.GridBagLayout;
import java.awt.event.KeyEvent;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import javax.swing.ActionMap;
import javax.swing.InputMap;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.KeyStroke;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

/**
 * Test suite for {@link CalculatorWindow}, covering each acceptance
 * criterion of the "Swing calculator window" card.
 *
 * <p>Tests that instantiate the frame cannot run in a headless
 * environment (a {@code JFrame} needs a display), so they are guarded by
 * a JUnit assumption on {@link GraphicsEnvironment#isHeadless()}: in the
 * headless build container they skip instead of failing, and on a machine
 * with a display they run fully. Checks that never instantiate the frame
 * -- {@link CalculatorWindow#formatResult(double)} and the
 * no-{@code main}-method contract -- run in every environment.</p>
 */
class CalculatorWindowTest {

    private CalculatorWindow window;

    @AfterEach
    void disposeWindow() {
        if (window != null) {
            window.dispose();
            window = null;
        }
    }

    /**
     * Creates the frame, or skips the calling test when no display is
     * available (headless CI container).
     */
    private CalculatorWindow createWindow() {
        assumeFalse(GraphicsEnvironment.isHeadless(),
                "CalculatorWindow is a JFrame and needs a display");
        window = new CalculatorWindow();
        return window;
    }

    // ----------------------------------------------------------------
    // Window properties
    // ----------------------------------------------------------------

    @Test
    void windowHasTitleInitialSizeAndMinimumSize() {
        CalculatorWindow w = createWindow();

        assertEquals("Calculator", w.getTitle());
        assertEquals(320, w.getSize().width, "initial width");
        assertEquals(420, w.getSize().height, "initial height");
        assertTrue(w.isResizable(), "the user may resize larger");
        assertEquals(320, w.getMinimumSize().width, "never smaller than the initial width");
        assertEquals(420, w.getMinimumSize().height, "never smaller than the initial height");
    }

    // ----------------------------------------------------------------
    // Display
    // ----------------------------------------------------------------

    @Test
    void displayIsSingleNonEditableRightAlignedAndInitiallyEmptyAtTheTop() {
        CalculatorWindow w = createWindow();

        List<JTextField> fields = new ArrayList<>();
        for (Component c : w.getContentPane().getComponents()) {
            if (c instanceof JTextField field) {
                fields.add(field);
            }
        }
        assertEquals(1, fields.size(), "exactly one display field");

        JTextField field = fields.get(0);
        assertFalse(field.isEditable(), "non-editable");
        assertEquals(JTextField.RIGHT, field.getHorizontalAlignment(), "right-aligned");
        assertEquals("", field.getText(), "initially empty");

        BorderLayout layout = (BorderLayout) w.getContentPane().getLayout();
        assertSame(field, layout.getLayoutComponent(BorderLayout.NORTH),
                "the display sits at the top of the window");
    }

    // ----------------------------------------------------------------
    // Button grid
    // ----------------------------------------------------------------

    @Test
    void gridBagPanelBelowTheDisplayHoldsEveryLabelledButton() {
        CalculatorWindow w = createWindow();

        BorderLayout layout = (BorderLayout) w.getContentPane().getLayout();
        Component centre = layout.getLayoutComponent(BorderLayout.CENTER);
        assertTrue(centre instanceof JPanel, "a panel below the display");
        assertTrue(((JPanel) centre).getLayout() instanceof GridBagLayout,
                "the button panel uses GridBagLayout");

        List<JButton> buttons = buttons((JPanel) centre);
        // The groomed spec says "18" but enumerates 19 labels (0-9, ., +,
        // -, *, /, (, ), C and =), each with mandated behaviour -- all 19
        // are implemented.
        assertEquals(19, buttons.size(), "one button per enumerated label");

        Set<String> labels = buttons.stream()
                .map(JButton::getText)
                .collect(Collectors.toSet());
        assertEquals(Set.of("0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
                ".", "+", "-", "*", "/", "(", ")", "C", "="), labels);
    }

    private static List<JButton> buttons(JPanel panel) {
        List<JButton> buttons = new ArrayList<>();
        for (Component c : panel.getComponents()) {
            if (c instanceof JButton button) {
                buttons.add(button);
            }
        }
        return buttons;
    }

    private JButton button(String label) {
        for (JButton button : buttons(window.buttonPanel)) {
            if (button.getText().equals(label)) {
                return button;
            }
        }
        throw new AssertionError("no button labelled \"" + label + "\"");
    }

    // ----------------------------------------------------------------
    // Button behaviour: append and clear
    // ----------------------------------------------------------------

    @Test
    void clickingSymbolButtonsAppendsEachSymbolToTheDisplay() {
        createWindow();

        button("1").doClick();
        button("+").doClick();
        button("2").doClick();
        assertEquals("1+2", window.display.getText());

        button("(").doClick();
        button("3").doClick();
        button(")").doClick();
        button(".").doClick();
        button("5").doClick();
        assertEquals("1+2(3).5", window.display.getText());
    }

    @Test
    void clickingCEmptiesTheDisplay() {
        createWindow();

        button("1").doClick();
        button("+").doClick();
        assertEquals("1+", window.display.getText());
        button("C").doClick();
        assertEquals("", window.display.getText());

        // C also clears a displayed result.
        button("1").doClick();
        button("+").doClick();
        button("2").doClick();
        button("=").doClick();
        assertEquals("3", window.display.getText());
        button("C").doClick();
        assertEquals("", window.display.getText());
    }

    // ----------------------------------------------------------------
    // Evaluation and result formatting through the real Evaluator
    // ----------------------------------------------------------------

    /** Types an expression exactly as the symbol buttons would. */
    private void typeExpression(String expression) {
        for (char c : expression.toCharArray()) {
            window.pressSymbol(c);
        }
    }

    @Test
    void equalsPassesTheDisplayTextToEvaluatorAndShowsTheFormattedResult() {
        createWindow();

        typeExpression("1+2");
        button("=").doClick();
        assertEquals("3", window.display.getText(), "integers print without a decimal point");

        button("C").doClick();
        typeExpression("10/4");
        button("=").doClick();
        assertEquals("2.5", window.display.getText(), "no trailing zeros");

        button("C").doClick();
        typeExpression("2/3");
        button("=").doClick();
        assertEquals("0.6666666667", window.display.getText(),
                "at most 10 significant digits");
    }

    // ----------------------------------------------------------------
    // Error display and recovery
    // ----------------------------------------------------------------

    @Test
    void calculationErrorShowsTheMessageAndTheNextInputStartsAFreshExpression() {
        createWindow();

        // "(1+" is malformed under any expression grammar (unbalanced
        // parenthesis and dangling operator); the Evaluator contract is
        // to reject it with a CalculationException.
        typeExpression("(1+");
        button("=").doClick();

        String message = window.display.getText();
        assertFalse(message.isEmpty(), "the exception message is displayed");
        assertFalse("(1+".equals(message), "the expression is replaced by the message");

        // The next button press clears the message and starts a fresh
        // expression with that input.
        button("5").doClick();
        assertEquals("5", window.display.getText());
    }

    // ----------------------------------------------------------------
    // Input after a successful result
    // ----------------------------------------------------------------

    private void showResultOf(String expression) {
        typeExpression(expression);
        button("=").doClick();
    }

    @Test
    void digitAfterAResultReplacesItWithAFreshExpression() {
        createWindow();
        showResultOf("1+2");
        assertEquals("3", window.display.getText());

        button("7").doClick();
        assertEquals("7", window.display.getText());
    }

    @Test
    void dotAndOpenParenAfterAResultReplaceItWithAFreshExpression() {
        createWindow();
        showResultOf("1+2");
        button(".").doClick();
        assertEquals(".", window.display.getText());

        button("C").doClick();
        showResultOf("1+2");
        button("(").doClick();
        assertEquals("(", window.display.getText());
    }

    @Test
    void operatorAfterAResultKeepsItAndContinuesTheExpression() {
        createWindow();
        showResultOf("1+2");
        assertEquals("3", window.display.getText());

        button("+").doClick();
        assertEquals("3+", window.display.getText());

        button("2").doClick();
        button("=").doClick();
        assertEquals("5", window.display.getText(), "the continued expression evaluates");
    }

    @Test
    void closeParenAfterAResultAppendsLikeAnOperator() {
        createWindow();
        showResultOf("1+2");

        button(")").doClick();
        assertEquals("3)", window.display.getText(),
                "')' can never start a fresh expression, so it continues");
    }

    // ----------------------------------------------------------------
    // Keyboard: window-wide bindings that mirror the buttons
    // ----------------------------------------------------------------

    @Test
    void windowWideKeyBindingsExistForEveryCalculatorKey() {
        CalculatorWindow w = createWindow();

        // WHEN_IN_FOCUSED_WINDOW is the mechanism that makes the keys work
        // whenever the window has focus, regardless of the focused
        // component.
        InputMap inputMap = w.getRootPane().getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW);
        ActionMap actionMap = w.getRootPane().getActionMap();

        for (char c : "0123456789.+-*/()".toCharArray()) {
            Object binding = inputMap.get(KeyStroke.getKeyStroke(c));
            assertNotNull(binding, "no key binding for '" + c + "'");
            assertNotNull(actionMap.get(binding), "no action bound for '" + c + "'");
        }
        assertNotNull(inputMap.get(KeyStroke.getKeyStroke(KeyEvent.VK_ENTER, 0)), "ENTER binding");
        assertNotNull(inputMap.get(KeyStroke.getKeyStroke(KeyEvent.VK_ESCAPE, 0)), "ESCAPE binding");
        assertNotNull(inputMap.get(KeyStroke.getKeyStroke(KeyEvent.VK_BACK_SPACE, 0)), "BACKSPACE binding");
    }

    /** Fires the action bound to a typed character, as a real keystroke would. */
    private void typeKey(char c) {
        InputMap inputMap = window.getRootPane().getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW);
        Object binding = inputMap.get(KeyStroke.getKeyStroke(c));
        assertNotNull(binding, "no key binding for '" + c + "'");
        window.getRootPane().getActionMap().get(binding).actionPerformed(null);
    }

    /** Fires the action bound to a key code (ENTER, ESCAPE, BACK_SPACE). */
    private void pressKey(int keyCode) {
        InputMap inputMap = window.getRootPane().getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW);
        Object binding = inputMap.get(KeyStroke.getKeyStroke(keyCode, 0));
        assertNotNull(binding, "no key binding for key code " + keyCode);
        window.getRootPane().getActionMap().get(binding).actionPerformed(null);
    }

    @Test
    void printableKeysAppendAndEnterActsAsEquals() {
        createWindow();

        for (char c : "12.5*(4".toCharArray()) {
            typeKey(c);
        }
        assertEquals("12.5*(4", window.display.getText());

        pressKey(KeyEvent.VK_ESCAPE);
        typeKey('1');
        typeKey('+');
        typeKey('2');
        assertEquals("1+2", window.display.getText());

        pressKey(KeyEvent.VK_ENTER);
        assertEquals("3", window.display.getText(), "ENTER behaves as =");
    }

    @Test
    void escapeActsAsClear() {
        createWindow();
        typeKey('9');
        typeKey('*');
        assertEquals("9*", window.display.getText());

        pressKey(KeyEvent.VK_ESCAPE);
        assertEquals("", window.display.getText());
    }

    @Test
    void backspaceDeletesOneCharacterOfAnInProgressExpressionOnly() {
        createWindow();

        typeExpression("1+2");
        pressKey(KeyEvent.VK_BACK_SPACE);
        assertEquals("1+", window.display.getText());
        pressKey(KeyEvent.VK_BACK_SPACE);
        assertEquals("1", window.display.getText());
        pressKey(KeyEvent.VK_BACK_SPACE);
        assertEquals("", window.display.getText());
        pressKey(KeyEvent.VK_BACK_SPACE);
        assertEquals("", window.display.getText(), "deleting from an empty display is a no-op");

        // No effect while a result is displayed.
        typeExpression("1+2");
        pressKey(KeyEvent.VK_ENTER);
        assertEquals("3", window.display.getText());
        pressKey(KeyEvent.VK_BACK_SPACE);
        assertEquals("3", window.display.getText());

        // No effect while an error message is displayed; the next
        // keystroke still starts a fresh expression.
        pressKey(KeyEvent.VK_ESCAPE);
        typeExpression("(1+");
        pressKey(KeyEvent.VK_ENTER);
        String message = window.display.getText();
        assertFalse(message.isEmpty());
        pressKey(KeyEvent.VK_BACK_SPACE);
        assertEquals(message, window.display.getText(), "BACKSPACE leaves an error message untouched");
        typeKey('5');
        assertEquals("5", window.display.getText(), "a keystroke after an error starts fresh");
    }

    // ----------------------------------------------------------------
    // Checks that never instantiate the frame: they run in every
    // environment, including the headless build container.
    // ----------------------------------------------------------------

    @Test
    void formatResultUsesAtMostTenSignificantDigitsAndStripsTrailingZeros() {
        assertEquals("3", CalculatorWindow.formatResult(3.0), "integers without a decimal point");
        assertEquals("0.25", CalculatorWindow.formatResult(0.25));
        assertEquals("2.5", CalculatorWindow.formatResult(2.5));
        assertEquals("0.6666666667", CalculatorWindow.formatResult(2.0 / 3.0),
                "rounded to 10 significant digits");
        assertEquals("0.3333333333", CalculatorWindow.formatResult(1.0 / 3.0));
        assertEquals("1.23", CalculatorWindow.formatResult(1.2300), "trailing zeros removed");
        assertEquals("-3", CalculatorWindow.formatResult(-3.0));
        assertEquals("100", CalculatorWindow.formatResult(100.0));
        assertEquals("123456789000", CalculatorWindow.formatResult(123456789012.0),
                "12 significant digits collapse to 10");
    }

    @Test
    void calculatorWindowDeclaresNoMainMethod() {
        List<String> mainMethods = Arrays.stream(CalculatorWindow.class.getDeclaredMethods())
                .map(Method::getName)
                .filter("main"::equals)
                .toList();
        assertTrue(mainMethods.isEmpty(), "the launcher is owned by a later card");
    }
}
