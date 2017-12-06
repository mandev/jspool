/*
 * JDBCLogHandler.java
 *
 * Created on 14 juin 2005, 21:21
 *
 * To change this template, choose Tools | Options and locate the template under
 * the Source Creation and Management node. Right-click the template and choose
 * Open. You can then make changes to the template in the Source Editor.
 */
package com.adlitteram.jspool.log;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.logging.Handler;
import java.util.logging.LogRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author EDEVILLER
 */
public class JDBCLogHandler extends Handler {

    private static final Logger logger = LoggerFactory.getLogger(JDBCLogHandler.class);
    /**
     * A string that contains the classname of the JDBC driver.
     * This value is filled by the constructor.
     */
    String driverString;
    /**
     * A string that contains the connection string used by the
     * JDBC driver. This value is filled by the constructor.
     */
    String connectionString;
    /**
     * Used to hold the connection to the JDBC data source.
     */
    Connection connection;
    /**
     * A SQL statement used to insert into the log table.
     */
    protected final static String insertSQL =
            "insert into log (level,logger,message,sequence,"
            + "sourceClass,sourceMethod,threadID,timeEntered)"
            + "values(?,?,?,?,?,?,?,?)";
    /**
     * A SQL statement used to clear the log table.
     */
    protected final static String clearSQL = "delete from log;";
    /**
     * A PreparedStatement object used to hold the main
     * insert statement.
     */
    protected PreparedStatement prepInsert;
    /**
     * A PreparedStatement object used to hold the clear
     * statement.
     */
    protected PreparedStatement prepClear;

    /**
     * @param driverString The JDBC driver to use.
     * @param connectionString The connection string that
     * specifies the database to use.
     */
    public JDBCLogHandler(String driverString, String url, String user, String password) {

        try {
            this.driverString = driverString;
            Class.forName(driverString);
            connection = DriverManager.getConnection(url, user, password);
            prepInsert = connection.prepareStatement(insertSQL);
            prepClear = connection.prepareStatement(clearSQL);
        }
        catch (ClassNotFoundException e) {
            logger.warn("JDBCLogHandler - Error on open: ", e);
        }
        catch (SQLException e) {
            logger.warn("JDBCLogHandler - Error on open: " + e);
        }
    }

    public boolean isConnected() {
        try {
            return !connection.isClosed();
        }
        catch (Exception e) {
            return false;
        }
    }

    public void createTables() {
        Statement stmt;

        // try to delete before
        try {
            stmt = connection.createStatement();
        }
        catch (SQLException e) {
            logger.warn("JDBCLogHandler.createTables(1)", e);
            return;
        }

        try {
            stmt.executeUpdate("DROP TABLE log");
        }
        catch (SQLException e) {
            logger.warn("JDBCLogHandler.createTables(2)", e);
        }

        try {
            stmt.executeUpdate(
                    "CREATE TABLE log ("
                    + "level integer NOT NULL,"
                    + "logger varchar(64) NOT NULL,"
                    + "message varchar(512) NOT NULL,"
                    + "sequence integer NOT NULL,"
                    + "sourceClass varchar(64) NOT NULL,"
                    + "sourceMethod varchar(32) NOT NULL,"
                    + "threadID integer NOT NULL,"
                    + "timeEntered datetime NOT NULL)");
        }
        catch (SQLException e) {
            logger.warn("JDBCLogHandler.createTables(3)", e);
        }

    }

    /**
     * Internal method used to truncate a string to a specified width.
     * Used to ensure that SQL table widths are not exceeded.
     *
     * @param str The string to be truncated.
     * @param length The maximum length of the string.
     * @return The string truncated.
     */
    static public String truncate(String str, int length) {
        return (str.length() < length) ? str : str.substring(0, length);
    }

    /**
     * Overridden method used to capture log entries and put them
     * into a JDBC database.
     *
     * @param record The log record to be stored.
     */
    @Override
    public void publish(LogRecord record) {
        // first see if this entry should be filtered out

        if (getFilter() != null) {
            if (!getFilter().isLoggable(record)) {
                return;
            }
        }

        // now store the log entry into the table
        try {
            prepInsert.setInt(1, record.getLevel().intValue());
            prepInsert.setString(2, truncate(record.getLoggerName(), 63));
            prepInsert.setString(3, truncate(record.getMessage(), 512));
            prepInsert.setLong(4, record.getSequenceNumber());
            prepInsert.setString(5, truncate(record.getSourceClassName(), 63));
            prepInsert.setString(6, truncate(record.getSourceMethodName(), 31));
            prepInsert.setInt(7, record.getThreadID());
            prepInsert.setTimestamp(8, new Timestamp(System.currentTimeMillis()));
            prepInsert.executeUpdate();
        }
        catch (SQLException e) {
            logger.warn("Error on open: ", e);
        }
    }

    /**
     * Called to close this log handler.
     */
    @Override
    public void close() {
        try {
            if (connection != null) {
                connection.close();
            }
        }
        catch (SQLException e) {
            logger.warn("Error on close: ", e);
        }
    }

    /**
     * Called to clear all log entries from the database.
     */
    public void clear() {
        try {
            prepClear.executeUpdate();
        }
        catch (SQLException e) {
            logger.warn("Error on clear: ", e);
        }
    }

    /**
     * Not really used, but required to implement a handler. Since
     * all data is immediately sent to the database, there is no
     * reason to flush.
     */
    @Override
    public void flush() {
    }
}
