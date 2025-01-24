package com.adlitteram.jspool.gui.actions;

import static com.adlitteram.jspool.gui.ChannelDialog.OK;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.gui.ChannelDialog;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.event.ActionEvent;
import java.util.List;
import javax.swing.JComponent;

public class ModifyChannel extends XAction {

  public ModifyChannel() {
    super("ModifyChannel");
  }

  @Override
  public void actionPerformed(ActionEvent e) {
    MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");

    int index = frame.getChannelTable().getSelectedRow();
    List<Channel> channelList = frame.getChannels();

    if (index >= 0 && index < channelList.size()) {
      Channel channel = channelList.get(index);
      channel.stop();

      ChannelDialog cp = new ChannelDialog(frame, channel);
      if (cp.showDialog() == OK) {
        frame.setLogTitle(channel);
        frame.channelModel.fireTableDataChanged();
        frame.saveConfig();
      }
    }
    frame.repaint();
  }
}
