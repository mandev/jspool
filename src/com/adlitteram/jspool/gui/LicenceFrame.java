/**
 * LicenceFrame.java
 * Copyright (C) 2000 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller  */
package com.adlitteram.jspool.gui;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.XProp;
import com.adlitteram.jspool.Main;
import com.adlitteram.jspool.MainApplication;
import com.adlitteram.jspool.Update;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Toolkit;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;

import org.slf4j.Logger;
import javax.swing.Box;
import javax.swing.JButton;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.border.Border;
import javax.swing.border.CompoundBorder;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import org.slf4j.LoggerFactory;

public class LicenceFrame extends JDialog implements ActionListener {

    private static final Logger logger = LoggerFactory.getLogger(LicenceFrame.class);
    //
    private final MainFrame parent;
    private final JButton ok, quit;
    private final JTextField licField = new JTextField(getLicenseKey(), 25);

    public LicenceFrame(MainFrame parent) {

        super(parent, Message.get("RegisterLicense"), true);

        this.parent = parent;

        // Dialog properties
        setDefaultCloseOperation(DO_NOTHING_ON_CLOSE);
        setResizable(false);

        // Top pane
        JPanel panel1 = new JPanel();
        panel1.add(new JLabel(Message.get("LicenseKey")));
        panel1.add(licField);
        Border insBorder = new CompoundBorder(new LineBorder(Color.gray), new EmptyBorder(5, 5, 5, 5));
        Border border = new CompoundBorder(new EmptyBorder(5, 5, 5, 5), insBorder);
        panel1.setBorder(border);

        // Button pane
        ok = new JButton(Message.get("OK"));
        quit = new JButton(Message.get("QuitApp"));
        ok.addActionListener(this);
        quit.addActionListener(this);
        getRootPane().setDefaultButton(ok);

        JPanel panel2 = new JPanel(new BorderLayout());
        panel2.add(BorderLayout.WEST, quit);
        panel2.add(BorderLayout.CENTER, Box.createHorizontalStrut(100));
        panel2.add(BorderLayout.EAST, ok);
        panel2.setBorder(new EmptyBorder(5, 5, 5, 5));

        // All together
        getContentPane().setLayout(new BorderLayout());
        getContentPane().add(BorderLayout.CENTER, panel1);
        getContentPane().add(BorderLayout.SOUTH, panel2);

        pack();
        setLocationRelativeTo(parent);
        setVisible(true);
    }

    public static String getLicenseKey() {
        String licDft = Update.getCNAME() + "-DEMO-30DAYS";
        return XProp.get("Registration.Key", licDft);
    }

    // jspoo-xxxxx-xxxxx-xxxxx ou jspool-demo-xxxxx
    public static boolean isLicenceOK(String licence) {
        return true;
    }

    public static boolean isLicenceOK2(String licence) {

        try {
            if (!licence.startsWith(Update.getCNAME())) {
                return false;
            }

            if (licence.equals(Update.getCNAME() + "-DEMO-30DAYS")) {
                return demoLicence();
            }
            if (licence.length() != 23) {
                return false;
            }
        }
        catch (Exception e) {
            logger.warn("LicenceFrame.isLicenceOK2()", e);
            return false;
        }

        long code = calculateLicence(licence);
        String ncode = normalizeLicence(licence, String.valueOf(code));
        String str4 = licence.substring(18, 23);
        return ncode.equals(str4);
    }

    private static boolean demoLicence() {
        File file = new File(MainApplication.USER_CONF_DIR);
        long lm = file.lastModified();
        long ct = System.currentTimeMillis();
        return ((ct - lm) > 0 && (ct - lm) < (3600l * 24l * 30l * 1000l));
    }

    private static long calculateLicence(String licence) {
        long c0 = (long) licence.charAt(6) + 14;
        c0 += (long) licence.charAt(8) + 8;
        c0 += (long) licence.charAt(15) + 21;

        long c1 = (long) licence.charAt(9) + 4;
        c1 += (long) licence.charAt(13) + 1;

        long c2 = (long) licence.charAt(7) + 5;
        c2 += (long) licence.charAt(10) + 11;
        c2 += (long) licence.charAt(14) + 1;

        long c3 = (long) licence.charAt(16) + 67;
        c3 += (long) licence.charAt(12) + 11;

        return Math.abs((c0 * c1 * c2 * c3) % 97499);
    }

    private static String normalizeLicence(String licence, String code) {
        switch (code.length()) {
            case 0:
                code = licence.charAt(7) + "" + licence.charAt(14) + "" + licence.charAt(8) + "" + licence.charAt(13) + "" + licence.charAt(10);
                break;
            case 1:
                code = licence.charAt(6) + "" + code.charAt(0) + "" + licence.charAt(8) + "" + licence.charAt(15) + "" + licence.charAt(7);
                break;
            case 2:
                code = licence.charAt(9) + "" + code.charAt(1) + "" + licence.charAt(15) + "" + code.charAt(0) + "" + licence.charAt(6);
                break;
            case 3:
                code = code.charAt(0) + "" + code.charAt(2) + "" + licence.charAt(15) + "" + code.charAt(1) + "" + licence.charAt(16);
                break;
            case 4:
                code = code.charAt(3) + "" + code.charAt(0) + "" + licence.charAt(6) + "" + code.charAt(1) + "" + code.charAt(2);
                break;
        }
        return code;
    }

    @Override
    public void actionPerformed(ActionEvent evt) {
        if (evt.getSource() == ok) {

            if (!isLicenceOK(licField.getText())) {
                Toolkit.getDefaultToolkit().beep();
                logger.warn(Message.get("BadLicence"));
                return;
            }

            XProp.put("Registration.Key", licField.getText());
            parent.saveConfig();
            setVisible(false);
            parent.repaint();
            dispose();
        }
        else if (evt.getSource() == quit) {
            Main.getApplication().quit();
        }
    }
}