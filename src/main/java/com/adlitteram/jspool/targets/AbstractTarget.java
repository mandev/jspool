package com.adlitteram.jspool.targets;

import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.Version;
import com.adlitteram.jspool.files.SourceFile;
import java.awt.Dialog;
import javax.swing.JPanel;

public abstract class AbstractTarget {

  public static final int OK = 0;
  public static final int FAIL = 1;
  public static final int NOP = 2;
  public static final int KEEP = 3;
  public Channel channel;

  public void init(Channel ch) {
    channel = ch;
  }

  public void close() {}

  public String getRelease() {
    return Version.getRELEASE();
  }

  public String getAuthor() {
    return Version.getAUTHOR();
  }

  public abstract boolean setParameters();

  public abstract JPanel buildPanel(Dialog parent);

  public abstract String getName();

  public abstract int run(String srcDir, SourceFile file);
}
