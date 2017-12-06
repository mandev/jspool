/*
 * LogWriter.java
 *
 * Created on 15 juin 2005, 15:26
 *
 * To change this template, choose Tools | Options and locate the template under
 * the Source Creation and Management node. Right-click the template and choose
 * Open. You can then make changes to the template in the Source Editor.
 */

package com.adlitteram.jspool.log;

import java.util.logging.LogRecord;

/**
 *
 * @author EDEVILLER
 */
public interface LogWriter {
   
   public void write(LogRecord record) ;
   
   public void close() ;
   
   public void flush() ;

}
