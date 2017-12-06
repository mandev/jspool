/**
 * Quit.java
 * Copyright (C) 1999-2000 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller  */
package com.adlitteram.jspool.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.Main;
import java.awt.event.ActionEvent;

public class Quit extends XAction {

    public Quit() {
        super("Quit");
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        Main.getApplication().quit();
    }
}
