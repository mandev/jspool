/**
 * FtpConnexion.java
 * Copyright (C) 2002 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller  */
package com.adlitteram.jspool.ftp;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.Utils;
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

    private static final Logger logger = LoggerFactory.getLogger(FtpConnexion.class);

    static private final int INTERVAL = 100;
    static PrintWriter logWriter = new PrintWriter(System.err);
    private FTPClient client;
    private Channel channel;
    private String server;
    private String user;
    private String passwd;
    private String homedir;
    private FTPConnectMode mode;
    private long fileSize; // Size of transferred file

    public FtpConnexion(Channel channel, String server, String user, String passwd, String dir) {
        this(channel, server, user, passwd, dir, 0);
    }

    public FtpConnexion(Channel channel, String server, String user, String passwd, String dir, int mode) {
        this.channel = channel;
        this.server = server;
        this.user = user;
        this.passwd = passwd;
        this.homedir = dir;
        this.mode = (mode == 0) ? FTPConnectMode.PASV : FTPConnectMode.ACTIVE;
    }

    public FTPClient getClient() {
        return client;
    }

    public Channel getChannel() {
        return channel;
    }

    public String getDir() {
        return homedir;
    }

    public boolean isConnected() {
        if (client == null) {
            return false;
        }
        return client.connected();
    }

    public void connect() throws IOException, FTPException {
        String[] args1 = {user, server, homedir};

        client = new FTPClient();
        //client.debugResponses(true);
        //client.setControlEncoding("Windows-1252" ) ;
        client.setControlEncoding("ISO-8859-1");
        //client.setControlEncoding("UTF-8") ;
        client.setTimeout(2 * 60000);  // x*60 secondes
        client.setConnectMode(mode);
        client.setRemoteHost(server);
        client.connect();
        client.login(user, passwd);
        client.setType(FTPTransferType.BINARY);

        // Get Abolute directory
        if (homedir == null || homedir.length() == 0) {
            homedir = client.pwd();
        }
        else {
            if (!homedir.startsWith("/")) {
                homedir = client.pwd() + "/" + homedir;
            }
            homedir = Utils.cleanFTPPath(homedir + "/");
            client.chdir(homedir);
        }

        channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("ftpmove.message1", args1));
    }

    public void chhomedir() throws IOException, FTPException {
        if (!homedir.equals(client.pwd())) {
            client.chdir(homedir);
        }
    }

    public void close() {
        if (client != null) {
            try {
                client.quit();
                client = null;
            }
            catch (Exception e) {
                logger.warn("FtpConnexion.close()", e);
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
            }
            catch (Exception e) {
                client.mkdir(str);
                client.chdir(str);
                String[] args1 = {str};
                channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("ftpmove.message5", args1));
            }
        }
    }

    public void uploadFile(String src, String dst, String ext) throws IOException, FTPException {
        InputStream srcStream = null;
        int status = channel.getStatus();

        try {
            File srcFile = new File(src);
            fileSize = srcFile.length();

            channel.setUploadFilename(dst);
            channel.setStatus(Channel.UP);
            client.setProgressMonitor(this, (long) (Math.max(4096, 1 + fileSize / INTERVAL)));

            srcStream = new FileInputStream(srcFile);
            if (ext.length() > 0) {
                client.put(srcStream, dst + ext);
                client.rename(dst + ext, dst);
            }
            else {
                client.put(srcStream, dst);
            }

            logWriter.flush();
            channel.setStatus(status);
        }
        finally {
            if (srcStream != null) {
                srcStream.close();
            }
        }
    }

    @Override
    public void bytesTransferred(long count) {
        final int progress = (fileSize > 0) ? (int) (100 * count / fileSize) : 0;
        Runnable runnable = new Runnable() {

            @Override
            public void run() {
                channel.update(progress);
                if (channel.isStopped()) {
                    client.cancelTransfer();
                }
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
