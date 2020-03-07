package com.adlitteram.jspool.sources;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.Version;
import com.adlitteram.jspool.files.SourceFile;
import com.adlitteram.jspool.targets.AbstractTarget;
import java.util.HashMap;
import javax.swing.JPanel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

abstract public class AbstractSource {

    private static final Logger LOG = LoggerFactory.getLogger(AbstractSource.class);
    protected Channel channel;
    protected HashMap<String, SourceFile> srcFileMap = new HashMap<>();
    protected HashMap<String, Object> propertyMap = new HashMap<>();

    public void init(Channel ch) {
        channel = ch;
    }

    public Channel getChannel() {
        return channel;
    }

    public void close() {
        srcFileMap.clear();
        propertyMap.clear();
    }

    public String getRelease() {
        return Version.getRELEASE();
    }

    public String getAuthor() {
        return Version.getAUTHOR();
    }

    public void setProperty(String key, Object value) {
        propertyMap.put(key, value);
    }

    public Object getProperty(String key) {
        return propertyMap.get(key);
    }

    abstract public boolean setParameters();

    abstract public JPanel buildPanel();

    abstract public String getName();

    abstract public boolean run(AbstractTarget target);

    public boolean processDir(String srcDir, SourceFile dir, AbstractTarget target) {

        if (channel.isStopped()) {
            return true;
        }

        SourceFile[] srcFiles = dir.listFiles(channel.getRegexp());
        if (srcFiles == null) {
            String[] args = {dir.getName()};
            channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process4", args));
            return false;
        }

        boolean status = true;

        int maxFiles = channel.getIntProp(Channel.MAXFILES, 0);
        maxFiles = (maxFiles > 0) ? Math.min(maxFiles, srcFiles.length) : srcFiles.length;

        for (int i = 0; i < maxFiles; i++) {

            status = true;
            if (channel.isStopped()) {
                return true;
            }

            if (srcFiles[i].isDirectory()) {
                if (channel.listSubDir()) {
                    long delay = channel.deleteSubDirDelay();
                    if (delay > 0 && (System.currentTimeMillis() - srcFiles[i].lastModified()) > (delay * 1000) && srcFiles[i].listFiles(null).length == 0) {
                        String[] args = {srcFiles[i].getPath()};
                        channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process7", args));
                        srcFiles[i].delete();
                    }
                    else {
                        processDir(srcDir, srcFiles[i], target);
                    }
                }
                continue;
            }

            String[] args = {srcFiles[i].getPath()};

            long length = srcFiles[i].getLength();

            if (!channel.zeroLength() && length == 0) {
                channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process1", args));
                continue;
            }

            SourceFile srcFile = srcFileMap.get(srcFiles[i].getPath());

            // Nouveau fichier
            if (srcFile == null) {
                channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process3", args));
                srcFiles[i].init(length);
                srcFileMap.put(srcFiles[i].getPath(), srcFiles[i]);
            }
            else {
                srcFile.process(length);

                if (srcFile.isStabilized()) {
                    //LOG.info("Stabilized File - Channel " + channel.getID() + " - " + file.getPath());
                    switch (target.run(srcDir, srcFile)) {
                        case AbstractTarget.OK:
                            srcFileMap.remove(srcFile.getPath());
                            srcFile.delete();
                            break;
                        case AbstractTarget.FAIL:
                            channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process5", args));
                            status = false;
                            if (srcFile.keepSortOrder()) {
                                return status;
                            }
                            break;
                        case AbstractTarget.KEEP:
                            srcFileMap.remove(srcFile.getPath());
                            srcFile.close();
                            break;
                        case AbstractTarget.NOP:
                        default:
                    }
                }
                else {
                    channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process6", args));
                }
            }
        }
        return status;
    }

    public boolean processDir(SourceFile dir, AbstractTarget target) {

        if (channel.isStopped()) {
            return true;
        }

        SourceFile[] files = dir.listFiles(null);
        if (files == null) {
            String[] args = {dir.getName()};
            channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process4", args));
            return false;
        }

        boolean status = true;

        int maxFiles = channel.getIntProp(Channel.MAXFILES, 0);
        maxFiles = (maxFiles > 0) ? Math.min(maxFiles, files.length) : files.length;

        for (int i = 0; i < maxFiles; i++) {

            status = true;
            if (channel.isStopped()) {
                return true;
            }

            if (files[i].isDirectory()) {
                if (channel.listSubDir()) {
                    long delay = channel.deleteSubDirDelay();
                    if (delay > 0 && (System.currentTimeMillis() - files[i].lastModified()) > (delay * 1000) && files[i].listFiles(null).length == 0) {
                        String[] args = {files[i].getPath()};
                        channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process7", args));
                        files[i].delete();
                    }
                    else {
                        processDir(files[i], target);
                    }
                }
                continue;
            }

            String[] args = {files[i].getPath()};
            long length = files[i].getLength();

            if (!channel.zeroLength() && length == 0) {
                channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process1", args));
                continue;
            }

            SourceFile scrcFile = srcFileMap.get(files[i].getPath());

            // Nouveau fichier
            if (scrcFile == null) {
                scrcFile = files[i];
                channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process3", args));
                scrcFile.init(length);
                srcFileMap.put(scrcFile.getPath(), scrcFile);
            }

            scrcFile.process(length);

            if (scrcFile.isStabilized()) {

                //int c = ((MailSourceFile) file).getNum();
                //LOG.info("Stabilized File - Channel " + channel.getID() + " - " + file.getPath() + " - " + c);
                switch (target.run(".", scrcFile)) {
                    case AbstractTarget.OK:
                        srcFileMap.remove(scrcFile.getPath());
                        scrcFile.delete();
                        break;
                    case AbstractTarget.FAIL:
                        channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process5", args));
                        status = false;
                        if (scrcFile.keepSortOrder()) {
                            return status;
                        }
                        break;
                    case AbstractTarget.KEEP:
                        srcFileMap.remove(scrcFile.getPath());
                        scrcFile.close();
                        break;
                    case AbstractTarget.NOP:
                    default:
                }
            }
            else {
                channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process6", args));
            }

        }
        return status;
    }
}
