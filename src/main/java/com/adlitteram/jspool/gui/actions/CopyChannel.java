package com.adlitteram.jspool.gui.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.Channel;
import static com.adlitteram.jspool.Channel.ID;
import com.adlitteram.jspool.gui.ChannelDialog;
import static com.adlitteram.jspool.gui.ChannelDialog.OK;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.Rectangle;
import java.awt.event.ActionEvent;
import java.util.ArrayList;
import javax.swing.JComponent;
import javax.swing.JTable;

public class CopyChannel extends XAction {

    public CopyChannel() {
        super("CopyChannel");
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");

        JTable channelTable = frame.getChannelTable();
        int index = channelTable.getSelectedRow();
        ArrayList<Channel> channelList = frame.getChannels();

        if (index >= 0 && index < channelList.size()) {

            Channel oldChannel = channelList.get(index);
            Channel channel = new Channel(frame, oldChannel.getProperties());
            channel.setProperty(ID, channel.getID() + " Copie");

            ChannelDialog cp = new ChannelDialog(frame, channel);
            if (cp.showDialog() == OK) {
                channelList.add(index + 1, channel);
                frame.channelModel.fireTableDataChanged();

                frame.addLogArea(channel);
                frame.showLogArea(channel);

                channelTable.setRowSelectionInterval(index + 1, index + 1);
                channelTable.scrollRectToVisible(new Rectangle(channelTable.getCellRect(index + 1, 0, true)));

                frame.saveConfig();
            }
        }

        frame.repaint();
    }
}
