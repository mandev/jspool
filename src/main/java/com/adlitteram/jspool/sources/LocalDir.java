package com.adlitteram.jspool.sources;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.GuiUtils;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.files.LocalFile;
import com.adlitteram.jspool.targets.AbstractTarget;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.io.File;
import javax.swing.*;
import org.apache.commons.io.FilenameUtils;

public class LocalDir extends AbstractSource {

    public static final String SOURCE_DIR = "Source.Dir";
    public static final String SOURCE_CHECK = "Source.Check";
    public static final String SOURCE_SORT = "source.sort";
    public static final String[] sortArray = {
        Message.get("source.sort.None"),
        Message.get("source.sort.Alpha"),
        Message.get("source.sort.AlphaInv"),
        Message.get("source.sort.Date"),
        Message.get("source.sort.DateInv")
    };
    private JTextField sourceField;
    private JCheckBox checksumCheck;
    private JComboBox sortCombo;

    @Override
    public String getName() {
        return "File";
    }

    @Override
    public boolean run(AbstractTarget target) {
        int stability = channel.getStability();
        boolean checksum = channel.getBooleanProp(SOURCE_CHECK, true);
        String srcDir = FilenameUtils.normalize(channel.getStringProp(SOURCE_DIR));
        int sort = channel.getIntProp(SOURCE_SORT, 0);

        LocalFile srcFile = new LocalFile(new File(srcDir), stability, checksum, sort);
        return doRun(srcDir, srcFile, target);
    }

    public boolean doRun(String srcDir, LocalFile srcFile, AbstractTarget target) {
        if (!srcFile.exists()) {
            channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.run1", new String[]{srcFile.getPath()}));
            return false;
        }

        if (!srcFile.isDirectory()) {
            channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.run2", new String[]{srcFile.getPath()}));
            return false;
        }

        return processDir(srcDir, srcFile, target);
    }

    @Override
    public JPanel buildPanel() {
        sourceField = new JTextField(channel.getStringProp(SOURCE_DIR), 20);
        JButton browseButton = GuiUtils.createDirButton(sourceField);

        checksumCheck = new JCheckBox(Message.get("source.checksum"), channel.getBooleanProp(SOURCE_CHECK, true));
        checksumCheck.setBorder(BorderFactory.createEmptyBorder(3, 0, 3, 0));

        sortCombo = new JComboBox(sortArray);
        sortCombo.setSelectedIndex(channel.getIntProp(SOURCE_SORT, 0));

        int w0[] = {5, 0, 5, 0, 5, 0, 5};
        int h0[] = {5, 0, 0, 0, 0, 5};
        HIGLayout l0 = new HIGLayout(w0, h0);
        HIGConstraints c0 = new HIGConstraints();
        l0.setColumnWeight(4, 1);

        JPanel p0 = new JPanel(l0);
        p0.add(new JLabel(Message.get("source.srcdir")), c0.xy(2, 2, "r"));
        p0.add(sourceField, c0.xy(4, 2, "lr"));
        p0.add(browseButton, c0.xy(6, 2, "l"));
        p0.add(checksumCheck, c0.xy(4, 4, "l"));
        p0.add(new JLabel(Message.get("source.sortorder")), c0.xy(2, 5, "r"));
        p0.add(sortCombo, c0.xy(4, 5, "l"));
        return p0;
    }

    @Override
    public boolean setParameters() {
        channel.setProperty(SOURCE_DIR, sourceField.getText());
        channel.setProperty(SOURCE_CHECK, String.valueOf(checksumCheck.isSelected()));
        channel.setProperty(SOURCE_SORT, String.valueOf(sortCombo.getSelectedIndex()));
        return true;
    }
}
