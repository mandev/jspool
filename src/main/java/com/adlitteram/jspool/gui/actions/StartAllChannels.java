package com.adlitteram.jspool.gui.actions;

import com.adlitteram.jasmin.action.XAction;
import com.adlitteram.jspool.gui.MainFrame;
import java.awt.event.ActionEvent;
import javax.swing.JComponent;

public class StartAllChannels extends XAction {

    public StartAllChannels() {
        super("StartAllChannels");
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        MainFrame frame = (MainFrame) ((JComponent) e.getSource()).getClientProperty("REF_OBJECT");
        frame.getChannels().forEach(channel -> channel.start());
    }
}
