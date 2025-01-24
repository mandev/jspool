package com.adlitteram.jspool.gui;

import com.adlitteram.jspool.Channel;
import java.awt.Color;
import java.awt.Component;
import javax.swing.BoundedRangeModel;
import javax.swing.JProgressBar;
import javax.swing.JTable;
import javax.swing.UIManager;
import javax.swing.table.TableCellRenderer;

class DownloadBar extends JProgressBar implements TableCellRenderer {

  public DownloadBar() {
    super();
  }

  public DownloadBar(BoundedRangeModel newModel) {
    super(newModel);
  }

  public DownloadBar(int orient) {
    super(orient);
  }

  public DownloadBar(int min, int max) {
    super(min, max);
  }

  public DownloadBar(int orient, int min, int max) {
    super(orient, min, max);
  }

  // UIManager shares the data with all instances !!!
  private void setSelectedBlack() {
    UIManager.put("ProgressBar.selectionBackground", Color.black);
    UIManager.put("ProgressBar.selectionForeground", Color.black);
    UIManager.put("ProgressBar.foreground", Color.orange);
    updateUI();
  }

  private void setSelectedWhite() {
    UIManager.put("ProgressBar.selectionBackground", Color.white);
    UIManager.put("ProgressBar.selectionForeground", Color.white);
    UIManager.put("ProgressBar.foreground", Color.orange);
    updateUI();
  }

  @Override
  public Component getTableCellRendererComponent(
      JTable table, Object value, boolean isSelected, boolean hasFocus, int row, int column) {

    Channel channel = (Channel) value;

    int val = 0;
    String text = channel.getSourceName();

    int status = channel.getStatus();

    switch (status) {
      case Channel.DISABLE:
      case Channel.STOP:
        if (isSelected) {
          setSelectedWhite();
          setBackground(table.getSelectionBackground());
        } else {
          setSelectedBlack();
          setBackground(table.getBackground());
        }
        break;

      case Channel.FAILED:
        setBackground(Color.red);
        setSelectedBlack();
        break;

      case Channel.START:
      case Channel.ACTIVE:
        setBackground(Color.green);
        setSelectedBlack();
        break;

      case Channel.RUN:
      case Channel.UP:
        setBackground(Color.orange);
        setSelectedBlack();
        break;

      case Channel.DOWN:
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
