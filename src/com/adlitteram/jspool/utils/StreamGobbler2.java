/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.adlitteram.jspool.utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StreamGobbler2 extends Thread {

    private static final Logger logger = LoggerFactory.getLogger(StreamGobbler2.class);

    private InputStream is;
    private OutputStream os;

    public StreamGobbler2(InputStream is) {
        this(is, null);
    }

    public StreamGobbler2(InputStream is, OutputStream os) {
        this.is = is;
        this.os = os;
    }

    @Override
    @SuppressWarnings("empty-statement")
    public void run() {
        try {
            InputStreamReader isr = new InputStreamReader(is);
            BufferedReader br = new BufferedReader(isr);
            if (os == null) {
                while (br.readLine() != null)  ;
            } else {
                String line;
                PrintWriter pw = new PrintWriter(os);
                while ((line = br.readLine()) != null) {
                    pw.println(line);
                }
            }
        } catch (IOException ioe) {
            logger.warn("", ioe);
        }
    }
}
