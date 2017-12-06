/**
 * LocalMove.java Copyright (C) 2002 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller
 */
package com.adlitteram.jspool.targets;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.GuiUtils;
import com.adlitteram.jspool.files.SourceFile;
import com.adlitteram.jspool.pdf.PdfDecryptor;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.Dialog;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;

public class PdfAddInfo extends AbstractTarget {

    public static final String PDF_ADDINFO_DIR1 = "pdf.addinfo.Dir1";
    public static final String PDF_ADDINFO_DIR2 = "pdf.addinfo.Dir2";
    private JTextField target1Field;
    private JTextField target2Field;

    @Override
    public String getName() {
        return "PDF AddInfo";
    }

    @Override
    public int run(String srcDir, SourceFile srcfile) {
        int status = FAIL;

        String cryptDir = channel.getStringProp(PDF_ADDINFO_DIR1);
        String errorDir = channel.getStringProp(PDF_ADDINFO_DIR2);

        if (cryptDir != null && errorDir != null) {
            PdfDecryptor decryptor = new PdfDecryptor(channel);
            if (decryptor.setInfoMap(srcfile.getPath(), cryptDir, errorDir)) {
                status = OK;
            }
        }
        return status;
    }

    @Override
    public JPanel buildPanel(Dialog parent) {
        target1Field = new JTextField(channel.getStringProp(PDF_ADDINFO_DIR1), 30);
        JButton browse0Button = GuiUtils.createDirButton(target1Field);

        target2Field = new JTextField(channel.getStringProp(PDF_ADDINFO_DIR2), 30);
        JButton browse1Button = GuiUtils.createDirButton(target2Field);

        int w0[] = {5, 0, 5, 0, 5, 0, 5};
        int h0[] = {5, 0, 0, 0, 5};
        HIGLayout l0 = new HIGLayout(w0, h0);
        HIGConstraints c0 = new HIGConstraints();
        l0.setColumnWeight(4, 1);

        JPanel p0 = new JPanel(l0);
        p0.add(new JLabel(Message.get("pdfaddinfo.trgdir")), c0.xy(2, 2, "r"));
        p0.add(target1Field, c0.xy(4, 2, "lr"));
        p0.add(browse0Button, c0.xy(6, 2, "l"));
        p0.add(new JLabel(Message.get("pdfaddinfo.errordir")), c0.xy(2, 4, "r"));
        p0.add(target2Field, c0.xy(4, 4, "lr"));
        p0.add(browse1Button, c0.xy(6, 4, "l"));
        return p0;
    }

    @Override
    public boolean setParameters() {
        channel.setProperty(PDF_ADDINFO_DIR1, target1Field.getText());
        channel.setProperty(PDF_ADDINFO_DIR2, target2Field.getText());
        return true;
    }
}
