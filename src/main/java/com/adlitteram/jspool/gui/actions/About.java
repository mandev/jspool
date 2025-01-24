package com.adlitteram.jspool.gui.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.gui.AboutDialog;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.event.ActionEvent;
import javax.swing.JComponent;

public class About extends XAction {

  public About() {
    super("About");
  }

  @Override
  public void actionPerformed(ActionEvent e) {
    MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");
    AboutDialog aboutDialog = new AboutDialog(frame);
    aboutDialog.setVisible(true);
  }
}
