package com.buildboard.calculator;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.event.ActionEvent;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

import javax.swing.AbstractAction;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.KeyStroke;

/**
 * Swing presentation layer for the calculator. Shows a non-editable display
 * fed by a grid of buttons (and their keyboard equivalents) and delegates all
 * arithmetic to {@link Evaluator}; this class owns only formatting and input
 * handling.
 */
public class CalculatorWindow extends JFrame {

    private static final Dimension MIN_SIZE = new Dimension(320, 420);
    private static final int RESULT_SIGNIFICANT_DIGITS = 10;
    private static final String DIGITS = "0123456789";
    private static final String OPERATORS = "+-*/";
    private static final String PARENS = "()";

    private final JTextField display;

    /** Set once '=' shows a result or error; the next input starts a fresh expression instead of appending. */
    private boolean startFresh;

    public CalculatorWindow() {
        super("Calculator");

        display = new JTextField();
        display.setEditable(false);
        display.setFocusable(false);
        display.setHorizontalAlignment(JTextField.RIGHT);

        setLayout(new BorderLayout());
        add(display, BorderLayout.NORTH);
        add(buildButtonGrid(), BorderLayout.CENTER);

        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setMinimumSize(MIN_SIZE);
        setSize(MIN_SIZE);

        installKeyBindings();
    }

    private JPanel buildButtonGrid() {
        JPanel grid = new JPanel(new GridBagLayout());
        GridBagConstraints c = new GridBagConstraints();
        c.fill = GridBagConstraints.BOTH;
        c.weightx = 1;
        c.weighty = 1;

        String[][] rows = {
                {"7", "8", "9", "/"},
                {"4", "5", "6", "*"},
                {"1", "2", "3", "-"},
                {"0", ".", "(", "+"},
        };
        for (int row = 0; row < rows.length; row++) {
            for (int col = 0; col < rows[row].length; col++) {
                addButton(grid, c, rows[row][col], col, row, 1);
            }
        }
        addButton(grid, c, ")", 0, 4, 1);
        addButton(grid, c, "C", 1, 4, 1);
        addButton(grid, c, "=", 2, 4, 2);

        return grid;
    }

    private void addButton(JPanel grid, GridBagConstraints c, String label, int col, int row, int width) {
        c.gridx = col;
        c.gridy = row;
        c.gridwidth = width;
        JButton button = new JButton(label);
        button.addActionListener(e -> handleSymbol(label));
        grid.add(button, c);
    }

    private void handleSymbol(String symbol) {
        switch (symbol) {
            case "C":
                clearDisplay();
                break;
            case "=":
                evaluateDisplay();
                break;
            default:
                appendToDisplay(symbol);
                break;
        }
    }

    private void appendToDisplay(String token) {
        if (startFresh) {
            display.setText("");
            startFresh = false;
        }
        display.setText(display.getText() + token);
    }

    private void clearDisplay() {
        display.setText("");
        startFresh = false;
    }

    private void backspace() {
        String text = display.getText();
        if (!text.isEmpty()) {
            display.setText(text.substring(0, text.length() - 1));
        }
    }

    private void evaluateDisplay() {
        try {
            double result = Evaluator.evaluate(display.getText());
            display.setText(formatResult(result));
        } catch (CalculationException e) {
            display.setText(e.getMessage());
        }
        startFresh = true;
    }

    private static String formatResult(double value) {
        BigDecimal rounded = BigDecimal.valueOf(value)
                .round(new MathContext(RESULT_SIGNIFICANT_DIGITS, RoundingMode.HALF_UP))
                .stripTrailingZeros();
        return rounded.toPlainString();
    }

    private void installKeyBindings() {
        JComponent root = getRootPane();
        for (int i = 0; i < DIGITS.length(); i++) {
            bindTypedKey(root, DIGITS.charAt(i));
        }
        for (int i = 0; i < OPERATORS.length(); i++) {
            bindTypedKey(root, OPERATORS.charAt(i));
        }
        for (int i = 0; i < PARENS.length(); i++) {
            bindTypedKey(root, PARENS.charAt(i));
        }
        bindTypedKey(root, '.');

        bindNamedKey(root, "ENTER", this::evaluateDisplay);
        bindNamedKey(root, "ESCAPE", this::clearDisplay);
        bindNamedKey(root, "BACK_SPACE", this::backspace);
    }

    private void bindTypedKey(JComponent root, char symbol) {
        bind(root, KeyStroke.getKeyStroke("typed " + symbol), "calculator.typed." + symbol,
                () -> appendToDisplay(String.valueOf(symbol)));
    }

    private void bindNamedKey(JComponent root, String vkName, Runnable action) {
        bind(root, KeyStroke.getKeyStroke("pressed " + vkName), "calculator.pressed." + vkName, action);
    }

    private void bind(JComponent root, KeyStroke keyStroke, String actionKey, Runnable action) {
        root.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW).put(keyStroke, actionKey);
        root.getActionMap().put(actionKey, new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                action.run();
            }
        });
    }
}
