package com.adlitteram.jspool.gui.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.Rectangle;
import java.awt.event.ActionEvent;
import java.util.ArrayList;
import javax.swing.JComponent;
import javax.swing.JTable;

public class UpperChannel extends XAction {

    public UpperChannel() {
        super("UpperChannel");
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");

        JTable channelTable = frame.getChannelTable();
        int index = channelTable.getSelectedRow();
        ArrayList<Channel> channelList = frame.getChannels();

        if (index > 0 && index < channelList.size()) {
            Channel ch = channelList.remove(index);
            channelList.add(index - 1, ch);
            channelTable.setRowSelectionInterval(index - 1, index - 1);
            channelTable.scrollRectToVisible(new Rectangle(channelTable.getCellRect(index - 1, 0, true)));
            frame.channelModel.fireTableDataChanged();
            frame.saveConfig();
        }
    }
}
