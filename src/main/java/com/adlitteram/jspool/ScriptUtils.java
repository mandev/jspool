package com.adlitteram.jspool;

import com.adlitteram.jspool.utils.FilenameCleaner;
import com.adlitteram.jasmin.image.ImageInfo;
import com.adlitteram.jasmin.image.ImageTool;
import com.adlitteram.jasmin.utils.TarUtils;
import com.adlitteram.jasmin.utils.ZipUtils;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.iptc.IptcDirectory;
import java.awt.Dimension;
import java.io.File;
import java.io.IOException;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import nu.xom.Builder;
import nu.xom.NodeFactory;
import nu.xom.Nodes;

public class ScriptUtils {

    public static ThreadPoolExecutor createFifoExecutor() {
        return createFifoExecutor(0);
    }

    public static ThreadPoolExecutor createFifoExecutor(int p) {
        if (p < 1) {
            p = Runtime.getRuntime().availableProcessors();
        }
        int nproc = Math.max(1, p);
        return new ThreadPoolExecutor(nproc, nproc, 0L, TimeUnit.MILLISECONDS, new LinkedBlockingDeque<>());
    }

    public static Builder createXomBuilder(final boolean processComment, final boolean processProcessingInstruction) {
        NodeFactory factory = new NodeFactory() {

            @Override
            public Nodes makeComment(String str) {
                return processComment ? super.makeComment(str) : new Nodes();
            }

            @Override
            public Nodes makeProcessingInstruction(String str, String str1) {
                return processProcessingInstruction ? super.makeProcessingInstruction(str, str1) : new Nodes();
            }
        };

        return new Builder(factory);
    }

    public static void untargzFileToDir(File zip, File dir) throws IOException {
        TarUtils.untargz(zip, dir);
    }

    public static void targzDirToFile(File dir, File zip) throws IOException {
        TarUtils.targz(dir, zip);
    }

    public static void untarFileToDir(File zip, File dir) throws IOException {
        TarUtils.untar(zip, dir);
    }

    public static void tarDirToFile(File dir, File zip) throws IOException {
        TarUtils.tar(dir, zip);
    }

    public static void unzipFileToDir(File zip, File dir) throws IOException {
        ZipUtils.unzip(zip, dir);
    }

    public static void zipDirToFile(File dir, File zip) throws IOException {
        ZipUtils.zipDirectory(dir, zip);
    }

    public static ImageInfo getImageInfo(File file) {
        return ImageTool.readImageInfo(file);
    }

    public static Dimension getImageDimension(File file) {
        ImageInfo info = ImageTool.readImageInfo(file);
        return new Dimension(info.getWidth(), info.getHeight());
    }

    public static Directory getIptcDirectory(Metadata metadata) {
        return metadata.getFirstDirectoryOfType(IptcDirectory.class);
    }

    public static Directory getExifDirectory(Metadata metadata) {
        return metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
    }

    public static String clean(String str) {
        return FilenameCleaner.clean(str, FilenameCleaner.CHAR_MAP);
    }
}
