package com.buildboard.calculator;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.ActionEvent;
import java.awt.event.KeyEvent;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

import javax.swing.AbstractAction;
import javax.swing.ActionMap;
import javax.swing.InputMap;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.KeyStroke;

/**
 * The calculator's Swing shell: a {@link JFrame} that owns the display and
 * the button grid and delegates ALL arithmetic to the {@link Evaluator}
 * core. This class formats and displays; it never parses or computes.
 *
 * <p>Window: titled "Calculator", 320x420 px initial size which is also
 * the minimum size (the user may resize larger, never smaller).</p>
 *
 * <p>Input: the grid buttons and the keyboard (window-wide key bindings,
 * active regardless of which component is focused) share the same
 * behaviour -- expression symbols append to the display, "C"/ESCAPE
 * clears, "="/ENTER evaluates, and BACKSPACE deletes the last character
 * of an in-progress expression.</p>
 *
 * <p>No {@code main} method lives here: the launcher is owned by a later
 * card, which is also when the window is made visible.</p>
 */
public class CalculatorWindow extends JFrame {

    /** Window title. */
    static final String TITLE = "Calculator";

    /** Initial (and minimum) window width in pixels. */
    static final int WINDOW_WIDTH = 320;

    /** Initial (and minimum) window height in pixels. */
    static final int WINDOW_HEIGHT = 420;

    /** Significant digits kept when formatting an evaluation result. */
    static final int MAX_SIGNIFICANT_DIGITS = 10;

    /**
     * The single display field at the top of the window. Package-private
     * so the same-package test class can inspect it.
     */
    final JTextField display;

    /**
     * The GridBagLayout button grid below the display. Package-private so
     * the same-package test class can inspect it.
     */
    final JPanel buttonPanel;

    /** True while the display shows the result of a successful evaluation. */
    private boolean resultDisplayed;

    /** True while the display shows a CalculationException message. */
    private boolean errorDisplayed;

    public CalculatorWindow() {
        super(TITLE);

        display = new JTextField();
        display.setEditable(false);
        // The display never takes focus, so the window-wide key bindings
        // installed below fire regardless of which component is focused.
        display.setFocusable(false);
        display.setHorizontalAlignment(JTextField.RIGHT);

        buttonPanel = buildButtonPanel();

        getContentPane().setLayout(new BorderLayout());
        getContentPane().add(display, BorderLayout.NORTH);
        getContentPane().add(buttonPanel, BorderLayout.CENTER);

        setSize(WINDOW_WIDTH, WINDOW_HEIGHT);
        setMinimumSize(new Dimension(WINDOW_WIDTH, WINDOW_HEIGHT));
        // DISPOSE, not EXIT: the application lifecycle belongs to the later
        // launcher card (and EXIT_ON_CLOSE would kill the test JVM).
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);

        installKeyBindings();
    }

    // ----------------------------------------------------------------
    // UI construction
    // ----------------------------------------------------------------

    /**
     * Builds the button grid: the 19 labelled buttons (0-9, ., +, -, *, /,
     * (, ), C and =) in a 4-column GridBagLayout. The groomed spec says
     * "18" but enumerates these 19 labels, each with mandated behaviour,
     * so all 19 are present; "=" spans two columns on the last row to
     * keep the grid rectangular.
     */
    private JPanel buildButtonPanel() {
        JPanel panel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.fill = GridBagConstraints.BOTH;
        gbc.weightx = 1.0;
        gbc.weighty = 1.0;
        gbc.insets = new Insets(2, 2, 2, 2);

        String[][] rows = {
            {"(", ")", "C", "/"},
            {"7", "8", "9", "*"},
            {"4", "5", "6", "-"},
            {"1", "2", "3", "+"},
            {"0", ".", "="},
        };

        for (int row = 0; row < rows.length; row++) {
            for (int col = 0; col < rows[row].length; col++) {
                gbc.gridx = col;
                gbc.gridy = row;
                // On the short last row, the final button ("=") spans the
                // remaining columns.
                gbc.gridwidth = (col == rows[row].length - 1 && col < 3) ? 4 - col : 1;
                panel.add(makeButton(rows[row][col]), gbc);
            }
        }
        return panel;
    }

    private JButton makeButton(String label) {
        JButton button = new JButton(label);
        button.addActionListener(event -> pressLabel(label));
        return button;
    }

    // ----------------------------------------------------------------
    // Keyboard: mirrors the buttons, window-wide.
    // ----------------------------------------------------------------

    /**
     * Binds every calculator key on the root pane with
     * {@link JComponent#WHEN_IN_FOCUSED_WINDOW}, so the keys act whenever
     * the window has focus, regardless of which component inside it is
     * focused: digits, '.', '+', '-', '*', '/', '(' and ')' append; ENTER
     * acts as "="; ESCAPE acts as "C"; BACKSPACE deletes one character
     * of an in-progress expression.
     */
    private void installKeyBindings() {
        InputMap inputMap = getRootPane().getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW);
        ActionMap actionMap = getRootPane().getActionMap();

        String symbols = "0123456789.+-*/()";
        for (int i = 0; i < symbols.length(); i++) {
            final char symbol = symbols.charAt(i);
            String key = "calculator-type-" + symbol;
            inputMap.put(KeyStroke.getKeyStroke(symbol), key);
            actionMap.put(key, new AbstractAction() {
                @Override
                public void actionPerformed(ActionEvent event) {
                    pressSymbol(symbol);
                }
            });
        }

        inputMap.put(KeyStroke.getKeyStroke(KeyEvent.VK_ENTER, 0), "calculator-equals");
        actionMap.put("calculator-equals", new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent event) {
                pressEquals();
            }
        });

        inputMap.put(KeyStroke.getKeyStroke(KeyEvent.VK_ESCAPE, 0), "calculator-clear");
        actionMap.put("calculator-clear", new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent event) {
                pressClear();
            }
        });

        inputMap.put(KeyStroke.getKeyStroke(KeyEvent.VK_BACK_SPACE, 0), "calculator-backspace");
        actionMap.put("calculator-backspace", new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent event) {
                pressBackspace();
            }
        });
    }

    // ----------------------------------------------------------------
    // Input behaviour, shared by the buttons and the keyboard.
    // ----------------------------------------------------------------

    private void pressLabel(String label) {
        switch (label) {
            case "C" -> pressClear();
            case "=" -> pressEquals();
            default -> pressSymbol(label.charAt(0));
        }
    }

    /**
     * Handles one expression symbol (digit, '.', operator or parenthesis)
     * from a button or a keystroke:
     *
     * <ul>
     *   <li>while an error message is displayed, any symbol clears the
     *       message and starts a fresh expression with that symbol;</li>
     *   <li>while a result is displayed, an operator or ')' continues the
     *       expression from the result, while a digit, '.' or '(' replaces
     *       the result and starts a fresh expression;</li>
     *   <li>otherwise the symbol appends to the in-progress expression.</li>
     * </ul>
     */
    void pressSymbol(char symbol) {
        if (errorDisplayed) {
            display.setText(String.valueOf(symbol));
            errorDisplayed = false;
            return;
        }
        if (resultDisplayed) {
            resultDisplayed = false;
            if (continuesExpression(symbol)) {
                display.setText(display.getText() + symbol);
            } else {
                display.setText(String.valueOf(symbol));
            }
            return;
        }
        display.setText(display.getText() + symbol);
    }

    /**
     * Symbols that continue an expression from a displayed result instead
     * of replacing it. ')' can never validly start a fresh expression, so
     * after a result it appends like an operator (groomed assumption).
     */
    private static boolean continuesExpression(char symbol) {
        return symbol == '+' || symbol == '-' || symbol == '*' || symbol == '/' || symbol == ')';
    }

    /** "C" / ESCAPE: empties the display from any state. */
    void pressClear() {
        display.setText("");
        resultDisplayed = false;
        errorDisplayed = false;
    }

    /**
     * "=" / ENTER: passes the exact display text to
     * {@link Evaluator#evaluate(String)} and replaces the display with the
     * formatted result; on {@link CalculationException} the display shows
     * the exception's message instead (no crash, no dialog). All parsing
     * and arithmetic stay in Evaluator; this class only formats.
     */
    void pressEquals() {
        if (errorDisplayed) {
            // The first input after an error starts a fresh expression.
            display.setText("");
            errorDisplayed = false;
        }
        String expression = display.getText();
        try {
            // The sibling card's contract is a static evaluate(String)
            // returning a numeric result (double/BigDecimal) and throwing
            // CalculationException; the result is consumed here as a
            // Number so this class compiles against either numeric type.
            Number value = Evaluator.evaluate(expression);
            display.setText(formatResult(value.doubleValue()));
            resultDisplayed = true;
            errorDisplayed = false;
        } catch (CalculationException e) {
            display.setText(e.getMessage());
            errorDisplayed = true;
            resultDisplayed = false;
        }
    }

    /**
     * BACKSPACE: deletes the last character of an in-progress expression.
     * A no-op while a result or an error message is displayed.
     */
    void pressBackspace() {
        if (resultDisplayed || errorDisplayed) {
            return;
        }
        String text = display.getText();
        if (!text.isEmpty()) {
            display.setText(text.substring(0, text.length() - 1));
        }
    }

    // ----------------------------------------------------------------
    // Result formatting (display only; no arithmetic).
    // ----------------------------------------------------------------

    /**
     * Formats an evaluation result with at most
     * {@link #MAX_SIGNIFICANT_DIGITS} significant digits and trailing
     * zeros removed; integers are shown without a decimal point
     * ("3", not "3.0"). Examples: 2.5 -&gt; "2.5",
     * 2.0/3.0 -&gt; "0.6666666667".
     */
    static String formatResult(double value) {
        if (!Double.isFinite(value)) {
            return Double.toString(value);
        }
        return BigDecimal.valueOf(value)
                .round(new MathContext(MAX_SIGNIFICANT_DIGITS, RoundingMode.HALF_UP))
                .stripTrailingZeros()
                .toPlainString();
    }
}
