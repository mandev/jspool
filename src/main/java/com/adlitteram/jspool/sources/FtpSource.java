package com.adlitteram.jspool.sources;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jspool.files.FtpSourceFile;
import com.adlitteram.jspool.ftp.FtpConnexion;
import com.adlitteram.jspool.targets.AbstractTarget;
import com.enterprisedt.net.ftp.FTPException;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.io.IOException;
import javax.swing.*;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FtpSource extends AbstractSource {

    private static final Logger LOG = LoggerFactory.getLogger(FtpSource.class);

    public static final String FTPSOURCE_SERVER = "FtpSource.Server";
    public static final String FTPSOURCE_USER = "FtpSource.User";
    public static final String FTPSOURCE_PASSWD = "FtpSource.Passwd";
    public static final String FTPSOURCE_DIR = "FtpSource.Dir";
    public static final String FTPSOURCE_MODE = "FtpSource.Mode";
    public static final String[] modeArray = {"Passive", "Active"};

    private JTextField serverField, userField, dirField;
    private JPasswordField passwdField;
    private JComboBox modeCombo;
    private FtpConnexion ftpConnex;

    @Override
    public String getName() {
        return "Ftp";
    }

    @Override
    public void close() {
        super.close();
        if (ftpConnex != null) {
            ftpConnex.close();
            ftpConnex = null;
        }
    }

    @Override
    public boolean run(AbstractTarget target) {

        try {
            if (ftpConnex == null || !ftpConnex.isConnected()) {
                ftpConnex = new FtpConnexion(channel,
                        channel.getStringProp(FTPSOURCE_SERVER),
                        channel.getStringProp(FTPSOURCE_USER),
                        channel.getStringProp(FTPSOURCE_PASSWD),
                        channel.getStringProp(FTPSOURCE_DIR),
                        channel.getIntProp(FTPSOURCE_MODE, 0));

                ftpConnex.connect();
            }

            String srcDir = FilenameUtils.normalize(channel.getStringProp(FTPSOURCE_DIR));
            FtpSourceFile srcFile = new FtpSourceFile(ftpConnex, channel.getStability());
            return processDir(srcDir, srcFile, target);
        }
        catch (IOException | FTPException e) {
            LOG.warn("FtpSource.run()", e);
            ftpConnex.close();
            ftpConnex = null;
            return false;
        }
    }

    @Override
    public JPanel buildPanel() {

        serverField = new JTextField(channel.getStringProp(FTPSOURCE_SERVER), 15);
        userField = new JTextField(channel.getStringProp(FTPSOURCE_USER), 15);
        passwdField = new JPasswordField(channel.getStringProp(FTPSOURCE_PASSWD), 15);
        dirField = new JTextField(channel.getStringProp(FTPSOURCE_DIR), 25);
        modeCombo = new JComboBox(modeArray);
        modeCombo.setSelectedIndex(channel.getIntProp(FTPSOURCE_MODE, 0));

        int w0[] = {5, 0, 5, 0, 5};
        int h0[] = {5, 0, 0, 0, 0, 0, 5};
        HIGConstraints c0 = new HIGConstraints();
        HIGLayout l0 = new HIGLayout(w0, h0);
        l0.setColumnWeight(4, 1);
        JPanel p0 = new JPanel(l0);
        p0.add(new JLabel(Message.get("ftpmove.server")), c0.xy(2, 2, "r"));
        p0.add(serverField, c0.xy(4, 2, "l"));
        p0.add(new JLabel(Message.get("ftpmove.user")), c0.xy(2, 3, "r"));
        p0.add(userField, c0.xy(4, 3, "l"));
        p0.add(new JLabel(Message.get("ftpmove.passwd")), c0.xy(2, 4, "r"));
        p0.add(passwdField, c0.xy(4, 4, "l"));
        p0.add(new JLabel(Message.get("ftpmove.srcdir")), c0.xy(2, 5, "r"));
        p0.add(dirField, c0.xy(4, 5, "lr"));
        p0.add(new JLabel(Message.get("ftpmove.transfer")), c0.xy(2, 6, "r"));
        p0.add(modeCombo, c0.xy(4, 6, "l"));
        return p0;
    }

    @Override
    public boolean setParameters() {
        channel.setProperty(FTPSOURCE_SERVER, serverField.getText());
        channel.setProperty(FTPSOURCE_USER, userField.getText());
        channel.setProperty(FTPSOURCE_PASSWD, new String(passwdField.getPassword()));
        channel.setProperty(FTPSOURCE_DIR, dirField.getText());
        channel.setProperty(FTPSOURCE_MODE, modeCombo.getSelectedIndex());
        return true;
    }
}
