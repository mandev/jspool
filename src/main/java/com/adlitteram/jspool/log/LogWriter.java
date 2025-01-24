package com.adlitteram.jspool.log;

import java.util.logging.LogRecord;

public interface LogWriter {

  void write(LogRecord logRecord);

  void close();

  void flush();
}
