/**
 * FtpFile.java
 * Copyright (C) 2002 Emmanuel Deviller
 *
 * @version 1.0
 * @author Emmanuel Deviller  */
package com.adlitteram.jspool.files;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.ftp.FtpConnexion;
import com.adlitteram.jspool.sources.FtpSource;
import com.enterprisedt.net.ftp.FTPClient;
import com.enterprisedt.net.ftp.FTPFile;
import com.enterprisedt.net.ftp.FTPTransferCancelledException;
import java.io.File;
import java.util.Date;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FtpSourceFile extends SourceFile {

    private static final Logger logger = LoggerFactory.getLogger(FtpSourceFile.class);

    private FtpConnexion ftpConnex;
    private FTPFile ftpFile;
    private String dir;
    private long length = -1;
    private File tmpFile;

    public FtpSourceFile(FtpConnexion ftpCon, int maxStab) {
        super(maxStab);

        ftpConnex = ftpCon;
        dir = null; // racine
        ftpFile = new FTPFile("", ".", -1, true, new Date(0));
    }

    // str =  -rw-r--r--   1 xx       staff       4673 Feb  2 23:08 toto.txt
    public FtpSourceFile(FtpConnexion ftpCon, String directory, FTPFile ftpFile, int maxStab) {
        super(maxStab);

        ftpConnex = ftpCon;
        dir = directory;
        this.ftpFile = ftpFile;
    }

    public String getDirectory() {
        return dir;
    }

    @Override
    public String getPath() {
        return (dir == null) ? ftpFile.getName() : dir + "/" + ftpFile.getName();
    }

    @Override
    public long getLength() {
        return ftpFile.size();
    }

    @Override
    public String getName() {
        return ftpFile.getName();
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
        return ftpFile.isDir();
    }

    @Override
    public long lastModified() {
//        return ftpFile.lastModified().getTime() ;
        try {
            FTPClient client = ftpConnex.getClient();
            ftpConnex.chhomedir();
            return client.modtime(getPath()).getTime();
        }
        catch (Exception e) {
            logger.warn("FtpSourceFile.lastModified()", e);
            ftpConnex.close();
            return 0;
        }
    }

    @Override
    public boolean delete() {
        try {
            if (tmpFile != null) {
                tmpFile.delete();
                tmpFile = null;
            }

            FTPClient client = ftpConnex.getClient();
            ftpConnex.chhomedir();
            client.delete(getPath());
            return true;
        }
        catch (Exception e) {
            logger.warn("FtpSourceFile.delete()", e);
            ftpConnex.close();
            return false;
        }
    }

    @Override
    public boolean close() {
        if (tmpFile != null) {
            boolean status = tmpFile.delete();
            tmpFile = null;
            return status;
        }
        return true;
    }

    @Override
    public File getFile() {
        if (tmpFile == null) {

            Channel channel = ftpConnex.getChannel();
            int status = channel.getStatus();

            try {
                if (!ftpConnex.isConnected()) {
                    ftpConnex.connect();
                }

                tmpFile = File.createTempFile("jspool_", null);
                tmpFile.deleteOnExit();

                channel.setDownloadFilename(getName());
                channel.setStatus(Channel.DOWN);

                ftpConnex.chhomedir();
                ftpConnex.setFileSize(getLength());
                FTPClient client = ftpConnex.getClient();
                client.setProgressMonitor(ftpConnex, (long) (Math.max(4096, 1 + getLength() / 100)));
                client.get(tmpFile.getPath(), getPath());
                ftpConnex.chhomedir();

                channel.setStatus(status);
            }
            catch (FTPTransferCancelledException cancelException) {
                String[] args = {getPath(), channel.getStringProp(FtpSource.FTPSOURCE_USER), channel.getStringProp(FtpSource.FTPSOURCE_SERVER), ""};
                channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("ftpmove.message8", args));
                channel.setStatus(Channel.STOP);
                ftpConnex.close();
                if (tmpFile != null) {
                    tmpFile.delete();
                    tmpFile = null;
                }
            }
            catch (Exception e) {
                logger.warn("FtpSourceFile.getFile()", e);
                channel.setStatus(Channel.FAILED);
                ftpConnex.close();
                if (tmpFile != null) {
                    tmpFile.delete();
                    tmpFile = null;
                }
            }
        }
        return tmpFile;
    }

    @Override
    public void init(long newLength) {
        length = newLength;
    }

    @Override
    public void process(long newLength) {
        if (newLength != length) {
            length = newLength;
            stability = 0;
            return;
        }
        stability++;
    }

    //public SourceFile [] listFiles(RE regexp)  {
    @Override
    public SourceFile[] listFiles(Pattern regexp) {
        FTPFile[] files;

        FTPClient ftpClient = ftpConnex.getClient();

        try {
            if (ftpClient == null) {
                ftpConnex.connect();
                return new SourceFile[]{};
            }
            //files = ftpClient.dir(getPath(), true);
            files = ftpClient.dirDetails(getPath());
        }
        catch (Exception e) {
            logger.warn("FtpSourceFile.listFiles()", e);
            ftpConnex.close();
            return new SourceFile[]{};
        }

        FtpSourceFile[] ft = new FtpSourceFile[files.length];

        int j = 0;
        for (FTPFile file : files) {
            if (!file.isLink() && accept(dir, file.getName(), regexp)) {
                ft[j] = new FtpSourceFile(ftpConnex, getPath(), file, maxStability);
                j++;
            }
        }

        FtpSourceFile[] ft2 = new FtpSourceFile[j];
        System.arraycopy(ft, 0, ft2, 0, j);
        return ft2;
    }

    private boolean accept(String dir, String name, Pattern regexp) {
        if (name == null || name.length() < 1
                || name.equals(".") || name.equals("..")) {
            return false;
        }
        return !(regexp != null && !regexp.matcher(name).matches());
    }
}
//    private long getLength(String str) {
//        StringTokenizer st = new StringTokenizer(str);
//        if (st.countTokens() < 9)
//            return -1;
//        for (int i = 0; i < 4; i++) {
//            st.nextToken();
//        }
//        try {
//            return Long.parseLong(st.nextToken());
//        }
//        catch (Exception e) {
//            return -1;
//        }
//    }
//    private String getName(String str) {
//        int count = 0;
//        int i = 0;
//        boolean tok = false;
//
//        for (; i < str.length(); i++) {
//            char c = str.charAt(i);
//            if (c == ' ' || c == '\t') {
//                tok = true;
//                continue;
//            }
//            if (tok == true) {
//                if (count == 7)
//                    break;
//                tok = false;
//                count++;
//            }
//        }
//        return str.substring(i);
//    }

