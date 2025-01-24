package com.adlitteram.jspool.sources;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jspool.files.FtpSourceFile;
import com.adlitteram.jspool.ftp.FtpConnexion;
import com.adlitteram.jspool.targets.AbstractTarget;
import com.enterprisedt.net.ftp.FTPException;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.io.IOException;
import javax.swing.*;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FtpSource extends AbstractSource {

  private static final Logger LOG = LoggerFactory.getLogger(FtpSource.class);

  public static final String FTP_SOURCE_SERVER = "FtpSource.Server";
  public static final String FTP_SOURCE_USER = "FtpSource.User";
  private static final String FTP_SOURCE_PASSWD = "FtpSource.Passwd";
  private static final String FTP_SOURCE_DIR = "FtpSource.Dir";
  private static final String FTP_SOURCE_MODE = "FtpSource.Mode";
  private static final String[] MODE_ARRAY = {"Passive", "Active"};

  private JTextField serverField;
  private JTextField userField;
  private JTextField dirField;
  private JPasswordField passwdField;
  private JComboBox<String> modeCombo;
  private FtpConnexion ftpConnexion;

  @Override
  public String getName() {
    return "Ftp";
  }

  @Override
  public void close() {
    super.close();
    if (ftpConnexion != null) {
      ftpConnexion.close();
      ftpConnexion = null;
    }
  }

  @Override
  public boolean run(AbstractTarget target) {

    try {
      if (ftpConnexion == null || !ftpConnexion.isConnected()) {
        ftpConnexion =
            new FtpConnexion(
                channel,
                channel.getStringProp(FTP_SOURCE_SERVER),
                channel.getStringProp(FTP_SOURCE_USER),
                channel.getStringProp(FTP_SOURCE_PASSWD),
                channel.getStringProp(FTP_SOURCE_DIR),
                channel.getIntProp(FTP_SOURCE_MODE, 0));

        ftpConnexion.connect();
      }

      String srcDir = FilenameUtils.normalize(channel.getStringProp(FTP_SOURCE_DIR));
      FtpSourceFile srcFile = new FtpSourceFile(ftpConnexion, channel.getStability());
      return processDir(srcDir, srcFile, target);
    } catch (IOException | FTPException e) {
      LOG.warn("FtpSource.run()", e);
      if (ftpConnexion != null) {
        ftpConnexion.close();
        ftpConnexion = null;
      }
      return false;
    }
  }

  @Override
  public JPanel buildPanel() {

    serverField = new JTextField(channel.getStringProp(FTP_SOURCE_SERVER), 15);
    userField = new JTextField(channel.getStringProp(FTP_SOURCE_USER), 15);
    passwdField = new JPasswordField(channel.getStringProp(FTP_SOURCE_PASSWD), 15);
    dirField = new JTextField(channel.getStringProp(FTP_SOURCE_DIR), 25);
    modeCombo = new JComboBox<>(MODE_ARRAY);
    modeCombo.setSelectedIndex(channel.getIntProp(FTP_SOURCE_MODE, 0));

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
    p0.add(dirField, c0.xy(4, 5, "lr"));
    p0.add(new JLabel(Message.get("ftpmove.transfer")), c0.xy(2, 6, "r"));
    p0.add(modeCombo, c0.xy(4, 6, "l"));
    return p0;
  }

  @Override
  public boolean setParameters() {
    channel.setProperty(FTP_SOURCE_SERVER, serverField.getText());
    channel.setProperty(FTP_SOURCE_USER, userField.getText());
    channel.setProperty(FTP_SOURCE_PASSWD, new String(passwdField.getPassword()));
    channel.setProperty(FTP_SOURCE_DIR, dirField.getText());
    channel.setProperty(FTP_SOURCE_MODE, modeCombo.getSelectedIndex());
    return true;
  }
}
