package com.buildboard.calculator;

import javax.swing.SwingUtilities;

/**
 * Application entry point for the e2e Calculator.
 *
 * <p>Launches {@link CalculatorWindow} on the Swing Event Dispatch Thread.
 * No domain or UI logic lives here.
 */
public class Main {

    /**
     * Starts the calculator application.
     *
     * @param args command-line arguments (ignored)
     */
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> new CalculatorWindow().setVisible(true));
    }
}
