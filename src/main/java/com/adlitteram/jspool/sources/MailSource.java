package com.adlitteram.jspool.sources;

import com.adlitteram.jspool.mail.MailConnexion;
import com.adlitteram.jasmin.Message;
import com.adlitteram.jspool.files.MailSourceFile;
import com.adlitteram.jspool.targets.AbstractTarget;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import javax.swing.JComboBox;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MailSource extends AbstractSource {

    private static final Logger LOG = LoggerFactory.getLogger(MailSource.class);
    //
    public static final String MAILSOURCE_SERVER = "MailSource.Server";
    public static final String MAILSOURCE_USER = "MailSource.User";
    public static final String MAILSOURCE_PASSWD = "MailSource.Passwd";
    public static final String MAILSOURCE_FOLDER = "MailSource.Folder";
    public static final String MAILSOURCE_MODE = "MailSource.Mode";
    public static final String[] MODE_ARRAY = {"pop3", "imap"};
    //
    private JTextField serverField, userField, folderField;
    private JPasswordField passwdField;
    private JComboBox modeCombo;
    private MailConnexion mailConnex;

    @Override
    public String getName() {
        return "Mail";
    }

    @Override
    public void close() {
        super.close();
        if (mailConnex != null) {
            mailConnex.close();
            mailConnex = null;
        }
    }

    @Override
    public boolean run(AbstractTarget target) {
        boolean status;
        try {
            if (mailConnex == null || !mailConnex.isConnected()) {
                mailConnex = new MailConnexion(
                        channel.getStringProp(MAILSOURCE_SERVER),
                        channel.getStringProp(MAILSOURCE_USER),
                        channel.getStringProp(MAILSOURCE_PASSWD),
                        channel.getStringProp(MAILSOURCE_FOLDER),
                        MODE_ARRAY[channel.getIntProp(MAILSOURCE_MODE, 0)]);

                mailConnex.connect();
            }

            MailSourceFile srcFile = new MailSourceFile(mailConnex);
            status = processDir(srcFile, target);
            mailConnex.flush(); // We need to flush the connexion in order to purge the folder
            if ("pop3".equals(mailConnex.getMode())) {
                mailConnex.close();
            }
        }
        catch (Exception e) {
            LOG.warn("MailSource.run()", e);
            mailConnex.close();
            mailConnex = null;
            status = false;
        }

        return status;
    }

    @Override
    public JPanel buildPanel() {

        serverField = new JTextField(channel.getStringProp(MAILSOURCE_SERVER), 25);
        userField = new JTextField(channel.getStringProp(MAILSOURCE_USER), 15);
        passwdField = new JPasswordField(channel.getStringProp(MAILSOURCE_PASSWD), 15);
        folderField = new JTextField(channel.getStringProp(MAILSOURCE_FOLDER), 25);
        modeCombo = new JComboBox(MODE_ARRAY);
        modeCombo.setSelectedIndex(channel.getIntProp(MAILSOURCE_MODE, 0));

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
        p0.add(folderField, c0.xy(4, 5, "l"));
        p0.add(new JLabel(Message.get("ftpmove.transfer")), c0.xy(2, 6, "r"));
        p0.add(modeCombo, c0.xy(4, 6, "l"));
        return p0;
    }

    @Override
    public boolean setParameters() {
        channel.setProperty(MAILSOURCE_SERVER, serverField.getText());
        channel.setProperty(MAILSOURCE_USER, userField.getText());
        channel.setProperty(MAILSOURCE_PASSWD, new String(passwdField.getPassword()));
        channel.setProperty(MAILSOURCE_FOLDER, folderField.getText());
        channel.setProperty(MAILSOURCE_MODE, modeCombo.getSelectedIndex());
        return true;
    }
}
