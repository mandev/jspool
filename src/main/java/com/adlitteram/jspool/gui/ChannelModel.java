package com.adlitteram.jspool.gui;

import com.adlitteram.jasmin.property.XProp;
import com.adlitteram.jspool.Channel;
import java.util.ArrayList;
import javax.swing.table.AbstractTableModel;

// Model of the tableView JTable
public class ChannelModel extends AbstractTableModel {

    final String[] names = {
        XProp.get("mainframe.datamodel.id"),
        XProp.get("mainframe.datamodel.source"),
        XProp.get("mainframe.datamodel.mode"),
        XProp.get("mainframe.datamodel.status")
    };
    MainFrame frame;

    public ChannelModel(MainFrame frame) {
        super();
        this.frame = frame;
    }

    public void updateChannel(Channel ch) {
        ArrayList channelList = frame.getChannels();
        int index = channelList.indexOf(ch);
        if (index != -1) {
            fireTableRowsUpdated(index, index);
        }
    }

    // Update Download
    public void updateDownBar(Channel ch) {
        ArrayList channelList = frame.getChannels();
        int index = channelList.indexOf(ch);
        if (index != -1) {
            fireTableCellUpdated(index, 1);
        }
    }

    // Update Upload
    public void updateUpBar(Channel ch) {
        ArrayList channelList = frame.getChannels();
        int index = channelList.indexOf(ch);
        if (index != -1) {
            fireTableCellUpdated(index, 2);
        }
    }

    @Override
    public int getColumnCount() {
        return names.length;
    }

    @Override
    public int getRowCount() {
        ArrayList channelList = frame.getChannels();
        return channelList.size();
    }

    @Override
    public Object getValueAt(int row, int col) {
        ArrayList<Channel> channelList = frame.getChannels();
        Channel ch = channelList.get(row);
        switch (col) {
            case 0:
                return ch.getID();
            case 1:
                return ch;
            case 2:
                return ch;
            case 3:
                int status = ch.getStatus();
                String str = MainFrame.statusArray[status];
                if (status == Channel.DOWN) {
                    str += " : " + ch.getDownloadFilename();
                }
                else if (status == Channel.UP) {
                    str += " : " + ch.getUploadFilename();
                }
                return str;
        }
        return null;
    }

    @Override
    public String getColumnName(int column) {
        return names[column];
    }

    @Override
    public Class getColumnClass(int col) {
        switch (col) {
            case 0:
                return String.class;
            case 1:
                return DownloadBar.class;
            case 2:
                return UploadBar.class;
            case 3:
                return String.class;
        }
        return null;
    }

    @Override
    public boolean isCellEditable(int row, int col) {
        return false;
    }

    @Override
    public void setValueAt(Object aValue, int row, int column) {
    }
}
