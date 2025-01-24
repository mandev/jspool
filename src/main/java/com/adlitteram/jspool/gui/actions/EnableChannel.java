package com.adlitteram.jspool.gui.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.event.ActionEvent;
import java.util.List;
import javax.swing.JComponent;

public class EnableChannel extends XAction {

  public EnableChannel() {
    super("EnableChannel");
  }

  @Override
  public void actionPerformed(ActionEvent e) {
    MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");

    List<Channel> channelList = frame.getChannels();
    int index = frame.getChannelTable().getSelectedRow();
    if (index >= 0 && index < channelList.size()) {
      Channel ch = channelList.get(index);
      ch.enable();
    }
  }
}
