package com.adlitteram.jspool.files;

import com.adlitteram.jspool.mail.MailConnexion;
import com.adlitteram.jspool.utils.FilenameCleaner;
import java.io.File;
import java.io.IOException;
import java.util.regex.Pattern;
import javax.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MailSourceFile extends SourceFile {

  private static final Logger LOG = LoggerFactory.getLogger(MailSourceFile.class);

  private static int mailCounter = 0;

  private final MailConnexion connexion;
  private File tmpFile;
  private final String name;
  private final int num;

  public MailSourceFile(MailConnexion pop3Connex) {
    this(pop3Connex, -1);
  }

  public MailSourceFile(MailConnexion connexion, int num) {
    super(0);
    mailCounter++;
    this.connexion = connexion;
    this.num = num;
    this.name =
        FilenameCleaner.clean(
            "mail_"
                + connexion.getUserName()
                + "_"
                + System.currentTimeMillis()
                + "_"
                + mailCounter
                + ".zip");
  }

  public int getNum() {
    return num;
  }

  @Override
  public String getPath() {
    return "./" + getName();
  }

  @Override
  public long getLength() {
    return 1L;
  }

  @Override
  public String getName() {
    return name;
  }

  @Override
  public boolean exists() {
    return true;
  }

  @Override
  public boolean canRead() {
    return true;
  }

  @Override
  public boolean canWrite() {
    return true;
  }

  @Override
  public boolean isDirectory() {
    return false;
  }

  @Override
  public long lastModified() {
    return 0;
  }

  @Override
  public boolean delete() {
    try {
      if (tmpFile != null) {
        tmpFile.delete();
        tmpFile = null;
      }
      return true;
    } catch (Exception e) {
      LOG.warn("MailSourceFile.delete()", e);
      return false;
    }
  }

  @Override
  public boolean close() {
    return true;
  }

  @Override
  public File getFile() {
    if (tmpFile == null) {

      try {
        tmpFile = connexion.getEmail(num);
      } catch (MessagingException | IOException e) {
        LOG.warn("MailSourceFile.getFile()", e);
        if (tmpFile != null) {
          tmpFile.delete();
          tmpFile = null;
        }
      }
    }
    return tmpFile;
  }

  @Override
  public void init(long newLength) {}

  @Override
  public void process(long newLength) {
    stability++;
  }

  @Override
  public SourceFile[] listFiles(Pattern regexp) {
    MailSourceFile[] files = new MailSourceFile[0];
    try {
      int count = Math.max(0, connexion.getCount());
      files = new MailSourceFile[count];
      for (int i = 0; i < files.length; i++) {
        files[i] = new MailSourceFile(connexion, (i + 1));
      }
    } catch (MessagingException | IOException ex) {
      LOG.warn("MailSourceFile.listFiles", ex);
    }
    return files;
  }
}
