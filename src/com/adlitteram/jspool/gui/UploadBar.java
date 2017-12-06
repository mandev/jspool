/**
 * UploadBar.java Copyright (C) 2002 Emmanuel Deviller
 *
 * @version 1.0
 * @author Emmanuel Deviller
 */
package com.adlitteram.jspool.gui;

import com.adlitteram.jspool.Channel;
import java.awt.Color;
import java.awt.Component;
import javax.swing.BoundedRangeModel;
import javax.swing.JProgressBar;
import javax.swing.JTable;
import javax.swing.UIManager;
import javax.swing.table.TableCellRenderer;

// A table cell renderer that displays a JProgressBar
class UploadBar extends JProgressBar implements TableCellRenderer {

    public UploadBar() {
        super();
    }

    public UploadBar(BoundedRangeModel newModel) {
        super(newModel);
    }

    public UploadBar(int orient) {
        super(orient);
    }

    public UploadBar(int min, int max) {
        super(min, max);
    }

    public UploadBar(int orient, int min, int max) {
        super(orient, min, max);
    }

    // UIManager shares the data with all instances !!!
    private void setSelectedBlack() {
        UIManager.put("ProgressBar.selectionBackground", Color.black);
        UIManager.put("ProgressBar.selectionForeground", Color.black);
//        UIManager.put("ProgressBar.foreground", Color.orange);
//        updateUI();
    }

    private void setSelectedWhite() {
//        UIManager.put("ProgressBar.selectionBackground", Color.white);
//        UIManager.put("ProgressBar.selectionForeground", Color.white);
//        UIManager.put("ProgressBar.foreground", Color.orange);
//        updateUI();
    }

    @Override
    public Component getTableCellRendererComponent(JTable table, Object value,
            boolean isSelected, boolean hasFocus, int row, int column) {

        Channel channel = (Channel) value;
        int val = 0;
        String text = channel.getTargetName();
//        UIManager.put("ProgressBar.selectionBackground", table.getForeground());
//        UIManager.put("ProgressBar.selectionForeground", table.getForeground());
//        updateUI();

        int status = channel.getStatus();
        switch (status) {
            case Channel.DISABLE:
            case Channel.STOP:
                setBackground(Color.WHITE);
                
//                if (isSelected) {
//                    setSelectedWhite();
//                    setBackground(table.getSelectionBackground());
//                }
//                else {
//                    setSelectedBlack();
//                    setBackground(table.getBackground());
//                }
                break;

            case Channel.FAILED:
                setBackground(Color.red);
                setSelectedBlack();
                break;

            case Channel.START:
            case Channel.ACTIVE:
                setBackground(Color.GREEN);
                setSelectedBlack();
                break;

            case Channel.RUN:
            case Channel.DOWN:
                setBackground(Color.green);
                setSelectedBlack();
                break;

            case Channel.UP:
                setBackground(Color.white);
                setSelectedBlack();
                val = channel.getProgress();
                text = val + " %";
        }

        setValue(val);
        setString(text);
        return this;
    }
}
