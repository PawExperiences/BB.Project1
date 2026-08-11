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
import java.util.LinkedHashMap;
import java.util.Map;

import javax.swing.AbstractAction;
import javax.swing.Action;
import javax.swing.ActionMap;
import javax.swing.InputMap;
import javax.swing.JButton;
import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.KeyStroke;
import javax.swing.SwingConstants;

/**
 * Swing UI shell for the calculator. Builds the expression string shown in
 * the display from button clicks / key presses and delegates all evaluation
 * to {@link Evaluator}; carries no arithmetic or parsing logic itself.
 */
public class CalculatorWindow extends JFrame {

    private static final String APPENDABLE_CHARS = "0123456789.+-*/()";

    private static final String[][] BUTTON_ROWS = {
        {"(", ")", "C", "/"},
        {"7", "8", "9", "*"},
        {"4", "5", "6", "-"},
        {"1", "2", "3", "+"},
        {"0", ".", "="},
    };

    private final JTextField display;
    private final JPanel buttonPanel;
    private final Map<String, JButton> buttons = new LinkedHashMap<>();

    /** True once a result or an error is showing; the next append/backspace clears it first. */
    private boolean stale;

    public CalculatorWindow() {
        super("Calculator");

        display = new JTextField();
        display.setHorizontalAlignment(SwingConstants.RIGHT);
        display.setEditable(false);

        buttonPanel = buildButtonPanel();

        getContentPane().setLayout(new BorderLayout());
        getContentPane().add(display, BorderLayout.NORTH);
        getContentPane().add(buttonPanel, BorderLayout.CENTER);

        setSize(320, 420);
        setMinimumSize(new Dimension(320, 420));

        bindKeys();
    }

    private JPanel buildButtonPanel() {
        JPanel panel = new JPanel(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.fill = GridBagConstraints.BOTH;
        gbc.insets = new Insets(2, 2, 2, 2);
        gbc.weightx = 1;
        gbc.weighty = 1;

        for (int row = 0; row < BUTTON_ROWS.length; row++) {
            int col = 0;
            for (String label : BUTTON_ROWS[row]) {
                gbc.gridx = col;
                gbc.gridy = row;
                gbc.gridwidth = "0".equals(label) ? 2 : 1;
                panel.add(createButton(label), gbc);
                col += gbc.gridwidth;
            }
        }
        return panel;
    }

    private JButton createButton(String label) {
        JButton button = new JButton(label);
        if ("C".equals(label)) {
            button.addActionListener(e -> onClear());
        } else if ("=".equals(label)) {
            button.addActionListener(e -> onEquals());
        } else {
            button.addActionListener(e -> onAppend(label));
        }
        buttons.put(label, button);
        return button;
    }

    private void bindKeys() {
        InputMap inputMap = getRootPane().getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW);
        ActionMap actionMap = getRootPane().getActionMap();

        for (int i = 0; i < APPENDABLE_CHARS.length(); i++) {
            String key = String.valueOf(APPENDABLE_CHARS.charAt(i));
            register(inputMap, actionMap, KeyStroke.getKeyStroke(APPENDABLE_CHARS.charAt(i)), key,
                    onActionPerformed(e -> onAppend(key)));
        }
        register(inputMap, actionMap, KeyStroke.getKeyStroke(KeyEvent.VK_ENTER, 0), "=",
                onActionPerformed(e -> onEquals()));
        register(inputMap, actionMap, KeyStroke.getKeyStroke(KeyEvent.VK_ESCAPE, 0), "C",
                onActionPerformed(e -> onClear()));
        register(inputMap, actionMap, KeyStroke.getKeyStroke(KeyEvent.VK_BACK_SPACE, 0), "BACKSPACE",
                onActionPerformed(e -> onBackspace()));
    }

    private static void register(InputMap inputMap, ActionMap actionMap, KeyStroke keyStroke,
            String actionKey, Action action) {
        inputMap.put(keyStroke, actionKey);
        actionMap.put(actionKey, action);
    }

    private static Action onActionPerformed(java.util.function.Consumer<ActionEvent> handler) {
        return new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                handler.accept(e);
            }
        };
    }

    private void onAppend(String text) {
        if (stale) {
            display.setText("");
            stale = false;
        }
        display.setText(display.getText() + text);
    }

    private void onClear() {
        display.setText("");
        stale = false;
    }

    private void onEquals() {
        String expression = display.getText();
        try {
            double result = Evaluator.evaluate(expression);
            display.setText(formatResult(result));
        } catch (CalculationException e) {
            display.setText(e.getMessage());
        }
        stale = true;
    }

    private void onBackspace() {
        if (stale) {
            display.setText("");
            stale = false;
            return;
        }
        String text = display.getText();
        if (!text.isEmpty()) {
            display.setText(text.substring(0, text.length() - 1));
        }
    }

    private static String formatResult(double value) {
        BigDecimal rounded = BigDecimal.valueOf(value).round(new MathContext(10));
        return rounded.stripTrailingZeros().toPlainString();
    }

    JTextField getDisplayField() {
        return display;
    }

    JPanel getButtonPanel() {
        return buttonPanel;
    }

    JButton getButton(String label) {
        return buttons.get(label);
    }

    int getButtonCount() {
        return buttons.size();
    }
}
