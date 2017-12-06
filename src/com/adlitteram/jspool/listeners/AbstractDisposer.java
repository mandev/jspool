package com.adlitteram.jspool.listeners;

import java.awt.Window;
import java.awt.event.KeyEvent;
import java.awt.event.KeyAdapter;

public class AbstractDisposer extends KeyAdapter {

    // private members

    private final Window parent;

    /**
     * Creates a new KeyListener which register a specified Window. Normally,
     * this window should register this class as one of its key listeners.
     *
     * @param parent
     */
    public AbstractDisposer(Window parent) {
        this.parent = parent;
    }

    @Override
    public void keyPressed(KeyEvent evt) {
        switch (evt.getKeyCode()) {
            case KeyEvent.VK_ESCAPE:
                parent.dispose();
                evt.consume();
                break;
        }
    }
}

// End of AbstractDisposer.java
