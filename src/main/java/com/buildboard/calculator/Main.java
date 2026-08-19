package com.buildboard.calculator;

import javax.swing.SwingUtilities;

/**
 * Application entry point.
 *
 * <p>Swing components must be created and shown on the event dispatch
 * thread (EDT), so the whole startup runs inside {@link
 * SwingUtilities#invokeLater(Runnable)}: it builds a {@link
 * CalculatorWindow} and makes it visible.
 */
public final class Main {

    private Main() {
        // Entry-point holder only; not meant to be instantiated.
    }

    /**
     * Creates and shows the calculator window on the Swing event dispatch
     * thread.
     *
     * @param args command-line arguments (unused)
     */
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            CalculatorWindow window = new CalculatorWindow();
            window.setVisible(true);
        });
    }
}
