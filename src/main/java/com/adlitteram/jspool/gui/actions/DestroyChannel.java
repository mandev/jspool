package com.adlitteram.jspool.gui.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.event.ActionEvent;
import java.util.ArrayList;
import javax.swing.JComponent;

public class DestroyChannel extends XAction {

    public DestroyChannel() {
        super("DestroyChannel");
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");

        int index = frame.getChannelTable().getSelectedRow();
        ArrayList<Channel> channelList = frame.getChannels();

        if (index >= 0 && index < channelList.size()) {
            Channel channel = channelList.get(index);
            channel.stop();
            channelList.remove(index);
            frame.channelModel.fireTableDataChanged();
            frame.removeLogArea(channel);
            frame.saveConfig();
        }
    }
}
