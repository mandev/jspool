package com.adlitteram.jspool.gui.listeners;

import java.awt.Window;
import java.awt.event.KeyEvent;
import java.awt.event.KeyAdapter;

public class AbstractDisposer extends KeyAdapter {

    private final Window parent;

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
