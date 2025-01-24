package com.adlitteram.jspool.gui.actions;

import static com.adlitteram.jspool.gui.ChannelDialog.OK;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.gui.ChannelDialog;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.Rectangle;
import java.awt.event.ActionEvent;
import java.util.List;
import javax.swing.JComponent;
import javax.swing.JTable;

public class NewChannel extends XAction {

  public NewChannel() {
    super("NewChannel");
  }

  @Override
  public void actionPerformed(ActionEvent e) {
    MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");

    JTable channelTable = frame.getChannelTable();
    Channel channel = new Channel(frame);
    ChannelDialog cp = new ChannelDialog(frame, channel);

    if (cp.showDialog() == OK) {
      List<Channel> channelList = frame.getChannels();
      channelList.add(channel);
      frame.channelModel.fireTableDataChanged();

      frame.addLogArea(channel);
      frame.showLogArea(channel);

      int index = channelList.size() - 1;
      channelTable.setRowSelectionInterval(index, index);
      channelTable.scrollRectToVisible(new Rectangle(channelTable.getCellRect(index, 0, true)));

      frame.saveConfig();
    }

    frame.repaint();
  }
}
