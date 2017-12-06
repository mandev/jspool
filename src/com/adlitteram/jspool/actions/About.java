/**
 * About.java
 * Copyright (C) 1999-2000 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller  */
package com.adlitteram.jspool.actions;

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
};
