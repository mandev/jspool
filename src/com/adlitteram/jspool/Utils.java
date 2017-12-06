/**
 * Utils.java Copyright (C) 2002 Emmanuel Deviller Portions copyright (C)
 * 1998-2000 Romain Guy
 *
 * @version 2.0
 * @author Emmanuel Deviller
 */
package com.adlitteram.jspool;

import java.awt.Toolkit;
import java.io.File;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Utils {

    private static final Logger logger = LoggerFactory.getLogger(Utils.class);

    public static String cleanFTPPath(String path) {
        path = FilenameUtils.separatorsToUnix(path);
        path = path.replaceAll("//*", "/");
        path = FilenameUtils.normalize(path);
        path = FilenameUtils.separatorsToUnix(path);
        return path;
    }

    // Beep
    public static void beep() {
        Toolkit.getDefaultToolkit().beep();
    }

    // Return File Base Name (after last / and before .)
    public static String getBasename(File file) {
        return getPrefix(file.getName());
    }

    public static String getBasename(String filename) {
        return getPrefix(new File(filename).getName());
    }

    public static String getFilename(String filename) {
        return new File(filename).getName();
    }

    public static String getDirname(String filename) {
        return new File(filename).getParent();
    }

    // Return String before dot
    public static String getPrefix(String str) {
        int i = str.lastIndexOf('.');
        return (i < 0) ? str : str.substring(0, i);
    }

    // Return String after dot
    public static String getSuffix(String str) {
        int i = str.lastIndexOf('.');
        if (i > 0 && i < (str.length() - 1)) {
            return str.substring(i + 1);
        }
        return null;
    }

    public static String getExtension(File file) {
        String str = getSuffix(file.getName());
        if (str == null || str.length() == 0) {
            return "";
        }
        return "." + str;
    }

    public static File getExtFile(File file, String ext) {
        String name = file.getName();
        int i = name.lastIndexOf('.');
        if (i < 0) {
            return new File(file.getParent(), name + "." + ext);
        }
        return new File(file.getParent(), name.substring(0, i) + "." + ext);
    }

    // Normalisation XML
    public static void appendAndNormalize(StringBuffer buffer, String s) {
        if (s == null) {
            return;
        }
        int len = s.length();
        for (int i = 0; i < len; i++) {
            char ch = s.charAt(i);
            switch (ch) {
                case '<':
                    buffer.append("&lt;");
                    break;
                case '>':
                    buffer.append("&gt;");
                    break;
                case '&':
                    buffer.append("&amp;");
                    break;
                case '"':
                    buffer.append("&quot;");
                    break;
                case '\r':
                case '\n':
                    buffer.append("&#");
                    buffer.append(Integer.toString(ch));
                    buffer.append(';');
                    break;
                default:
                    buffer.append(ch);
            }
        }
    }

    public static String capitalize(String text) {
        if (text == null) {
            return null;
        }

        StringBuilder sb = new StringBuilder(text.length());
        boolean up = true;

        for (int j = 0; j < text.length(); j++) {
            char c = text.charAt(j);
            if (Character.isWhitespace(c)) {
                sb.append(c);
                up = true;
            } else {
                if (up) {
                    sb.append(Character.toUpperCase(c));
                    up = false;
                } else {
                    sb.append(Character.toLowerCase(c));
                }
            }
        }

        return sb.toString();
    }

    public static void sleep(long period) {
        try {
            Thread.sleep(period);
        } catch (InterruptedException e) {
        }
    }
}
