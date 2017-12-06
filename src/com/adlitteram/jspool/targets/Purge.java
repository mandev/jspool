package com.adlitteram.jspool.targets;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.files.SourceFile;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.Dialog;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;

public class Purge extends AbstractTarget {

    public static final String PURGE_DAY = "Target.Purge.Day";
    public static final String PURGE_HOUR = "Target.Purge.Hour";
    public static final String PURGE_MIN = "Target.Purge.Min";
    public static final String PURGE_SEC = "Target.Purge.Sec";
    public static final String PURGE_SIZE = "Target.Purge.SIZE";
    private JTextField dayField;
    private JTextField hourField;
    private JTextField minField;
    private JTextField secField;
    private JTextField sizeField;

    @Override
    public String getName() {
        return "Purge";
    }

    @Override
    public int run(String srcDir, SourceFile srcfile) {
        int status = NOP;


        long time = channel.getLongProp(PURGE_DAY, 0) * 1000 * 60 * 60 * 24;
        time += channel.getLongProp(PURGE_HOUR, 0) * 1000 * 60 * 60;
        time += channel.getLongProp(PURGE_MIN, 0) * 1000 * 60;
        time += channel.getLongProp(PURGE_SEC, 0) * 1000;

        long now = System.currentTimeMillis();
        long modified = srcfile.lastModified();

        if (modified > 0 && time > 0) {
            if ((now - modified) > time) {
                status = OK;
            }
        }
        else if (modified > 0 && time < 0) {
            if ((now - modified) < -time) {
                status = OK;
            }
        }
        else if (modified > 0) {
            status = OK;
        }
        else {
            status = FAIL;
        }

        if (status == OK) {
            long length = srcfile.getLength();
            long size = channel.getLongProp(PURGE_SIZE, 0) * 1024;

            if (size >= 0) {
                if (length >= size) {
                    status = OK;
                }
                else {
                    status = NOP;
                }
            }
            else if (size < 0) {
                if (length < -size) {
                    status = OK;
                }
                else {
                    status = NOP;
                }
            }
        }

//        if (status == OK) {
//            String filePath = FilenameUtils.separatorsToUnix(FilenameUtils.normalize(srcfile.getPath()));
//            String dirPath = FilenameUtils.separatorsToUnix(FilenameUtils.normalize(srcDir));
//            if (filePath.equals(dirPath)) {
//                status = NOP;
//            }
//        }

        if (status == OK) {
            String[] args = {srcfile.getPath()};
            channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.purge1", args));
        }

        return status;
    }

    @Override
    public JPanel buildPanel(Dialog parent) {
        dayField = new JTextField(channel.getStringProp(PURGE_DAY), 5);
        hourField = new JTextField(channel.getStringProp(PURGE_HOUR), 5);
        minField = new JTextField(channel.getStringProp(PURGE_MIN), 5);
        secField = new JTextField(channel.getStringProp(PURGE_SEC), 5);
        sizeField = new JTextField(channel.getStringProp(PURGE_SIZE), 5);

        int w0[] = {5, 0, 5, 0, 5, 0, 5, 0, 5, 0, 5};
        int h0[] = {5, 0, 0, 0, 5, 0, 5};
        HIGLayout l0 = new HIGLayout(w0, h0);
        HIGConstraints c0 = new HIGConstraints();
        l0.setColumnWeight(1, 1);
        l0.setColumnWeight(11, 1);

        JPanel p0 = new JPanel(l0);
        p0.add(new JLabel(Message.get("purge.day")), c0.xy(4, 2, "l"));
        p0.add(new JLabel(Message.get("purge.hour")), c0.xy(6, 2, "l"));
        p0.add(new JLabel(Message.get("purge.min")), c0.xy(8, 2, "l"));
        p0.add(new JLabel(Message.get("purge.sec")), c0.xy(10, 2, "l"));

        p0.add(new JLabel(Message.get("purge.modified")), c0.xy(2, 4, "r"));
        p0.add(dayField, c0.xy(4, 4));
        p0.add(hourField, c0.xy(6, 4));
        p0.add(minField, c0.xy(8, 4));
        p0.add(secField, c0.xy(10, 4));

        p0.add(new JLabel(Message.get("purge.size")), c0.xy(2, 6, "r"));
        p0.add(sizeField, c0.xywh(4, 6, 3, 1));
        p0.add(new JLabel("Ko"), c0.xy(8, 6, "l"));

        return p0;
    }

    @Override
    public boolean setParameters() {
        channel.setProperty(PURGE_DAY, dayField.getText());
        channel.setProperty(PURGE_HOUR, hourField.getText());
        channel.setProperty(PURGE_MIN, minField.getText());
        channel.setProperty(PURGE_SEC, secField.getText());
        channel.setProperty(PURGE_SIZE, sizeField.getText());
        return true;
    }
}
