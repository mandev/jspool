/**
 * ResetLogArea.java
 * Copyright (C) 1999-2000 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller  */
package com.adlitteram.jspool.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.event.ActionEvent;
import java.util.ArrayList;
import javax.swing.JComponent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ShowLogArea extends XAction {

    private static final Logger logger = LoggerFactory.getLogger(ShowLogArea.class);
    //
    public ShowLogArea() {
        super("ShowLogArea");
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");
        
        ArrayList<Channel> channelList = frame.getChannels();
        int index = frame.getChannelTable().getSelectedRow();
        if (index >= 0 && index < channelList.size()) {
            Channel ch = channelList.get(index);
            frame.showLogArea(ch);
        }
    }
}