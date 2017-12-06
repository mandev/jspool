/**
 * AbstractTarget.java Copyright (C) 2002 Emmanuel Deviller
 *
 * @version 1.0
 * @author Emmanuel Deviller
 */
package com.adlitteram.jspool.targets;

import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.Version;
import com.adlitteram.jspool.files.SourceFile;
import java.awt.Dialog;
import javax.swing.JPanel;

abstract public class AbstractTarget {

    public static final int OK = 0;
    public static final int FAIL = 1;
    public static final int NOP = 2;
    public static final int KEEP = 3;
    public Channel channel;

    public void init(Channel ch) {
        channel = ch;
    }

    public void close() {
    }

    public String getRelease() {
        return Version.getRELEASE();
    }

    public String getAuthor() {
        return Version.getAUTHOR();
    }

    abstract public boolean setParameters();

    abstract public JPanel buildPanel(Dialog parent);

    abstract public String getName();

    abstract public int run(String srcDir, SourceFile file);
}
