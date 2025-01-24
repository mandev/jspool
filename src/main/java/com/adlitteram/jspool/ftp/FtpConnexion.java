package com.adlitteram.jspool.ftp;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.utils.Utils;
import com.enterprisedt.net.ftp.FTPClient;
import com.enterprisedt.net.ftp.FTPConnectMode;
import com.enterprisedt.net.ftp.FTPException;
import com.enterprisedt.net.ftp.FTPProgressMonitor;
import com.enterprisedt.net.ftp.FTPTransferType;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.util.StringTokenizer;
import javax.swing.SwingUtilities;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FtpConnexion implements FTPProgressMonitor {

  private static final Logger LOG = LoggerFactory.getLogger(FtpConnexion.class);

  private static final int INTERVAL = 100;
  static PrintWriter logWriter = new PrintWriter(System.err);
  private FTPClient client;
  private final Channel channel;
  private final String server;
  private final String user;
  private final String passwd;
  private String homeDir;
  private final FTPConnectMode mode;
  private long fileSize; // Size of transferred file

  public FtpConnexion(Channel channel, String server, String user, String passwd, String dir) {
    this(channel, server, user, passwd, dir, 0);
  }

  public FtpConnexion(
      Channel channel, String server, String user, String passwd, String dir, int mode) {
    this.channel = channel;
    this.server = server;
    this.user = user;
    this.passwd = passwd;
    this.homeDir = dir;
    this.mode = (mode == 0) ? FTPConnectMode.PASV : FTPConnectMode.ACTIVE;
  }

  public FTPClient getClient() {
    return client;
  }

  public Channel getChannel() {
    return channel;
  }

  public String getDir() {
    return homeDir;
  }

  public boolean isConnected() {
    return client != null && client.connected();
  }

  public void connect() throws IOException, FTPException {
    String[] args1 = {user, server, homeDir};

    client = new FTPClient();
    // client.debugResponses(true);
    // client.setControlEncoding("Windows-1252" ) ;
    // client.setControlEncoding("UTF-8") ;
    client.setControlEncoding("ISO-8859-1");
    client.setTimeout(2 * 60000); // x*60 secondes
    client.setConnectMode(mode);
    client.setRemoteHost(server);
    client.connect();
    client.login(user, passwd);
    client.setType(FTPTransferType.BINARY);

    // Get Abolute directory
    if (homeDir == null || homeDir.length() == 0) {
      homeDir = client.pwd();
    } else {
      if (!homeDir.startsWith("/")) {
        homeDir = client.pwd() + "/" + homeDir;
      }
      homeDir = Utils.cleanFTPPath(homeDir + "/");
      client.chdir(homeDir);
    }

    channel.logInfo(
        channel.getStringProp(Channel.ID) + " - " + Message.get("ftpmove.message1", args1));
  }

  public void chHomeDir() throws IOException, FTPException {
    if (!homeDir.equals(client.pwd())) {
      client.chdir(homeDir);
    }
  }

  public void close() {
    if (client != null) {
      try {
        client.quit();
        client = null;
      } catch (Exception e) {
        LOG.warn("FtpConnexion.close()", e);
      }
    }
  }

  public void createDir(String dir) throws IOException, FTPException {
    boolean absolute = dir.startsWith("/");
    StringTokenizer st = new StringTokenizer(dir, "/");
    int len = st.countTokens();

    for (int i = 0; i < len; i++) {
      String str = st.nextToken();
      if (i == 0 && absolute) {
        str = "/" + str;
      }
      try {
        client.chdir(str);
      } catch (Exception e) {
        client.mkdir(str);
        client.chdir(str);
        String[] args1 = {str};
        channel.logInfo(
            channel.getStringProp(Channel.ID) + " - " + Message.get("ftpmove.message5", args1));
      }
    }
  }

  public void uploadFile(String src, String dst, String ext) throws IOException, FTPException {
    int status = channel.getStatus();

    File srcFile = new File(src);
    fileSize = srcFile.length();

    channel.setUploadFilename(dst);
    channel.setStatus(Channel.UP);
    client.setProgressMonitor(this, Math.max(4096, 1 + fileSize / INTERVAL));

    try (InputStream srcStream = new FileInputStream(srcFile)) {
      if (!ext.isEmpty()) {
        client.put(srcStream, dst + ext);
        client.rename(dst + ext, dst);
      } else {
        client.put(srcStream, dst);
      }

      logWriter.flush();
      channel.setStatus(status);
    }
  }

  @Override
  public void bytesTransferred(long count) {
    final int progress = (fileSize > 0) ? (int) (100 * count / fileSize) : 0;
    Runnable runnable =
        () -> {
          channel.update(progress);
          if (channel.isStopped()) {
            client.cancelTransfer();
          }
        };
    SwingUtilities.invokeLater(runnable);
  }

  public long getFileSize() {
    return fileSize;
  }

  public void setFileSize(long fileSize) {
    this.fileSize = fileSize;
  }
}
