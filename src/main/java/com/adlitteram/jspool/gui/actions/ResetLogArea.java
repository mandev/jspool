package com.adlitteram.jspool.gui.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.event.ActionEvent;
import javax.swing.JComponent;

public class ResetLogArea extends XAction {

    public ResetLogArea() {
        super("ResetLogArea");
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");
        frame.resetLogArea();
    }
}
