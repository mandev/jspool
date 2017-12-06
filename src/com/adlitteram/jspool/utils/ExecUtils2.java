/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.adlitteram.jspool.utils;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import org.apache.poi.util.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author EDEVILLER
 */
public class ExecUtils2 {

    private static final Logger logger = LoggerFactory.getLogger(ExecUtils2.class);

    public static int exec(String app, String[] opts, String dir, OutputStream bos) {
        String[] cmdArray = new String[opts.length + 1];
        cmdArray[0] = app;
        System.arraycopy(opts, 0, cmdArray, 1, opts.length);

        int status;
        Process proc = null;
        InputStream es = null;
        InputStream is = null;
        OutputStream os = null;

        try {
            proc = Runtime.getRuntime().exec(cmdArray, null, createDir(dir));

            os = proc.getOutputStream();

            es = proc.getErrorStream();
            StreamGobbler2 errorGobbler = new StreamGobbler2(es, bos);

            is = proc.getInputStream();
            StreamGobbler2 outputGobbler = new StreamGobbler2(is, bos);

            errorGobbler.start();
            outputGobbler.start();
            status = proc.waitFor();
        }
        catch (InterruptedException ex) {
            status = 2;
            logger.warn("Error executing external application: {} - {}", app, ex.getMessage());
        }
        catch (IOException ex) {
            status = 1;
            logger.warn("Error executing external application: {} - {}", app, ex.getMessage());
        }
        finally {
            IOUtils.closeQuietly(is);
            IOUtils.closeQuietly(es);
            IOUtils.closeQuietly(os);
            if (proc != null) {
                proc.destroy();
                proc = null;
            }
        }

        return status;
    }

    private static File createDir(String dirname) {
        File dirFile = new File(dirname);
        if (!dirFile.exists()) {
            dirFile.mkdirs();
        }
        return dirFile;
    }
}
