package com.buildboard.calculator;

import javax.swing.SwingUtilities;

/** Application entry point; launches {@link CalculatorWindow} on the Event Dispatch Thread. */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            CalculatorWindow window = new CalculatorWindow();
            window.setVisible(true);
        });
    }
}
