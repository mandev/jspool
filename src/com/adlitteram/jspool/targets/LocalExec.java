/**
 * LocalExec.java Copyright (C) 2002 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller
 */
package com.adlitteram.jspool.targets;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.GuiUtils;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.files.SourceFile;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.Dialog;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import org.apache.commons.io.FilenameUtils;

public class LocalExec extends AbstractTarget {

    private JTextField execField;
    private JTextField param1Field;
    private JTextField param2Field;
    private JCheckBox syncCheck;
    private JCheckBox removeCheck;
    public static final String EXECTARGET_NAME = "ExecTarget.Name";
    public static final String EXECTARGET_PARAM1 = "ExecTarget.Param1";
    public static final String EXECTARGET_PARAM2 = "ExecTarget.Param2";
    public static final String EXECTARGET_SYNC = "ExecTarget.Sync";
    public static final String EXECTARGET_REMOVE = "ExecTarget.RemoveSrc";

    @Override
    public String getName() {
        return "Exec";
    }

    @Override
    @SuppressWarnings("empty-statement")
    public int run(String srcDir, SourceFile srcfile) {
        Process p = null;

        File file = srcfile.getFile();

        String str = channel.getStringProp(EXECTARGET_NAME) + " "
                + replace(channel.getStringProp(EXECTARGET_PARAM1), file)
                + " \"" + file.getPath() + "\" "
                + replace(channel.getStringProp(EXECTARGET_PARAM2), file);

        try {
            p = Runtime.getRuntime().exec(str);

            if (channel.getBooleanProp(EXECTARGET_SYNC, true)) {
                try (InputStreamReader esr = new InputStreamReader(p.getInputStream());
                        BufferedReader er = new BufferedReader(esr);
                        InputStreamReader isr = new InputStreamReader(p.getErrorStream());
                        BufferedReader in = new BufferedReader(isr)) {

                    p.waitFor();
                    while (in.readLine() != null) ;
                    while (er.readLine() != null) ;
                }
            }
            return (channel.getBooleanProp(EXECTARGET_REMOVE, true)) ? OK : KEEP;
        } catch (IOException | InterruptedException e) {
            channel.logWarning(channel.getStringProp(Channel.ID) + " - LocalExec.run() ", e);
            if (p != null) {
                p.destroy();
            }
            return FAIL;
        }
    }

    private String replace(String str, File file) {
        str = str.replace("{PATH}", file.getPath());
        str = str.replace("{NAME}", file.getName());
        str = str.replace("{PREFIX}", FilenameUtils.getBaseName(file.getName()));
        str = str.replace("{SUFFIX}", FilenameUtils.getExtension(file.getName()));
        return str;
    }

    @Override
    public JPanel buildPanel(Dialog parent) {

        removeCheck = new JCheckBox(Message.get("localexec.message5"), channel.getBooleanProp(EXECTARGET_REMOVE, true));

        execField = new JTextField(channel.getStringProp(EXECTARGET_NAME), 25);
        JButton browseButton = GuiUtils.createBrowseButton(execField, execField, null, "open");

        param1Field = new JTextField(channel.getStringProp(EXECTARGET_PARAM1), 25);
        param2Field = new JTextField(channel.getStringProp(EXECTARGET_PARAM2), 25);
        syncCheck = new JCheckBox(Message.get("localexec.message4"), channel.getBooleanProp(EXECTARGET_SYNC, true));

        int w0[] = {5, 0, 5, 0, 5, 0, 5};
        int h0[] = {5, 0, 0, 0, 0, 0, 5};
        HIGConstraints c0 = new HIGConstraints();
        HIGLayout l0 = new HIGLayout(w0, h0);
        l0.setColumnWeight(4, 1);

        JPanel p0 = new JPanel(l0);
        p0.add(new JLabel(Message.get("localexec.exec")), c0.xy(2, 2, "r"));
        p0.add(execField, c0.xy(4, 2, "lr"));
        p0.add(browseButton, c0.xy(6, 2, "l"));
        p0.add(new JLabel(Message.get("localexec.beforeparams")), c0.xy(2, 3, "r"));
        p0.add(removeCheck, c0.xy(4, 6, "l"));
        p0.add(param1Field, c0.xy(4, 3, "lr"));
        p0.add(new JLabel(Message.get("localexec.afterparams")), c0.xy(2, 4, "r"));
        p0.add(param2Field, c0.xy(4, 4, "lr"));
        p0.add(syncCheck, c0.xy(4, 5, "l"));

        return p0;
    }

    @Override
    public boolean setParameters() {
        channel.setProperty(EXECTARGET_REMOVE, String.valueOf(removeCheck.isSelected()));
        channel.setProperty(EXECTARGET_NAME, execField.getText());
        channel.setProperty(EXECTARGET_PARAM1, param1Field.getText());
        channel.setProperty(EXECTARGET_PARAM2, param2Field.getText());
        channel.setProperty(EXECTARGET_SYNC, String.valueOf(syncCheck.isSelected()));
        return true;
    }
}
