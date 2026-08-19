package com.buildboard.calculator;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import org.junit.jupiter.api.Test;

/**
 * Tests-first contract for the application entry point (written before
 * {@code Main} exists: it fails while the class is absent and passes once
 * the entry point is implemented).
 *
 * <p>These tests deliberately never invoke {@code main(String[])}:
 * invoking it would open a Swing window and require a graphical display,
 * which would break the suite on headless build machines.
 */
class MainTest {

    @Test
    void mainClassIsLoadable() {
        assertDoesNotThrow(
                () -> Class.forName("com.buildboard.calculator.Main"),
                "com.buildboard.calculator.Main must exist and be loadable");
    }

    @Test
    void declaresPublicStaticVoidMainTakingStringArray() {
        Class<?> mainClass =
                assertDoesNotThrow(() -> Class.forName("com.buildboard.calculator.Main"));

        Method main =
                assertDoesNotThrow(
                        () -> mainClass.getDeclaredMethod("main", String[].class),
                        "Main must declare a main(String[]) method");

        assertTrue(Modifier.isPublic(main.getModifiers()), "main must be public");
        assertTrue(Modifier.isStatic(main.getModifiers()), "main must be static");
        assertEquals(void.class, main.getReturnType(), "main must return void");
    }
}
