package com.adlitteram.jspool.targets;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.GuiUtils;
import com.adlitteram.jspool.files.SourceFile;
import com.adlitteram.jspool.pdf.PdfBuilder;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.Dialog;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;

public class PdfBuild extends AbstractTarget {

    public static final String PDF_BUILDER_DIR1 = "pdf.builder.Dir1";
    public static final String PDF_BUILDER_DIR2 = "pdf.builder.Dir2";
    private JTextField target1Field;
    private JTextField target2Field;

    @Override
    public String getName() {
        return "PDF Build";
    }

    @Override
    public int run(String srcDir, SourceFile srcfile) {
        int status = FAIL;

        String cnfDir = channel.getStringProp(PDF_BUILDER_DIR1);
        String errorDir = channel.getStringProp(PDF_BUILDER_DIR2);

        if (cnfDir != null && errorDir != null) {
            PdfBuilder decryptor = new PdfBuilder(channel);
            if (decryptor.build(srcfile.getPath(), cnfDir, errorDir)) {
                status = OK;
            }
        }

        return status;
    }

    @Override
    public JPanel buildPanel(Dialog parent) {
        target1Field = new JTextField(channel.getStringProp(PDF_BUILDER_DIR1), 30);
        JButton browse0Button = GuiUtils.createDirButton(target1Field);

        target2Field = new JTextField(channel.getStringProp(PDF_BUILDER_DIR2), 30);
        JButton browse1Button = GuiUtils.createDirButton(target2Field);

        int w[] = {5, 0, 5, 0, 5, 0, 5};
        int h[] = {5, 0, 5, 0, 5};
        HIGLayout l = new HIGLayout(w, h);
        HIGConstraints c = new HIGConstraints();
        l.setColumnWeight(4, 1);

        JPanel panel = new JPanel(l);
        panel.add(new JLabel(Message.get("pdfbuild.configdir")), c.xy(2, 2, "r"));
        panel.add(target1Field, c.xy(4, 2, "lr"));
        panel.add(browse0Button, c.xy(6, 2, "l"));
        panel.add(new JLabel(Message.get("pdfbuild.errordir")), c.xy(2, 4, "r"));
        panel.add(target2Field, c.xy(4, 4, "lr"));
        panel.add(browse1Button, c.xy(6, 4, "l"));
        return panel;
    }

    @Override
    public boolean setParameters() {
        channel.setProperty(PDF_BUILDER_DIR1, target1Field.getText());
        channel.setProperty(PDF_BUILDER_DIR2, target2Field.getText());
        return true;
    }
}
