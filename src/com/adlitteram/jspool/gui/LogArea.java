/**
 * LogArea.java Copyright (C) 2000 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller
 */
package com.adlitteram.jspool.gui;

import com.adlitteram.jspool.log.LogWriter;
import java.util.logging.LogRecord;
import javax.swing.DefaultListModel;
import javax.swing.JList;
import javax.swing.ListSelectionModel;
import javax.swing.SwingUtilities;
import org.apache.commons.lang3.time.FastDateFormat;

public class LogArea extends JList implements LogWriter {

    private final FastDateFormat FMT = FastDateFormat.getDateTimeInstance(FastDateFormat.SHORT, FastDateFormat.MEDIUM);
    private DefaultListModel<String> model;
    private int maxLogSize;
    private int deleteSize;

    public LogArea() {
        this(2000);
    }

    public LogArea(int size) {
        super();

        maxLogSize = size;
        deleteSize = (int) ((float) size * .25f);

        model = new DefaultListModel<>();
        setModel(model);
        setSelectionMode(ListSelectionModel.SINGLE_INTERVAL_SELECTION);
        setDragEnabled(true);
        setFixedCellWidth(3000);
        setFixedCellHeight(Math.round((float) getFontMetrics(getFont()).getHeight() * 1.1f));
    }

    public void reset() {
        SwingUtilities.invokeLater(new Runnable() {
            @Override
            public void run() {
                model = new DefaultListModel<>();
                setModel(model);
            }
        });
    }

    @Override
    public void write(LogRecord record) {
        final StringBuilder sb = (new StringBuilder(128)).append(FMT.format(record.getMillis())).append(": ").append(record.getMessage());

        SwingUtilities.invokeLater(new Runnable() {
            @Override
            public void run() {
                if (model.getSize() > maxLogSize) {
                    model.removeRange(0, deleteSize);
                }
                model.addElement(sb.toString());
                int lastIndex = model.getSize() - 1;
                if (lastIndex >= 0) {
                    ensureIndexIsVisible(lastIndex);
                }
            }
        });
    }

    @Override
    public void flush() {
    }

    @Override
    public void close() {
    }
}
