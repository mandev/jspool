/**
 * About.java
 * Copyright (C) 1999-2000 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller  */
package com.adlitteram.jspool.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.gui.LicenceFrame;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.event.ActionEvent;
import javax.swing.JComponent;

public class Licence extends XAction {

    public Licence() {
        super("Licence");
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");
        new LicenceFrame(frame);
        frame.repaint();
    }
}