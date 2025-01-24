package com.adlitteram.jspool.targets;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.GuiUtils;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.files.SourceFile;
import com.adlitteram.jspool.utils.FilenameCleaner;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.Dialog;
import java.awt.FlowLayout;
import java.io.File;
import java.io.IOException;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LocalMove extends AbstractTarget {

  private static final Logger LOG = LoggerFactory.getLogger(LocalMove.class);

  public static final String TARGET_DIRS = "Target.Dirs";
  public static final String TARGET_DIR1 = "Target.Dir1";
  public static final String TARGET_DIR2 = "Target.Dir2";
  public static final String TARGET_DIR3 = "Target.Dir3";
  public static final String TARGET_DIR4 = "Target.Dir4";
  public static final String TARGET_SUB_DIR = "Target.subDir";
  public static final String TARGET_RENAME = "Target.Rename";
  public static final String TARGET_REPL_CHAR = "Target.ReplaceChar";
  public static final String TARGET_DEST_CHAR = "Target.DestinationChar";
  public static final String TARGET_CLEAN_CHAR = "Target.CleanChar";
  public static final String TARGET_CLEAN_SPACE = "Target.CleanSpace";
  public static final String TARGET_SRC_RENAME = "Target.SrcRename";
  public static final String TARGET_TRG_RENAME = "Target.TrgRename";
  public static final String TARGET_TEMP_EXT = "Target.TempExt";
  public static final String SLASH = "/";

  private JTextArea targetArea;
  private JCheckBox subDirCheck;
  private JCheckBox renameCheck;
  private JTextField srcRenameField;
  private JTextField trgRenameField;
  private JLabel srcRenameLabel;
  private JLabel trgRenameLabel;
  private Pattern pattern;
  private JCheckBox cleanCharCheck;
  private JCheckBox cleanSpaceCheck;
  private JTextField replaceField;
  private JTextField destinationField;
  private JTextField extField;

  @Override
  public String getName() {
    return "Move";
  }

  @Override
  public void init(Channel ch) {
    super.init(ch);

    String dirs = channel.getStringProp(TARGET_DIRS, "");
    if (!dirs.isEmpty() && !dirs.endsWith(";")) {
      dirs += ";";
    }

    String dir = channel.getStringProp(TARGET_DIR1);
    if (dir != null && !dir.isEmpty()) {
      dirs += dir + ";";
    }

    dir = channel.getStringProp(TARGET_DIR2);
    if (dir != null && !dir.isEmpty()) {
      dirs += dir + ";";
    }

    dir = channel.getStringProp(TARGET_DIR3);
    if (dir != null && !dir.isEmpty()) {
      dirs += dir + ";";
    }

    channel.setProperty(TARGET_DIRS, dirs);
    channel.unsetProperty(TARGET_DIR1);
    channel.unsetProperty(TARGET_DIR2);
    channel.unsetProperty(TARGET_DIR3);
  }

  @Override
  public int run(String srcDir, SourceFile srcfile) {

    int status = FAIL;

    String trgname = srcfile.getName();

    boolean cleanChar = channel.getBooleanProp(TARGET_CLEAN_CHAR, false);
    if (cleanChar) {
      trgname = FilenameCleaner.clean(trgname);
    }

    boolean cleanSpace = channel.getBooleanProp(TARGET_CLEAN_SPACE, false);
    if (cleanSpace) {
      trgname = trgname.replace(' ', '_');
    }

    String replaceStr = channel.getStringProp(TARGET_REPL_CHAR, "").trim();
    if (!replaceStr.isEmpty()) {
      String destStr = channel.getStringProp(TARGET_DEST_CHAR, "");
      for (int i = 0; i < replaceStr.length(); i++) {
        String c = String.valueOf(replaceStr.charAt(i));
        trgname = trgname.replace(c, destStr);
      }
    }

    boolean rename = channel.getBooleanProp(TARGET_RENAME, false);
    if (rename) {
      if (pattern == null) {
        try {
          pattern = Pattern.compile(channel.getStringProp(TARGET_SRC_RENAME));
        } catch (Exception e) {
          channel.logInfo(
              channel.getStringProp(Channel.ID) + " - " + Message.get("localmove.message7"));
        }
      }
      if (pattern != null) {
        trgname = rename(pattern, srcfile.getName(), channel.getStringProp(TARGET_TRG_RENAME));
      }
    }

    String tmpExt = channel.getStringProp(TARGET_TEMP_EXT, "").trim();
    if (!tmpExt.isEmpty()) {
      Random rand = new Random();
      tmpExt = tmpExt.replace("{TEMP}", String.valueOf(Math.abs(rand.nextInt())));
    }

    String dirs = channel.getStringProp(TARGET_DIRS);
    if (dirs != null && !dirs.isEmpty()) {
      for (String dir : dirs.split(";")) {
        if (!channel.isStopped() && !dir.isEmpty()) {
          if (doCopy(srcDir, srcfile, new File(dir), trgname, tmpExt)) {
            status = OK;
          }
        }
      }
    }

    if (channel.isStopped()) {
      status = NOP;
    }
    return status;
  }

  private boolean doCopy(
      String srcDir, SourceFile srcfile, File trgDir, String trgname, String tmpExt) {

    // Creation des sous-repertoires destination si necessaire
    boolean trgSubDir = channel.getBooleanProp(TARGET_SUB_DIR, false);

    if (trgSubDir) {

      String filePath = FilenameUtils.separatorsToUnix(FilenameUtils.normalize(srcfile.getPath()));
      String dirPath = FilenameUtils.separatorsToUnix(FilenameUtils.normalize(srcDir));
      if (!dirPath.endsWith(SLASH)) {
        dirPath += '/';
      }

      if (filePath.startsWith(dirPath)) {
        filePath = filePath.substring(dirPath.length());
      }

      trgDir = new File(FilenameUtils.getFullPath(trgDir.getPath() + SLASH + filePath));
    }

    // Creation du repertoire destination si necessaire
    if (!trgDir.exists()) {
      if (trgDir.getPath().isEmpty()) {
        channel.logInfo(
            channel.getStringProp(Channel.ID) + " - " + Message.get("localmove.message1"));
        return false;
      }
      channel.logInfo(
          channel.getStringProp(Channel.ID)
              + " - "
              + Message.get("localmove.message2", new String[] {trgDir.getPath()}));

      try {
        trgDir.mkdirs();
      } catch (Exception e) {
        channel.logWarning(channel.getStringProp(Channel.ID) + " - localmove() ", e);
        return false;
      }
    }

    File dst = new File(trgDir, trgname);
    String[] args3 = {srcfile.getPath(), dst.getPath()};

    if (srcfile.exists() && srcfile.canRead()) {
      try {
        if (dst.exists()) {
          dst.delete();
        }

        if (tmpExt != null && !tmpExt.isEmpty()) {
          File dstTmp = new File(dst.getPath() + tmpExt);
          if (dstTmp.exists()) {
            dstTmp.delete();
          }
          srcfile.copyTo(dstTmp);
          FileUtils.moveFile(dstTmp, dst);
        } else {
          srcfile.copyTo(dst);
        }

        channel.logInfo(
            channel.getStringProp(Channel.ID) + " - " + Message.get("localmove.message3", args3));
        return true;
      } catch (IOException ex) {
        LOG.warn("Unable to copy", ex);
      }
    }
    if (!channel.isStopped()) {
      channel.logInfo(
          channel.getStringProp(Channel.ID) + " - " + Message.get("localmove.message4", args3));
    }

    return false;
  }

  @Override
  public JPanel buildPanel(Dialog parent) {

    targetArea = new JTextArea(channel.getStringProp(TARGET_DIRS), 5, 30);
    targetArea.setLineWrap(true);
    targetArea.setWrapStyleWord(false);
    GuiUtils.invertFocusTraversalBehaviour(targetArea);

    JButton browseButton = GuiUtils.createDirButton(targetArea);

    subDirCheck = new JCheckBox(Message.get("localmove.subdir"));
    subDirCheck.setSelected(channel.getBooleanProp(TARGET_SUB_DIR, false));
    subDirCheck.setBorder(BorderFactory.createEmptyBorder(3, 0, 3, 0));

    srcRenameLabel = new JLabel(Message.get("localmove.srcrename"));
    trgRenameLabel = new JLabel(Message.get("localmove.trgrename"));
    srcRenameField = new JTextField(channel.getStringProp(TARGET_SRC_RENAME), 30);
    trgRenameField = new JTextField(channel.getStringProp(TARGET_TRG_RENAME), 30);
    setEnabledRename(channel.getBooleanProp(TARGET_RENAME, false));

    renameCheck = new JCheckBox(Message.get("localmove.rename"));
    renameCheck.setSelected(channel.getBooleanProp(TARGET_RENAME, false));
    renameCheck.setBorder(BorderFactory.createEmptyBorder(3, 0, 3, 0));
    renameCheck.addActionListener(e -> setEnabledRename(renameCheck.isSelected()));

    cleanCharCheck = new JCheckBox(Message.get("localmove.cleanchar"));
    cleanCharCheck.setSelected(channel.getBooleanProp(TARGET_CLEAN_CHAR, false));
    cleanCharCheck.setBorder(BorderFactory.createEmptyBorder(3, 0, 3, 0));

    cleanSpaceCheck = new JCheckBox(Message.get("localmove.cleanspace"));
    cleanSpaceCheck.setSelected(channel.getBooleanProp(TARGET_CLEAN_SPACE, false));
    cleanSpaceCheck.setBorder(BorderFactory.createEmptyBorder(3, 0, 3, 0));

    replaceField = new JTextField(channel.getStringProp(TARGET_REPL_CHAR), 20);
    destinationField = new JTextField(channel.getStringProp(TARGET_DEST_CHAR), 4);
    extField = new JTextField(channel.getStringProp(TARGET_TEMP_EXT), 20);

    int[] w = {5, 0, 5, 0, 5, 0, 5};
    int[] h = {5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 5};
    HIGLayout l = new HIGLayout(w, h);
    HIGConstraints c = new HIGConstraints();
    l.setColumnWeight(4, 1);

    JPanel panel = new JPanel(l);
    panel.add(new JLabel(Message.get("localmove.trgdir")), c.xy(2, 2, "r"));
    panel.add(new JScrollPane(targetArea), c.xy(4, 2, "lr"));
    panel.add(browseButton, c.xy(6, 2, "lt"));

    panel.add(subDirCheck, c.xy(4, 6, "l"));
    panel.add(cleanCharCheck, c.xy(4, 8, "l"));
    panel.add(cleanSpaceCheck, c.xy(4, 9, "l"));

    JPanel p0 = new JPanel(new FlowLayout(FlowLayout.LEFT, 0, 0));
    p0.add(replaceField);
    p0.add(new JLabel("  " + Message.get("localmove.by") + "  "));
    p0.add(destinationField);

    panel.add(new JLabel(Message.get("localmove.replace")), c.xy(2, 10, "r"));
    panel.add(p0, c.xywh(4, 10, 3, 1, "l"));

    panel.add(renameCheck, c.xy(4, 11, "l"));
    panel.add(srcRenameLabel, c.xy(2, 12, "r"));
    panel.add(srcRenameField, c.xy(4, 12, "lr"));
    panel.add(trgRenameLabel, c.xy(2, 13, "r"));
    panel.add(trgRenameField, c.xy(4, 13, "lr"));

    panel.add(new JLabel(Message.get("ftpmove.trgext")), c.xy(2, 15, "r"));
    panel.add(extField, c.xy(4, 15, "l"));

    return panel;
  }

  private void setEnabledRename(boolean b) {
    srcRenameField.setEnabled(b);
    trgRenameField.setEnabled(b);
    srcRenameLabel.setEnabled(b);
    trgRenameLabel.setEnabled(b);
  }

  @Override
  public boolean setParameters() {
    channel.setProperty(
        TARGET_DIRS,
        targetArea.getText().replace('\n', ';').replaceAll(";+", ";").replaceFirst("^;", ""));
    channel.setProperty(TARGET_SUB_DIR, String.valueOf(subDirCheck.isSelected()));
    channel.setProperty(TARGET_RENAME, String.valueOf(renameCheck.isSelected()));

    if (renameCheck.isSelected()) {
      try {
        pattern = Pattern.compile(srcRenameField.getText());
      } catch (Exception e) {
        GuiUtils.showError(Message.get("localmove.message7"));
        return false;
      }
    }

    channel.setProperty(TARGET_SRC_RENAME, srcRenameField.getText());
    channel.setProperty(TARGET_TRG_RENAME, trgRenameField.getText());
    channel.setProperty(TARGET_CLEAN_CHAR, cleanCharCheck.isSelected());
    channel.setProperty(TARGET_CLEAN_SPACE, cleanSpaceCheck.isSelected());
    channel.setProperty(TARGET_REPL_CHAR, replaceField.getText());
    channel.setProperty(TARGET_DEST_CHAR, destinationField.getText());
    channel.setProperty(TARGET_TEMP_EXT, extField.getText());
    return true;
  }

  public String rename(Pattern pattern, String src, String out) {

    Matcher m = pattern.matcher(src);

    if (m.matches()) {
      try {
        int state = 0;
        StringBuilder trg = new StringBuilder();
        StringBuilder value = null;

        for (int i = 0; i < out.length(); i++) {
          char c = out.charAt(i);

          if (state == 0) {
            if (c == '{') {
              value = new StringBuilder(2);
              state = 1;
            } else {
              trg.append(c);
            }
          } else {
            if (c == '}') {
              int j = Integer.parseInt(value.toString());
              trg.append(m.group(j));
              state = 0;
            } else {
              value.append(c);
            }
          }
        }

        return trg.toString();
      } catch (NumberFormatException e) {
        channel.logInfo(
            channel.getStringProp(Channel.ID)
                + " - "
                + Message.get("localmove.message6", new String[] {src}));
        return src;
      }
    } else {
      channel.logInfo(
          channel.getStringProp(Channel.ID) + " - " + Message.get("localmove.message5"));
      return src;
    }
  }
}
