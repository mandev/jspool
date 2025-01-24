package com.adlitteram.jspool.files;

import java.io.File;
import java.io.IOException;
import java.util.regex.Pattern;
import org.apache.commons.io.FileUtils;

public abstract class SourceFile {

  public static final int SORT_NONE = 0;

  int sortOrder = SORT_NONE;
  int maxStability;
  int stability = 0;

  protected SourceFile(int maxStab) {
    maxStability = maxStab;
  }

  public void setMaxStability(int maxStab) {
    maxStability = maxStab;
  }

  public final boolean isStabilized() {
    return (stability >= maxStability);
  }

  public boolean keepSortOrder() {
    return sortOrder != SORT_NONE;
  }

  public abstract void init(long fileLength);

  public abstract void process(long fileLength);

  public abstract File getFile();

  public abstract String getPath();

  public abstract String getName();

  public abstract long getLength();

  public abstract boolean exists();

  public abstract boolean canRead();

  public abstract boolean canWrite();

  public abstract boolean delete();

  public abstract boolean close();

  public abstract boolean isDirectory();

  public abstract long lastModified();

  public abstract SourceFile[] listFiles(Pattern regexp);

  // 	Copy the src file to dst file
  public void copyTo(File dst) throws IOException {
    FileUtils.copyFile(getFile(), dst);
  }
}
