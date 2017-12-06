package com.adlitteram.jspool.targets;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.GuiUtils;
import com.adlitteram.jspool.files.SourceFile;
import com.adlitteram.jspool.pdf.PdfDecryptor;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.Dialog;
import javax.swing.*;

public class PdfDecrypt extends AbstractTarget {

    public static final String PDF_DECRYPT_DIR1 = "pdf.decrypt.Dir1";
    public static final String PDF_DECRYPT_DIR2 = "pdf.decrypt.Dir2";
    public static final String PDF_DECRYPT_PASSWORDS = "pdf.decrypt.Passwords";
    //
    private JTextField target1Field;
    private JTextField target2Field;
    private JTextArea passwordsArea;

    @Override
    public String getName() {
        return "PDF Decrypt";
    }

    @Override
    public int run(String srcDir, SourceFile srcfile) {
        int status = FAIL;

        String decryptDir = channel.getStringProp(PDF_DECRYPT_DIR1);
        String errorDir = channel.getStringProp(PDF_DECRYPT_DIR2);

        String passwords = channel.getStringProp(PDF_DECRYPT_PASSWORDS, "");
        if (passwords.length() > 0 && !passwords.endsWith("\n")) {
            passwords += "\n";
        }

        if (decryptDir != null && errorDir != null) {
            PdfDecryptor decryptor = new PdfDecryptor(channel);
            if (decryptor.decrypt(srcfile.getPath(), decryptDir, errorDir, passwords)) {
                status = OK;
            }
        }

        return status;
    }

    @Override
    public JPanel buildPanel(Dialog parent) {
        target1Field = new JTextField(channel.getStringProp(PDF_DECRYPT_DIR1), 30);
        JButton browse0Button = GuiUtils.createDirButton(target1Field);

        target2Field = new JTextField(channel.getStringProp(PDF_DECRYPT_DIR2), 30);
        JButton browse1Button = GuiUtils.createDirButton(target2Field);

        passwordsArea = new JTextArea(channel.getStringProp(PDF_DECRYPT_PASSWORDS), 10, 30);
        passwordsArea.setLineWrap(true);
        passwordsArea.setWrapStyleWord(false);
        GuiUtils.invertFocusTraversalBehaviour(passwordsArea);

        int w[] = {5, 0, 5, 0, 5, 0, 5};
        int h[] = {5, 0, 0, 0, 5, 0, 5};
        HIGLayout l0 = new HIGLayout(w, h);
        HIGConstraints c0 = new HIGConstraints();
        l0.setColumnWeight(4, 1);

        JPanel panel = new JPanel(l0);
        panel.add(new JLabel(Message.get("pdfdecrypt.trgdir")), c0.xy(2, 2, "r"));
        panel.add(target1Field, c0.xy(4, 2, "lr"));
        panel.add(browse0Button, c0.xy(6, 2, "l"));
        panel.add(new JLabel(Message.get("pdfdecrypt.errordir")), c0.xy(2, 4, "r"));
        panel.add(target2Field, c0.xy(4, 4, "lr"));
        panel.add(browse1Button, c0.xy(6, 4, "l"));
        panel.add(new JLabel(Message.get("pdfdecrypt.passwords")), c0.xy(2, 6, "r"));
        panel.add(new JScrollPane(passwordsArea), c0.xy(4, 6, "lr"));

        return panel;
    }

    @Override
    public boolean setParameters() {
        channel.setProperty(PDF_DECRYPT_DIR1, target1Field.getText());
        channel.setProperty(PDF_DECRYPT_DIR2, target2Field.getText());
        channel.setProperty(PDF_DECRYPT_PASSWORDS, passwordsArea.getText());
        return true;
    }
}
