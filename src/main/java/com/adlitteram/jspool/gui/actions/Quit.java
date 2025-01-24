package com.adlitteram.jspool.gui.actions;

import static com.adlitteram.jspool.Main.getApplication;

import com.adlitteram.jasmin.action.XAction;
import java.awt.event.ActionEvent;

public class Quit extends XAction {

  public Quit() {
    super("Quit");
  }

  @Override
  public void actionPerformed(ActionEvent e) {
    getApplication().quit();
  }
}
