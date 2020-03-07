package com.adlitteram.jspool.utils;

import com.adlitteram.jasmin.utils.StreamGobbler;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ExecUtils {

    private static final Logger LOG = LoggerFactory.getLogger(ExecUtils.class);

    public static int exec(String app, String[] opts, String dir, OutputStream bos) {
        String[] cmdArray = new String[opts.length + 1];
        cmdArray[0] = app;
        System.arraycopy(opts, 0, cmdArray, 1, opts.length);

        int status;
        Process proc = null;
        try {
            proc = Runtime.getRuntime().exec(cmdArray, null, createDir(dir));
            try (OutputStream os = proc.getOutputStream();
                    InputStream es = proc.getErrorStream();
                    InputStream is = proc.getInputStream()) {

                StreamGobbler errorGobbler = new StreamGobbler(es, bos, "ERR");
                StreamGobbler outputGobbler = new StreamGobbler(is, bos, "OUT");
                errorGobbler.start();
                outputGobbler.start();
                status = proc.waitFor();
            }
        }
        catch (InterruptedException ex) {
            status = 2;
            LOG.warn("Error executing external application: {} - {}", app, ex.getMessage());
        }
        catch (IOException ex) {
            status = 1;
            LOG.warn("Error executing external application: {} - {}", app, ex.getMessage());
        }
        finally {
            if (proc != null) {
                proc.destroy();
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
