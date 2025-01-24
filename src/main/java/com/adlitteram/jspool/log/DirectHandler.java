package com.adlitteram.jspool.log;

import java.util.logging.Handler;
import java.util.logging.LogRecord;

public class DirectHandler extends Handler {

  private final LogWriter logWriter;

  public DirectHandler(LogWriter target) {
    this.logWriter = target;
  }

  @Override
  public void publish(LogRecord logRecord) {
    logWriter.write(logRecord);
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
