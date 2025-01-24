package com.adlitteram.jspool.sources;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jspool.files.MailSourceFile;
import com.adlitteram.jspool.mail.MailConnexion;
import com.adlitteram.jspool.targets.AbstractTarget;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MailSource extends AbstractSource {

  private static final Logger LOG = LoggerFactory.getLogger(MailSource.class);

  public static final String MAIL_SOURCE_SERVER = "MailSource.Server";
  public static final String MAIL_SOURCE_USER = "MailSource.User";
  public static final String MAIL_SOURCE_PASSWD = "MailSource.Passwd";
  public static final String MAIL_SOURCE_FOLDER = "MailSource.Folder";
  public static final String MAIL_SOURCE_MODE = "MailSource.Mode";
  protected static final String[] MODE_ARRAY = {"pop3", "imap"};

  private JTextField serverField;
  private JTextField userField;
  private JTextField folderField;
  private JPasswordField passwdField;
  private JComboBox<String> modeCombo;
  private MailConnexion mailConnexion;

  @Override
  public String getName() {
    return "Mail";
  }

  @Override
  public void close() {
    super.close();
    if (mailConnexion != null) {
      mailConnexion.close();
      mailConnexion = null;
    }
  }

  @Override
  public boolean run(AbstractTarget target) {
    boolean status;
    try {
      if (mailConnexion == null || !mailConnexion.isConnected()) {
        mailConnexion =
            new MailConnexion(
                channel.getStringProp(MAIL_SOURCE_SERVER),
                channel.getStringProp(MAIL_SOURCE_USER),
                channel.getStringProp(MAIL_SOURCE_PASSWD),
                channel.getStringProp(MAIL_SOURCE_FOLDER),
                MODE_ARRAY[channel.getIntProp(MAIL_SOURCE_MODE, 0)]);

        mailConnexion.connect();
      }

      MailSourceFile srcFile = new MailSourceFile(mailConnexion);
      status = processDir(srcFile, target);
      mailConnexion.flush(); // We need to flush the connexion in order to purge the folder
      if ("pop3".equals(mailConnexion.getMode())) {
        mailConnexion.close();
      }
    } catch (Exception e) {
      LOG.warn("MailSource.run()", e);
      if (mailConnexion != null) {
        mailConnexion.close();
        mailConnexion = null;
      }
      status = false;
    }

    return status;
  }

  @Override
  public JPanel buildPanel() {

    serverField = new JTextField(channel.getStringProp(MAIL_SOURCE_SERVER), 25);
    userField = new JTextField(channel.getStringProp(MAIL_SOURCE_USER), 15);
    passwdField = new JPasswordField(channel.getStringProp(MAIL_SOURCE_PASSWD), 15);
    folderField = new JTextField(channel.getStringProp(MAIL_SOURCE_FOLDER), 25);
    modeCombo = new JComboBox<>(MODE_ARRAY);
    modeCombo.setSelectedIndex(channel.getIntProp(MAIL_SOURCE_MODE, 0));

    int[] w0 = {5, 0, 5, 0, 5};
    int[] h0 = {5, 0, 0, 0, 0, 0, 5};
    HIGConstraints c0 = new HIGConstraints();
    HIGLayout l0 = new HIGLayout(w0, h0);
    l0.setColumnWeight(4, 1);
    JPanel p0 = new JPanel(l0);
    p0.add(new JLabel(Message.get("ftpmove.server")), c0.xy(2, 2, "r"));
    p0.add(serverField, c0.xy(4, 2, "l"));
    p0.add(new JLabel(Message.get("ftpmove.user")), c0.xy(2, 3, "r"));
    p0.add(userField, c0.xy(4, 3, "l"));
    p0.add(new JLabel(Message.get("ftpmove.passwd")), c0.xy(2, 4, "r"));
    p0.add(passwdField, c0.xy(4, 4, "l"));
    p0.add(new JLabel(Message.get("ftpmove.srcdir")), c0.xy(2, 5, "r"));
    p0.add(folderField, c0.xy(4, 5, "l"));
    p0.add(new JLabel(Message.get("ftpmove.transfer")), c0.xy(2, 6, "r"));
    p0.add(modeCombo, c0.xy(4, 6, "l"));
    return p0;
  }

  @Override
  public boolean setParameters() {
    channel.setProperty(MAIL_SOURCE_SERVER, serverField.getText());
    channel.setProperty(MAIL_SOURCE_USER, userField.getText());
    channel.setProperty(MAIL_SOURCE_PASSWD, new String(passwdField.getPassword()));
    channel.setProperty(MAIL_SOURCE_FOLDER, folderField.getText());
    channel.setProperty(MAIL_SOURCE_MODE, modeCombo.getSelectedIndex());
    return true;
  }
}
