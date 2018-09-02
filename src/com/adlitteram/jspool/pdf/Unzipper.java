/*
 * PdfDecryptor.java
 *
 */
package com.adlitteram.jspool.pdf;

import com.adlitteram.jspool.Channel;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

import org.slf4j.Logger;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.apache.commons.io.FileUtils;
import org.slf4j.LoggerFactory;

public class Unzipper {

    private static final Logger logger = LoggerFactory.getLogger(Unzipper.class);
    //
    private Channel channel;

    /**
     * Creates a new instance of PdfDecryptor
     */
    public Unzipper(Channel channel) {
        this.channel = channel;
    }

    public boolean unzip(String input, String output, String error) {

        byte[] buf = new byte[1024];
        ZipInputStream zin = null;

        File ifile = new File(input);
        File efile = new File(error, ifile.getName());

        try {
            zin = new ZipInputStream(new FileInputStream(input));

            ZipEntry entry;
            while ((entry = zin.getNextEntry()) != null) {
                String filename = output + File.separator + entry.getName();
                File file = new File(filename);
                if (!file.getParentFile().exists()) {
                    file.getParentFile().mkdirs();
                }
                OutputStream out = new FileOutputStream(filename);
                logger.info("unzipping : " + filename);
                int len;
                while ((len = zin.read(buf)) > 0) {
                    out.write(buf, 0, len);
                }
                out.close();
            }
            zin.close();
            logger.info(input + " unzippe avec succes");
        }
        catch (IllegalArgumentException e) {
            try {
                if (zin != null) {
                    zin.close();
                }
            }
            catch (IOException e1) {
            }
            logger.warn(input + " - unzip error : ", e);
            doError(ifile, efile);
            return false;
        }
        catch (IOException e) {
            try {
                if (zin != null) {
                    zin.close();
                }
            }
            catch (IOException e1) {
            }
            logger.warn(input + " - unzip error : ", e);
            doError(ifile, efile);
            return false;
        }

        return true;
    }

    private void doError(File ifile, File efile) {
        try {
            FileUtils.copyFile(ifile, efile);
            ifile.delete();
        }
        catch (IOException e) {
            logger.warn(ifile.getPath() + " - copy error : ", e);
        }
    }
}
