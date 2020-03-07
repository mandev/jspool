package com.adlitteram.jspool.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Unzipper {

    private static final Logger LOG = LoggerFactory.getLogger(Unzipper.class);

    public static boolean unzip(String input, String output, String error) {

        try (var fin = new FileInputStream(input);
                var zin = new ZipInputStream(fin)) {

            ZipEntry entry;
            while ((entry = zin.getNextEntry()) != null) {
                String filename = output + File.separator + entry.getName();
                Path path = Paths.get(filename) ;
                Files.createDirectories(path.getParent()) ;
                LOG.info("unzipping : " + filename);
                Files.copy(zin, path);
            }
            LOG.info(input + " unzippe avec succes");
        }
        catch (IllegalArgumentException | IOException e) {
            LOG.warn(input + " - unzip error : ", e);
            File ifile = new File(input);
            File efile = new File(error, ifile.getName());
            doError(ifile, efile);
            return false;
        }

        return true;
    }

    private static void doError(File ifile, File efile) {
        try {
            FileUtils.copyFile(ifile, efile);
            ifile.delete();
        }
        catch (IOException e) {
            LOG.warn(ifile.getPath() + " - copy error : ", e);
        }
    }
}
