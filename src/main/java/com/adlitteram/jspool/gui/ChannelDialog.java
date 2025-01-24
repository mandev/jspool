package com.adlitteram.jspool.gui;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.gui.listeners.AbstractDisposer;
import com.adlitteram.jspool.sources.AbstractSource;
import com.adlitteram.jspool.targets.AbstractTarget;
import com.adlitteram.jspool.utils.Utils;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.BorderLayout;
import java.awt.CardLayout;
import java.awt.FlowLayout;
import java.awt.event.ActionEvent;
import javax.swing.BorderFactory;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.border.TitledBorder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ChannelDialog extends JDialog {

  private static final Logger LOG = LoggerFactory.getLogger(ChannelDialog.class);

  public static final int OK = 0;
  public static final int CANCEL = 1;
  private final Channel channel;
  private final JTextField identField;
  private final JTextField tempoField;
  private final JTextField stabiField;
  private final JTextField filterField;
  private final JTextField maxField;
  private final JTextField delSubDirField;
  private final JCheckBox recCheck;
  private final JCheckBox zeroCheck;
  private final JCheckBox autostartCheck;
  private JComboBox<String> modeCombo;
  private JComboBox<String> srcCombo;
  private int exit = CANCEL;

  public ChannelDialog(MainFrame frame, Channel channel) {
    super(frame, Message.get("channel.title"), true);

    this.channel = channel;
    channel.stop();
    setDefaultCloseOperation(DISPOSE_ON_CLOSE);
    addKeyListener(new AbstractDisposer(this));

    identField = new JTextField(channel.getID(), 30);
    filterField = new JTextField(channel.getStringProp(Channel.FILTER), 25);
    tempoField = new JTextField(channel.getStringProp(Channel.TEMPO), 5);
    stabiField = new JTextField(channel.getStringProp(Channel.STABILITY), 5);
    maxField = new JTextField(channel.getStringProp(Channel.MAXFILES, "0"), 5);
    delSubDirField = new JTextField(channel.getStringProp(Channel.DELSUBDIRDELAY, "0"), 5);

    zeroCheck = new JCheckBox(Message.get("channel.message2"), channel.zeroLength());
    autostartCheck = new JCheckBox(Message.get("channel.message3"), channel.autoStart());

    recCheck = new JCheckBox(Message.get("channel.message1"), channel.listSubDir());
    recCheck.addActionListener(e -> delSubDirField.setEnabled(recCheck.isSelected()));

    delSubDirField.setEnabled(recCheck.isSelected());

    getContentPane().add(buildPropertiesPanel(), BorderLayout.NORTH);
    getContentPane().add(buildButtonPanel(), BorderLayout.SOUTH);

    pack();
    setLocationRelativeTo(frame);
  }

  public int showDialog() {
    setVisible(true);
    return exit;
  }

  final JPanel buildButtonPanel() {
    JButton cancel = new JButton(Message.get("general.cancel.button"));
    cancel.addActionListener(e -> cancelPressed());

    JButton ok = new JButton(Message.get("general.ok.button"));
    getRootPane().setDefaultButton(ok);
    ok.addActionListener(e -> OKPressed());

    int[] w = {5, 0, -5, 5, -3, 6};
    int[] h = {10, 0, 10};
    HIGLayout l = new HIGLayout(w, h);
    HIGConstraints c = new HIGConstraints();
    l.setColumnWeight(2, 1);

    JPanel panel = new JPanel(l);
    panel.add(ok, c.xy(3, 2));
    panel.add(cancel, c.xy(5, 2));
    return panel;
  }

  final JPanel buildPropertiesPanel() {
    int[] w = {5, 0, 5};
    int[] h = {5, 0, 10, 0, 10, 0};
    HIGLayout l = new HIGLayout(w, h);
    HIGConstraints c = new HIGConstraints();

    JPanel panel = new JPanel(l);
    panel.add(buildGenPanel(), c.xy(2, 2));
    panel.add(buildSrcPanel(), c.xy(2, 4));
    panel.add(buildModePanel(), c.xy(2, 6));
    return panel;
  }

  JPanel buildGenPanel() {

    JPanel p1 = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
    p1.add(filterField);
    p1.add(new JLabel(" " + Message.get("channel.regexp")));

    JPanel p2 = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
    p2.add(tempoField);
    p2.add(new JLabel(" " + Message.get("channel.secondes")));

    JPanel p3 = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
    p3.add(stabiField);
    p3.add(new JLabel(" " + Message.get("channel.periods")));

    JPanel p4 = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
    p4.add(maxField);
    p4.add(new JLabel(" " + Message.get("channel.zerofiles")));

    JPanel p5 = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
    p5.add(delSubDirField);
    p5.add(new JLabel(" " + Message.get("channel.secondes")));

    int[] w = {5, 0, 5, 0, 5};
    int[] h = {5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
    HIGLayout l = new HIGLayout(w, h);
    HIGConstraints c = new HIGConstraints();
    l.setColumnWeight(4, 1);

    JPanel panel = new JPanel(l);
    panel.add(new JLabel(Message.get("channel.name")), c.xy(2, 2, "r"));
    panel.add(identField, c.xy(4, 2, "lr"));

    panel.add(new JLabel(Message.get("channel.filter")), c.xy(2, 3, "r"));
    panel.add(p1, c.xy(4, 3, "l"));

    panel.add(new JLabel(Message.get("channel.tempo")), c.xy(2, 4, "r"));
    panel.add(p2, c.xy(4, 4, "l"));

    panel.add(new JLabel(Message.get("channel.stability")), c.xy(2, 5, "r"));
    panel.add(p3, c.xy(4, 5, "l"));

    panel.add(new JLabel(Message.get("channel.maxfiles")), c.xy(2, 6, "r"));
    panel.add(p4, c.xy(4, 6, "l"));

    panel.add(new JLabel(Message.get("channel.delsubdirdelay")), c.xy(2, 7, "r"));
    panel.add(p5, c.xy(4, 7, "l"));

    panel.add(recCheck, c.xy(4, 8, "l"));
    panel.add(zeroCheck, c.xy(4, 9, "l"));
    panel.add(autostartCheck, c.xy(4, 10, "l"));

    return panel;
  }

  JPanel buildSrcPanel() {

    srcCombo = new JComboBox<>();

    JPanel srcPanel = new JPanel(new CardLayout());
    for (AbstractSource sh : channel.srcHandlers) {
      srcPanel.add(sh.buildPanel(), sh.getName());
      srcCombo.addItem(sh.getName());
    }

    srcCombo.addActionListener(
        (ActionEvent e) -> {
          CardLayout cl = (CardLayout) srcPanel.getLayout();
          cl.show(srcPanel, (String) srcCombo.getSelectedItem());
        });

    srcCombo.setSelectedItem(channel.getSourceName());

    JPanel p0 = new JPanel();
    p0.add(new JLabel(Message.get("source.type")));
    p0.add(srcCombo);

    JPanel panel = new JPanel();
    panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
    panel.setBorder(
        new TitledBorder(BorderFactory.createEtchedBorder(), Message.get("source.input")));
    panel.add(p0);
    panel.add(srcPanel);
    return panel;
  }

  JPanel buildModePanel() {

    modeCombo = new JComboBox<>();

    JPanel modePanel = new JPanel(new CardLayout());
    for (AbstractTarget sh : channel.trgHandlers) {
      modePanel.add(sh.buildPanel(this), sh.getName());
      modeCombo.addItem(sh.getName());
    }

    modeCombo.addActionListener(
        (ActionEvent e) -> {
          CardLayout cl = (CardLayout) modePanel.getLayout();
          cl.show(modePanel, (String) modeCombo.getSelectedItem());
        });

    modeCombo.setSelectedItem(channel.getTargetName());

    JPanel p0 = new JPanel();
    p0.setLayout(new BoxLayout(p0, BoxLayout.Y_AXIS));
    p0.setBorder(
        new TitledBorder(BorderFactory.createEtchedBorder(), Message.get("target.output")));

    JPanel p1 = new JPanel();
    p1.add(new JLabel(Message.get("target.type")));
    p1.add(modeCombo);
    p0.add(p1);
    p0.add(modePanel);
    return p0;
  }

  public void OKPressed() {

    if (identField.getText().length() < 2) {
      Utils.beep();
      LOG.info("{} - {}", channel.getStringProp(Channel.ID), Message.get("channel.warning1"));
      return;
    }

    try {
      if (Float.parseFloat(tempoField.getText()) < 0.01) {
        Utils.beep();
        LOG.info("{} - {}", channel.getStringProp(Channel.ID), Message.get("channel.warning3"));
        return;
      }
      channel.setProperty(Channel.TEMPO, tempoField.getText());
    } catch (NumberFormatException e1) {
      Utils.beep();
      LOG.info("{} - {}", channel.getStringProp(Channel.ID), Message.get("channel.warning4"));
      return;
    }

    try {
      if (Integer.parseInt(stabiField.getText()) < 0) {
        Utils.beep();
        LOG.info("{} - {}", channel.getStringProp(Channel.ID), Message.get("channel.warning5"));
        return;
      }
      channel.setProperty(Channel.STABILITY, stabiField.getText());
    } catch (NumberFormatException e2) {
      Utils.beep();
      LOG.info("{} - {}", channel.getStringProp(Channel.ID), Message.get("channel.warning6"));
      return;
    }

    try {
      if (Integer.parseInt(maxField.getText()) < 0) {
        Utils.beep();
        LOG.info("{} - {}", channel.getStringProp(Channel.ID), Message.get("channel.warning7"));
        return;
      }
      channel.setProperty(Channel.MAXFILES, maxField.getText());
    } catch (NumberFormatException e2) {
      Utils.beep();
      LOG.info("{} - {}", channel.getStringProp(Channel.ID), Message.get("channel.warning8"));
      return;
    }

    try {
      if (Long.parseLong(delSubDirField.getText()) < 0) {
        Utils.beep();
        LOG.info("{} - {}", channel.getStringProp(Channel.ID), Message.get("channel.warning9"));
        return;
      }
      channel.setProperty(Channel.DELSUBDIRDELAY, delSubDirField.getText());
    } catch (NumberFormatException e2) {
      Utils.beep();
      LOG.info("{} - {}", channel.getStringProp(Channel.ID), Message.get("channel.warning10"));
      return;
    }

    channel.setProperty(Channel.FILTER, filterField.getText());
    if (!channel.setRegexp()) {
      Utils.beep();
    }

    channel.setProperty(Channel.ID, identField.getText());
    channel.setProperty(Channel.AUTOSTART, String.valueOf(autostartCheck.isSelected()));
    channel.setProperty(Channel.SUBDIR, String.valueOf(recCheck.isSelected()));
    channel.setProperty(Channel.ZERO, String.valueOf(zeroCheck.isSelected()));

    int sourceIndex = srcCombo.getSelectedIndex();
    int targetIndex = modeCombo.getSelectedIndex();
    channel.setProperty(Channel.SRCMODE, String.valueOf(sourceIndex));
    channel.setProperty(Channel.TRGMODE, String.valueOf(targetIndex));
    channel.setProperty(Channel.SRCCLASS, channel.getSrcHandlerName(sourceIndex));
    channel.setProperty(Channel.TRGCLASS, channel.getTrgHandlerName(targetIndex));

    for (AbstractSource sh : channel.srcHandlers) {
      if (!sh.setParameters()) {
        return;
      }
    }

    for (AbstractTarget th : channel.trgHandlers) {
      if (!th.setParameters()) {
        return;
      }
    }

    dispose();
    exit = OK;
  }

  public void cancelPressed() {
    dispose();
  }
}
