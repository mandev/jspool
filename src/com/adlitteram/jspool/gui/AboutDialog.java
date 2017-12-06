/**
 * AboutFrame.java
 * Copyright (C) 2000 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller
 */
package com.adlitteram.jspool.gui;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jspool.MainApplication;
import com.adlitteram.jspool.listeners.AbstractDisposer;
import com.adlitteram.jspool.Update;
import com.adlitteram.jspool.Version;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import javax.imageio.ImageIO;
import org.slf4j.Logger;
import javax.swing.JDialog;
import javax.swing.JPanel;
import org.slf4j.LoggerFactory;

public class AboutDialog extends JDialog {

    private static final Logger LOGGER = LoggerFactory.getLogger(AboutDialog.class);
    //
    private static Image img;
    private static final int W = 250;
    private static final int H = 260;

    private BufferedImage readImage() {
        try {
            return ImageIO.read(MainApplication.class.getResource("icons/about.gif"));
        } catch (IOException ex) {
            LOGGER.warn("AboutDialog.readImage()", ex);
            return null;
        }
    }
    
    public AboutDialog(MainFrame parent) {
        super(parent, Message.get("about.jspool.title"), false);

        JPanel pane1 = new JPanel() {

            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);

                if (img == null) {
                    img = readImage();
                }
                g.drawImage(img, 5, 20, null);

                RenderingHints rq = new RenderingHints(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                rq.put(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
                ((Graphics2D) g).setRenderingHints(rq);

                g.drawString("Build : " + Version.getBUILD(), W + 10, 100);
                g.drawString("By " + Version.getAUTHOR(), W + 10, 115);
                //g.drawString("Support : " + Main.SUPPORT , width + 10,115) ;
                //g.drawString("Copyright " + Main.AUTHOR, width + 10,184) ;
                //g.drawString(Main.LICENCE, width + 10, 195) ;
                g.setFont(getFont().deriveFont(Font.BOLD, 24f));
                g.drawString(Update.getNAME() + " " + Version.getRELEASE(), W + 10, 80);

            }
        };

        addKeyListener(new AbstractDisposer(this));
        pane1.setBackground(Color.WHITE);
        pane1.setPreferredSize(new Dimension(W + 190, H));

        setBounds(0, 0, W + 190, H);
        setSize(new Dimension(W + 190, H));

        getContentPane().add(pane1);
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);
        setResizable(false);
        setLocationRelativeTo(parent);
    }
}
