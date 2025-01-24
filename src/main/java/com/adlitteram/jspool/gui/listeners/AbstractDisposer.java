package com.adlitteram.jspool.gui.listeners;

import java.awt.Window;
import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;

public class AbstractDisposer extends KeyAdapter {

  private final Window parent;

  public AbstractDisposer(Window parent) {
    this.parent = parent;
  }

  @Override
  public void keyPressed(KeyEvent evt) {
    if (evt.getKeyCode() == KeyEvent.VK_ESCAPE) {
      parent.dispose();
      evt.consume();
    }
  }
}
