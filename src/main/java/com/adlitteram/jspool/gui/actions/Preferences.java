package com.adlitteram.jspool.gui.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.gui.MainFrame;
import com.adlitteram.jspool.gui.PrefDialog;
import java.awt.event.ActionEvent;
import javax.swing.JComponent;

public class Preferences extends XAction {

    public Preferences() {
        super("Preferences");
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");
        new PrefDialog(frame);
        frame.repaint();
    }
}
