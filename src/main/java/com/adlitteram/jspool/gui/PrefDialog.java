package com.adlitteram.jspool.gui;

import com.adlitteram.jasmin.LocaleManager;
import com.adlitteram.jasmin.LookManager;
import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.property.XProp;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.event.ActionEvent;
import java.util.Locale;
import java.util.Objects;
import javax.swing.BorderFactory;
import javax.swing.BoxLayout;
import javax.swing.ButtonGroup;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComponent;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JRadioButton;
import javax.swing.JTabbedPane;
import javax.swing.JTextField;
import javax.swing.UIManager;
import javax.swing.WindowConstants;

public class PrefDialog extends JDialog {

  private JRadioButton enButton;
  private JRadioButton frButton;
  private JCheckBox useJDBCLogCheck;
  private JTextField driverField;
  private JTextField urlField;
  private JTextField userField;
  private JPasswordField passwordField;

  public PrefDialog(MainFrame parent) {
    super(parent, Message.get("chprefs.title"), true);
    setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);

    JPanel container = new JPanel(new BorderLayout());
    container.add(buildPanels(), BorderLayout.CENTER);
    container.add(buildButtonPanel(), BorderLayout.SOUTH);
    getContentPane().add(container);
    pack();
    setLocationRelativeTo(parent);
    setVisible(true);
  }

  private JComponent buildPanels() {
    JTabbedPane panel = new JTabbedPane();
    panel.addTab("Locale", buildLocalePanel());
    panel.addTab("look & feel", buildLookPanel());
    panel.addTab("Log", buildLogPanel());
    return panel;
  }

  private JPanel buildButtonPanel() {
    JButton okButton = new JButton(Message.get("general.ok.button"));
    okButton.addActionListener(
        (ActionEvent e) -> {
          String locale1 = "en";
          if (frButton.isSelected()) {
            locale1 = "fr";
          }
          LocaleManager.setUILocale(new Locale(locale1));
          XProp.put("Log.useJDBC", String.valueOf(useJDBCLogCheck.isSelected()));
          XProp.put("Log.JDBCDriver", driverField.getText());
          XProp.put("Log.JDBCUrl", urlField.getText());
          XProp.put("Log.JDBCUser", userField.getText());
          XProp.put("Log.JDBCPasswd", passwordField.getText());
          PrefDialog.this.dispose();
        });

    JButton cancelButton = new JButton(Message.get("general.cancel.button"));
    cancelButton.addActionListener(
        (ActionEvent e) -> {
          PrefDialog.this.dispose();
        });

    JPanel panel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
    panel.add(okButton);
    panel.add(cancelButton);
    return panel;
  }

  private JPanel buildLookPanel() {
    ButtonGroup group = new ButtonGroup();
    JPanel panel = new JPanel();
    panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
    panel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

    for (UIManager.LookAndFeelInfo info : UIManager.getInstalledLookAndFeels()) {
      JRadioButton button = new JRadioButton(info.getName());
      button.addActionListener(
          e -> {
            LookManager.setLookAndFeel(info.getClassName());
            LookManager.updateComponentUI();
          });
      button.setSelected(
          Objects.equals(UIManager.getLookAndFeel().getClass().getName(), info.getClassName()));
      group.add(button);
      panel.add(button);
    }
    return panel;
  }

  private JPanel buildLocalePanel() {
    enButton = new JRadioButton("English");
    frButton = new JRadioButton("Français");

    ButtonGroup group = new ButtonGroup();
    group.add(enButton);
    group.add(frButton);

    String locale = LocaleManager.getUILocale().toString();
    if ("fr".equals(locale)) {
      frButton.setSelected(true);
    } else {
      enButton.setSelected(true);
    }

    int[] w = {10, 0, 10};
    int[] h = {10, 0, 0, 0, 10};
    HIGLayout l = new HIGLayout(w, h);
    HIGConstraints c = new HIGConstraints();

    JPanel panel = new JPanel(l);
    panel.add(enButton, c.xy(2, 2));
    panel.add(frButton, c.xy(2, 3));
    return panel;
  }

  private JPanel buildLogPanel() {
    useJDBCLogCheck = new JCheckBox("Use JDBC Log");
    useJDBCLogCheck.setSelected(XProp.getBoolean("Log.useJDBC", false));

    driverField = new JTextField(25);
    driverField.setText(Message.get("Log.JDBCDriver"));

    urlField = new JTextField(25);
    urlField.setText(Message.get("Log.JDBCUrl"));

    userField = new JTextField(25);
    userField.setText(Message.get("Log.JDBCUser"));

    passwordField = new JPasswordField(25);
    passwordField.setText(Message.get("Log.JDBCPasswd"));

    int[] w = {10, 0, 5, 0, 10};
    int[] h = {10, 0, 5, 0, 0, 0, 0, 10};
    HIGLayout l = new HIGLayout(w, h);
    HIGConstraints c = new HIGConstraints();

    JPanel panel = new JPanel(l);
    panel.add(useJDBCLogCheck, c.xy(4, 2));

    panel.add(new JLabel("JDBC Driver"), c.xy(2, 4, "r"));
    panel.add(driverField, c.xy(4, 4));

    panel.add(new JLabel("DataBase URL"), c.xy(2, 5, "r"));
    panel.add(urlField, c.xy(4, 5));

    panel.add(new JLabel("User"), c.xy(2, 6, "r"));
    panel.add(userField, c.xy(4, 6));

    panel.add(new JLabel("Password"), c.xy(2, 7, "r"));
    panel.add(passwordField, c.xy(4, 7));

    return panel;
  }
}
