package com.adlitteram.jspool.files;

import com.adlitteram.jspool.utils.Utils;
import java.io.File;
import java.io.FileInputStream;
import java.io.FilenameFilter;
import java.io.IOException;
import java.util.Arrays;
import java.util.Comparator;
import java.util.regex.Pattern;
import java.util.zip.Adler32;
import java.util.zip.CheckedInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LocalFile extends SourceFile implements FilenameFilter {

    private static final Logger LOG = LoggerFactory.getLogger(LocalFile.class);

    public static final int SORT_ALPHA = 1;
    public static final int SORT_ALPHA_INV = 2;
    public static final int SORT_DATE = 3;
    public static final int SORT_DATE_INV = 4;

    private File file;
    private long checksum = 0;
    private long length = -1;
    private Pattern regexp;	// for FilenameFilter
    private boolean useChecksum;

    public LocalFile(File file) {
        this(file, 0, false, SORT_NONE);
    }

    public LocalFile(File file, int maxStab, boolean uc, int sort) {
        super(maxStab);
        this.file = file;
        useChecksum = uc;
        sortOrder = sort;
    }

    @Override
    public String getPath() {
        return file.getPath();
    }

    @Override
    public File getFile() {
        return file;
    }

    @Override
    public long getLength() {
        return file.length();
    }

    @Override
    public long lastModified() {
        return file.lastModified();
    }

    @Override
    public boolean exists() {
        return file.exists();
    }

    @Override
    public boolean canRead() {
        return file.canRead();
    }

    @Override
    public boolean canWrite() {
        return file.canWrite();
    }

    @Override
    public String getName() {
        return file.getName();
    }

    @Override
    public boolean delete() {
        for (int j = 0; j < 5; j++) {
            if (file.delete()) {
                return true;
            }
            LOG.info("Error deleting file: " + file.getPath());
            System.gc();
            Utils.sleep(1000L);
        }
        return false;
    }

    @Override
    public boolean close() {
        return true;
    }

    @Override
    public void init(long newLength) {
        length = newLength;
        if (useChecksum) {
            checksum = computeChecksum();
        }
    }

    @Override
    public void process(long newLength) {
        try {
            // Check if readable
            (new FileInputStream(file)).close();
        }
        catch (IOException ex) {
            return;
        }

        if (newLength != length) {
            length = newLength;
            stability = 0;
            return;
        }

        if (useChecksum) {
            long cs = computeChecksum();
            if (cs != checksum) {
                checksum = cs;
                stability = 0;
                return;
            }
        }

        stability++;
    }

    // Compute an adler checksum on the file
    private long computeChecksum() {
        Adler32 inChecker = new Adler32();
        byte[] data = new byte[2048];

        try (var fis = new FileInputStream(file);
                var cin = new CheckedInputStream(fis, inChecker)) {
            while (cin.read(data, 0, data.length) != -1);
        }
        catch (IOException ex) {
            ex.printStackTrace();
        }

        return inChecker.getValue();
    }

    @Override
    public boolean isDirectory() {
        return file.isDirectory();
    }

    @Override
    public SourceFile[] listFiles(Pattern regexp) {
        this.regexp = regexp;
        File[] files = file.listFiles(this);
        LocalFile[] lf = new LocalFile[files.length];
        for (int i = 0; i < files.length; i++) {
            lf[i] = new LocalFile(files[i], maxStability, useChecksum, sortOrder);
        }
        switch (sortOrder) {
            case SORT_ALPHA:
                Arrays.sort(lf, alphaSort);
                break;
            case SORT_ALPHA_INV:
                Arrays.sort(lf, alphaInvSort);
                break;
            case SORT_DATE:
                Arrays.sort(lf, dateSort);
                break;
            case SORT_DATE_INV:
                Arrays.sort(lf, dateInvSort);
                break;
        }

        return lf;
    }

    // Alphabetical Comparator
    public final static Comparator alphaSort = (Comparator) (Object a, Object b) -> {
        String sa = ((LocalFile) a).getName();
        String sb = ((LocalFile) b).getName();
        return sa.compareToIgnoreCase(sb);
    };

    // Reverse Alphabetical Comparator
    public final static Comparator alphaInvSort = (Comparator) (Object a, Object b) -> {
        String sa = ((LocalFile) a).getName();
        String sb = ((LocalFile) b).getName();
        return -sa.compareToIgnoreCase(sb);
    };

    // Date Comparator
    public final static Comparator dateSort = (Comparator) (Object a, Object b) -> {
        long sa = ((LocalFile) a).lastModified();
        long sb = ((LocalFile) b).lastModified();
        return (int) (sa - sb);
    };

    // Reverse Date Comparator
    public final static Comparator dateInvSort = (Comparator) (Object a, Object b) -> {
        long sa = ((LocalFile) a).lastModified();
        long sb = ((LocalFile) b).lastModified();
        return (int) (sb - sa);
    };

    // Tests if a specified file should be included in a file list. (filenameFilter)
    @Override
    public boolean accept(File dir, String name) {
        if (regexp == null) {
            return true;
        }
        File nfile = new File(dir, name);
        if (nfile.isDirectory()) {
            return true;
        }
        return regexp.matcher(name).matches();
    }
}
