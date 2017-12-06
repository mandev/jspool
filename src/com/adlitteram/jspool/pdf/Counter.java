package com.adlitteram.jspool.pdf;

import com.adlitteram.jspool.Update;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;

public class Counter {

    public static final String HOME_DIR = System.getProperty("user.home") + File.separator;
    public static final String PROG_DIR = System.getProperty("user.dir") + File.separator;
    public static final String USER_DIR1 = HOME_DIR + "." + Update.getNAME() + File.separator;
    public static final String USER_DIR2 = PROG_DIR + "." + Update.getNAME() + File.separator;
    public static final String USER_FILE1 = USER_DIR1 + "data.bin";
    public static final String USER_FILE2 = USER_DIR2 + "data.bin";
    private static int number;      // Decrypt number


    static {
        // Create Directory
        File file = new File(USER_DIR1);
        if (!file.exists()) file.mkdirs();

        file = new File(USER_DIR2);
        if (!file.exists()) file.mkdirs();

        // Load Counter
        load(USER_FILE1);
        load(USER_FILE2);
    }

    private Counter() {
    }

    public static synchronized int next() {
        number++;
        save(USER_FILE1);
        save(USER_FILE2);
        return number;
    }

    private static synchronized void load(String filename) {
        BufferedReader in = null;

        try {
            in = new BufferedReader(new FileReader(filename));
            number = Math.max(number, Integer.parseInt(in.readLine()));
        }
        catch (IOException | NumberFormatException e) {
            e.printStackTrace();
            number = Math.max(number, 1);
        }
        finally {
            try {
                if (in != null) in.close();
            }
            catch (IOException e) {
            }
        }
    }

    private static synchronized void save(String filename) {
        FileWriter out = null;
        try {
            out = new FileWriter(filename);
            out.write(number + "\n");
        }
        catch (Exception e) {
            e.printStackTrace();
        }
        finally {
            try {
                if (out != null) out.close();
            }
            catch (IOException e) {
            }
        }
    }
}
