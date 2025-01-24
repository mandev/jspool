package com.adlitteram.jspool.targets;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.GuiUtils;
import com.adlitteram.jspool.files.SourceFile;
import com.adlitteram.jspool.utils.Unzipper;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.Dialog;
import java.io.File;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;

public class Unzip extends AbstractTarget {

  public static final String PDF_UNZIP_DIR1 = "pdf.unzip.Dir1";
  private JTextField target1Field;

  @Override
  public String getName() {
    return "Unzip";
  }

  @Override
  public int run(String srcDir, SourceFile srcFile) {
    int status = FAIL;

    String dir = channel.getStringProp(PDF_UNZIP_DIR1);
    String errorDir = dir + File.separator + ".errors";

    if (dir != null
        && !dir.isEmpty()
        && Unzipper.unzip(srcFile.getFile().getPath(), dir, errorDir)) {
      status = OK;
    }

    return status;
  }

  @Override
  public JPanel buildPanel(Dialog parent) {
    target1Field = new JTextField(channel.getStringProp(PDF_UNZIP_DIR1), 25);
    JButton browse1Button = GuiUtils.createDirButton(target1Field);

    int[] w0 = {5, 0, 5, 0, 5, 0, 5};
    int[] h0 = {5, 0, 0, 0, 5, 0, 0, 0, 0, 5, 0, 0, 0, 0, 5};
    HIGLayout l0 = new HIGLayout(w0, h0);
    HIGConstraints c0 = new HIGConstraints();
    l0.setColumnWeight(4, 1);

    JPanel p0 = new JPanel(l0);
    p0.add(new JLabel(Message.get("localmove.trgdir")), c0.xy(2, 2, "r"));
    p0.add(target1Field, c0.xy(4, 2, "lr"));
    p0.add(browse1Button, c0.xy(6, 2, "l"));

    return p0;
  }

  @Override
  public boolean setParameters() {
    channel.setProperty(PDF_UNZIP_DIR1, target1Field.getText());
    return true;
  }
}
