package com.adlitteram.jspool.targets;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.files.SourceFile;
import com.adlitteram.jspool.ftp.FtpConnexion;
import com.adlitteram.jspool.utils.FilenameCleaner;
import com.enterprisedt.net.ftp.FTPException;
import com.enterprisedt.net.ftp.FTPTransferCancelledException;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.Dialog;
import java.awt.FlowLayout;
import java.io.File;
import java.io.IOException;
import java.util.Random;
import javax.swing.BorderFactory;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FtpMove extends AbstractTarget {

  private static final Logger LOG = LoggerFactory.getLogger(FtpMove.class);

  public static final String FTP_TARGET_SERVER = "FtpTarget.Server";
  public static final String FTP_TARGET_USER = "FtpTarget.User";
  public static final String FTP_TARGET_PASSWD = "FtpTarget.Passwd";
  public static final String FTP_TARGET_DIR = "FtpTarget.Dir";
  public static final String FTP_TARGET_MODE = "FtpTarget.Mode";
  public static final String FTP_TARGET_SUB_DIR = "FtpTarget.SubDir";
  public static final String FTP_TARGET_CLEAN_CHAR = "FtpTarget.CleanChar";
  public static final String FTP_TARGET_CLEAN_SPACE = "FtpTarget.CleanSpace";
  public static final String FTP_TARGET_TEMP_EXT = "FtpTarget.TempExt";
  public static final String FTP_TARGET_REPLACE_CHAR = "FtpTarget.ReplaceChar";
  public static final String FTP_TARGET_DESTINATION_CHAR = "FtpTarget.DestinationChar";

  protected static final String[] MODES = {"Passive", "Active"};

  private JTextField serverField;
  private JTextField userField;
  private JPasswordField passwdField;
  private JTextField dirField;
  private JTextField extField;
  private JComboBox<String> modeCombo;
  private JCheckBox subDirCheck;
  private JCheckBox cleanCharCheck;
  private JCheckBox cleanSpaceCheck;
  private JTextField replaceField;
  private JTextField destinationField;
  private FtpConnexion ftpConnex;

  @Override
  public String getName() {
    return "Ftp";
  }

  @Override
  public void close() {
    if (ftpConnex != null) {
      ftpConnex.close();
      ftpConnex = null;
    }
  }

  @Override
  public int run(String srcDir, SourceFile file) {
    String dir = "";

    try {
      if (ftpConnex == null || !ftpConnex.isConnected()) {
        ftpConnex =
            new FtpConnexion(
                channel,
                channel.getStringProp(FTP_TARGET_SERVER),
                channel.getStringProp(FTP_TARGET_USER),
                channel.getStringProp(FTP_TARGET_PASSWD),
                channel.getStringProp(FTP_TARGET_DIR),
                channel.getIntProp(FTP_TARGET_MODE, 0));

        ftpConnex.connect();
      } else {
        ftpConnex.chHomeDir();
      }

      int status = channel.getStatus();
      channel.setUploadFilename(file.getName());
      channel.setStatus(Channel.UP);

      // Creation des sous-repertoires destination si necessaire
      boolean trgSubDir = channel.getBooleanProp(FTP_TARGET_SUB_DIR, false);

      if (trgSubDir) {

        String filePath = FilenameUtils.separatorsToUnix(FilenameUtils.normalize(file.getPath()));
        String dirPath = FilenameUtils.separatorsToUnix(FilenameUtils.normalize(srcDir));

        if (!dirPath.endsWith("/")) {
          dirPath += '/';
        }

        if (filePath.startsWith(dirPath)) {
          dir = filePath.substring(dirPath.length());
        } else {
          dir = filePath;
        }

        dir = FilenameUtils.separatorsToUnix(FilenameUtils.getFullPath(dir));

        ftpConnex.createDir(dir);
      }

      sendToFtp(ftpConnex, file);

      ftpConnex.chHomeDir();
      channel.setStatus(status);
      String[] args = {
        file.getPath(),
        channel.getStringProp(FTP_TARGET_USER),
        channel.getStringProp(FTP_TARGET_SERVER),
        ftpConnex.getDir() + dir
      };
      channel.logInfo(
          channel.getStringProp(Channel.ID) + " - " + Message.get("ftpmove.message2", args));
      return OK;
    } catch (FTPTransferCancelledException cancelException) {
      String[] args = {
        file.getPath(),
        channel.getStringProp(FTP_TARGET_USER),
        channel.getStringProp(FTP_TARGET_SERVER),
        ""
      };
      channel.logInfo(
          channel.getStringProp(Channel.ID) + " - " + Message.get("ftpmove.message8", args));
      ftpConnex.close();
      ftpConnex = null;
      return KEEP;
    } catch (Exception e) {
      LOG.warn("FtpMove.run()", e);
      ftpConnex.close();
      ftpConnex = null;

      String[] args = {
        file.getPath(),
        channel.getStringProp(FTP_TARGET_USER),
        channel.getStringProp(FTP_TARGET_SERVER),
        ""
      };
      channel.logInfo(
          channel.getStringProp(Channel.ID) + " - " + Message.get("ftpmove.message3", args));
      channel.setStatus(Channel.FAILED);
      return FAIL;
    }
  }

  public void sendToFtp(FtpConnexion connex, SourceFile srcfile) throws IOException, FTPException {
    File file = srcfile.getFile();
    if (file == null) {
      throw new IOException("Cannot get file  : " + file);
    } else {
      String trgname = srcfile.getName();

      boolean cleanChar = channel.getBooleanProp(FTP_TARGET_CLEAN_CHAR, false);
      if (cleanChar) {
        trgname = FilenameCleaner.clean(trgname);
      }

      boolean cleanSpace = channel.getBooleanProp(FTP_TARGET_CLEAN_SPACE, false);
      if (cleanSpace) {
        trgname = trgname.replace(' ', '_');
      }

      String replaceStr = channel.getStringProp(FTP_TARGET_REPLACE_CHAR, "").trim();
      if (!replaceStr.isEmpty()) {
        String destStr = channel.getStringProp(FTP_TARGET_DESTINATION_CHAR, "");
        for (int i = 0; i < replaceStr.length(); i++) {
          String c = String.valueOf(replaceStr.charAt(i));
          trgname = trgname.replace(c, destStr);
        }
      }

      String tmpExt = channel.getStringProp(FTP_TARGET_TEMP_EXT, "").trim();
      if (!tmpExt.isEmpty()) {
        Random rand = new Random();
        tmpExt = tmpExt.replace("{TEMP}", String.valueOf(Math.abs(rand.nextInt())));
      }

      connex.uploadFile(file.getPath(), trgname, tmpExt);
    }
  }

  @Override
  public JPanel buildPanel(Dialog parent) {
    serverField = new JTextField(channel.getStringProp(FTP_TARGET_SERVER), 30);
    userField = new JTextField(channel.getStringProp(FTP_TARGET_USER), 30);
    passwdField = new JPasswordField(channel.getStringProp(FTP_TARGET_PASSWD), 15);
    dirField = new JTextField(channel.getStringProp(FTP_TARGET_DIR), 30);
    extField = new JTextField(channel.getStringProp(FTP_TARGET_TEMP_EXT), 20);

    modeCombo = new JComboBox<>(MODES);
    modeCombo.setSelectedIndex(channel.getIntProp(FTP_TARGET_MODE, 0));

    subDirCheck = new JCheckBox(Message.get("ftpmove.subdir"));
    subDirCheck.setSelected(channel.getBooleanProp(FTP_TARGET_SUB_DIR, false));
    subDirCheck.setBorder(BorderFactory.createEmptyBorder(3, 0, 3, 0));

    cleanCharCheck = new JCheckBox(Message.get("ftpmove.cleanchar"));
    cleanCharCheck.setSelected(channel.getBooleanProp(FTP_TARGET_CLEAN_CHAR, false));
    cleanCharCheck.setBorder(BorderFactory.createEmptyBorder(3, 0, 3, 0));

    cleanSpaceCheck = new JCheckBox(Message.get("ftpmove.cleanspace"));
    cleanSpaceCheck.setSelected(channel.getBooleanProp(FTP_TARGET_CLEAN_SPACE, false));
    cleanSpaceCheck.setBorder(BorderFactory.createEmptyBorder(3, 0, 3, 0));

    replaceField = new JTextField(channel.getStringProp(FTP_TARGET_REPLACE_CHAR), 20);
    destinationField = new JTextField(channel.getStringProp(FTP_TARGET_DESTINATION_CHAR), 4);

    int[] w = {5, 0, 5, 0, 5};
    int[] h = {5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 5};
    HIGConstraints c = new HIGConstraints();
    HIGLayout l = new HIGLayout(w, h);

    JPanel panel = new JPanel(l);
    panel.add(new JLabel(Message.get("ftpmove.server")), c.xy(2, 2, "r"));
    panel.add(serverField, c.xy(4, 2, "lr"));
    panel.add(new JLabel(Message.get("ftpmove.user")), c.xy(2, 3, "r"));
    panel.add(userField, c.xy(4, 3, "lr"));
    panel.add(new JLabel(Message.get("ftpmove.passwd")), c.xy(2, 4, "r"));
    panel.add(passwdField, c.xy(4, 4, "l"));
    panel.add(new JLabel(Message.get("ftpmove.trgdir")), c.xy(2, 5, "r"));
    panel.add(dirField, c.xy(4, 5, "lr"));

    panel.add(new JLabel(Message.get("ftpmove.transfer")), c.xy(2, 7, "r"));
    panel.add(modeCombo, c.xy(4, 7, "l"));
    panel.add(subDirCheck, c.xy(4, 8, "l"));
    panel.add(cleanCharCheck, c.xy(4, 9, "l"));
    panel.add(cleanSpaceCheck, c.xy(4, 10, "l"));

    JPanel p0 = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
    p0.add(replaceField);
    p0.add(new JLabel("  " + Message.get("localmove.by") + "  "));
    p0.add(destinationField);

    panel.add(new JLabel(Message.get("localmove.replace")), c.xy(2, 11, "r"));
    panel.add(p0, c.xy(4, 11, "lr"));

    panel.add(new JLabel(Message.get("ftpmove.trgext")), c.xy(2, 13, "r"));
    panel.add(extField, c.xy(4, 13, "l"));

    return panel;
  }

  @Override
  public boolean setParameters() {
    channel.setProperty(FTP_TARGET_SERVER, serverField.getText());
    channel.setProperty(FTP_TARGET_USER, userField.getText());
    channel.setProperty(FTP_TARGET_PASSWD, new String(passwdField.getPassword()));
    channel.setProperty(FTP_TARGET_DIR, dirField.getText().replace(File.separatorChar, '/'));
    channel.setProperty(FTP_TARGET_MODE, modeCombo.getSelectedIndex());
    channel.setProperty(FTP_TARGET_SUB_DIR, String.valueOf(subDirCheck.isSelected()));
    channel.setProperty(FTP_TARGET_CLEAN_CHAR, cleanCharCheck.isSelected());
    channel.setProperty(FTP_TARGET_CLEAN_SPACE, cleanSpaceCheck.isSelected());
    channel.setProperty(FTP_TARGET_TEMP_EXT, extField.getText());
    channel.setProperty(FTP_TARGET_REPLACE_CHAR, replaceField.getText());
    channel.setProperty(FTP_TARGET_DESTINATION_CHAR, destinationField.getText());
    return true;
  }
}
