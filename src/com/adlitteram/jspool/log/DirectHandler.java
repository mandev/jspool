/*
 * TimeHandler.java
 *
 * Created on 15 juin 2005, 14:37
 *
 * To change this template, choose Tools | Options and locate the template under
 * the Source Creation and Management node. Right-click the template and choose
 * Open. You can then make changes to the template in the Source Editor.
 */
package com.adlitteram.jspool.log;

import java.util.logging.Handler;
import java.util.logging.LogRecord;

/**
 *
 * @author EDEVILLER
 */
public class DirectHandler extends Handler {

    private final LogWriter logWriter;

    public DirectHandler(LogWriter target) {
        this.logWriter = target;
    }

    @Override
    public void publish(LogRecord record) {
        logWriter.write(record);
    }

    @Override
    public void close() {
        logWriter.close();
    }

    @Override
    public void flush() {
        logWriter.flush();
    }
}
