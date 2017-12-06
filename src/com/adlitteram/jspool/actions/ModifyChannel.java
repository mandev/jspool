/**
 * ModifyChannel.java Copyright (C) 1999-2000 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller
 */
package com.adlitteram.jspool.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.gui.ChannelDialog;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.event.ActionEvent;
import java.util.ArrayList;
import javax.swing.JComponent;

public class ModifyChannel extends XAction {

    public ModifyChannel() {
        super("ModifyChannel");
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");

        int index = frame.getChannelTable().getSelectedRow();
        ArrayList<Channel> channelList = frame.getChannels();

        if (index >= 0 && index < channelList.size()) {
            Channel channel = channelList.get(index);
            channel.stop();

            ChannelDialog cp = new ChannelDialog(frame, channel);
            if (cp.showDialog() == ChannelDialog.OK) {
                frame.setLogTitle(channel);
                frame.channelModel.fireTableDataChanged();
                frame.saveConfig();
            }
        }
        frame.repaint();
    }
}
