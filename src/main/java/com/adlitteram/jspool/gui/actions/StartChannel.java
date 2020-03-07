package com.adlitteram.jspool.gui.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.event.ActionEvent;
import java.util.ArrayList;
import javax.swing.JComponent;
import org.slf4j.Logger;
import static org.slf4j.LoggerFactory.getLogger;

public class StartChannel extends XAction {

    private static final Logger LOG = getLogger(StartChannel.class);

    public StartChannel() {
        super("StartChannel");
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");
        ArrayList<Channel> channelList = frame.getChannels();
        int index = frame.getChannelTable().getSelectedRow();
        if (index >= 0 && index < channelList.size()) {
            Channel ch = channelList.get(index);
            ch.start();
        }
    }
}
