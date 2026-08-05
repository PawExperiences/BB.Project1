package com.buildboard.calculator;

import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.math.BigDecimal;

/**
 * Swing JFrame that provides the complete visual and interactive calculator
 * interface. All arithmetic is delegated to {@link Evaluator#evaluate(String)}.
 * This class contains no arithmetic or expression-parsing logic.
 *
 * <p>No {@code main} method is present in this class.
 */
public class CalculatorWindow extends JFrame {

    private final JTextField display;

    /**
     * Flag that is set to {@code true} after a {@link CalculationException} so
     * that the very next character input clears the error message before
     * appending the new character.
     */
    private boolean errorState = false;

    /**
     * Constructs the calculator window.
     * Title: {@code "Calculator"}, size: 320 × 420 px, not resizable.
     */
    public CalculatorWindow() {
        super("Calculator");

        setSize(320, 420);
        setMinimumSize(new Dimension(320, 420));
        setResizable(false);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLayout(new BorderLayout(4, 4));

        // ------------------------------------------------------------------
        // Display
        // ------------------------------------------------------------------
        display = new JTextField("");
        display.setHorizontalAlignment(JTextField.RIGHT);
        display.setEditable(false);
        display.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 22));
        display.setFocusable(false);
        add(display, BorderLayout.NORTH);

        // ------------------------------------------------------------------
        // Button grid
        // ------------------------------------------------------------------
        JPanel buttonPanel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.fill = GridBagConstraints.BOTH;
        gbc.insets = new Insets(2, 2, 2, 2);
        gbc.weightx = 1.0;
        gbc.weighty = 1.0;

        // Layout definition: each entry is {label, gridx, gridy, gridwidth}
        String[][] buttons = {
            {"(",  "0", "0", "1"},
            {")",  "1", "0", "1"},
            {"C",  "2", "0", "1"},
            {"/",  "3", "0", "1"},

            {"7",  "0", "1", "1"},
            {"8",  "1", "1", "1"},
            {"9",  "2", "1", "1"},
            {"*",  "3", "1", "1"},

            {"4",  "0", "2", "1"},
            {"5",  "1", "2", "1"},
            {"6",  "2", "2", "1"},
            {"-",  "3", "2", "1"},

            {"1",  "0", "3", "1"},
            {"2",  "1", "3", "1"},
            {"3",  "2", "3", "1"},
            {"+",  "3", "3", "1"},

            {"0",  "0", "4", "2"},
            {".",  "2", "4", "1"},
            {"=",  "3", "4", "1"},
        };

        for (String[] def : buttons) {
            String label = def[0];
            int gridx     = Integer.parseInt(def[1]);
            int gridy     = Integer.parseInt(def[2]);
            int gridwidth = Integer.parseInt(def[3]);

            JButton btn = new JButton(label);
            btn.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 16));

            gbc.gridx     = gridx;
            gbc.gridy     = gridy;
            gbc.gridwidth = gridwidth;

            btn.addActionListener(e -> handleInput(label));
            buttonPanel.add(btn, gbc);
        }

        add(buttonPanel, BorderLayout.CENTER);

        // ------------------------------------------------------------------
        // Keyboard handling — attached to the frame so it always fires
        // ------------------------------------------------------------------
        addKeyListener(new KeyAdapter() {
            @Override
            public void keyPressed(KeyEvent e) {
                int code = e.getKeyCode();
                char ch  = e.getKeyChar();

                if (code == KeyEvent.VK_ENTER) {
                    handleInput("=");
                } else if (code == KeyEvent.VK_ESCAPE) {
                    handleInput("C");
                } else if (code == KeyEvent.VK_BACK_SPACE) {
                    handleBackspace();
                } else if (isAllowedChar(ch)) {
                    handleInput(String.valueOf(ch));
                }
            }
        });

        // Ensure the frame (not any child) receives key events
        setFocusable(true);
        requestFocusInWindow();
    }

    // -----------------------------------------------------------------------
    // Input handling
    // -----------------------------------------------------------------------

    /**
     * Central dispatcher for all button/key inputs except Backspace.
     *
     * @param input the label of the button pressed (e.g. {@code "3"}, {@code "+"}, {@code "C"}, {@code "="})
     */
    private void handleInput(String input) {
        switch (input) {
            case "C" -> {
                errorState = false;
                display.setText("");
            }
            case "=" -> evaluate();
            default -> {
                // Any other character: if we are in error state, clear first
                if (errorState) {
                    errorState = false;
                    display.setText("");
                }
                display.setText(display.getText() + input);
            }
        }
    }

    /**
     * Removes the last character from the display, or does nothing if already empty.
     * If in error state, clears the display instead (acts like C).
     */
    private void handleBackspace() {
        if (errorState) {
            errorState = false;
            display.setText("");
            return;
        }
        String current = display.getText();
        if (!current.isEmpty()) {
            display.setText(current.substring(0, current.length() - 1));
        }
    }

    /**
     * Evaluates the current display expression via {@link Evaluator#evaluate(String)}.
     * On success, replaces the display with the formatted result.
     * On {@link CalculationException}, shows the error message and enters error state.
     */
    private void evaluate() {
        errorState = false;
        String expression = display.getText();
        try {
            double result = Evaluator.evaluate(expression);
            display.setText(formatResult(result));
        } catch (CalculationException ex) {
            display.setText(ex.getMessage());
            errorState = true;
        }
    }

    // -----------------------------------------------------------------------
    // Result formatting
    // -----------------------------------------------------------------------

    /**
     * Formats a {@code double} result with up to 10 significant digits and no
     * trailing zeros.
     *
     * @param value the numeric result to format
     * @return a plain-string representation with no trailing zeros
     */
    private static String formatResult(double value) {
        // Use BigDecimal for reliable stripping of trailing zeros.
        // MathContext(10) rounds to 10 significant digits.
        BigDecimal bd = new BigDecimal(value)
                .round(new java.math.MathContext(10))
                .stripTrailingZeros();
        return bd.toPlainString();
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Returns {@code true} if the character is one that should be appended to
     * the display (digits, operators, parentheses, decimal point).
     */
    private static boolean isAllowedChar(char ch) {
        return Character.isDigit(ch)
                || ch == '.'
                || ch == '+'
                || ch == '-'
                || ch == '*'
                || ch == '/'
                || ch == '('
                || ch == ')';
    }
}
