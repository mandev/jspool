/**
 * Main.java Copyright (C) 2000-2002 Emmanuel Deviller
 *
 * @version 4.0
 * @author Emmanuel Deviller
 *
 *
 */
package com.adlitteram.jspool;

import com.adlitteram.jasmin.Application;
import com.adlitteram.jasmin.XProp;
import com.adlitteram.jasmin.action.ActionManager;
import com.adlitteram.jasmin.log.XLog;
import com.adlitteram.jspool.gui.MainFrame;
import com.adlitteram.jspool.utils.PlatformUtils;
import com.jidesoft.plaf.LookAndFeelFactory;
import java.awt.Window;
import java.io.File;
import javax.swing.SwingUtilities;

public class MainApplication extends Application {

    public static final String HOME_DIR = System.getProperty("user.home") + File.separator;
    public static final String PROG_DIR = System.getProperty("user.dir") + File.separator;
    public static final String CONF_DIR = PROG_DIR + File.separator + "config" + File.separator;
    public static final String LANG_DIR = CONF_DIR + "locales" + File.separator;			// Locales Messages
    // User's configuration Files
    public static final String USER_CONF_DIR = PlatformUtils.HOME_DIR + "." + Update.getNAME() + File.separator;
    public static final String USER_LOG_DIR = USER_CONF_DIR + "log" + File.separator;
    public static final String USER_BCK_DIR = USER_CONF_DIR + "backup" + File.separator;
    //
    public static final String USER_LANG_FILE = USER_CONF_DIR + "language";
    public static final String USER_PROP_FILE = USER_CONF_DIR + "userprops.xml";
    public static final String USER_BIND_FILE = USER_CONF_DIR + "bindings.xml";
    public static final String USER_STYLE_FILE = USER_CONF_DIR + "styles.xml";
    public static final String USER_DICT_FILE = USER_CONF_DIR + "user.dic";
    //
    // Globals variables
    private MainFrame mainFrame;
    private ActionManager actionManager;
    private final String[] args;

    public MainApplication(String[] args) {
        this.args = args;
    }

    /////////////////////////////////////////////////////////////////////////
    // Initialization
    /////////////////////////////////////////////////////////////////////////
    @Override
    public void init() {
        super.init();

        System.setProperty("swing.aatext", "true");
        System.setProperty("swing.boldMetal", "false");
        System.setProperty("mail.mime.parameters.strict", "false");

        File dir = new File(CONF_DIR);
        if (!dir.exists()) {
            dir.mkdir();
        }

        dir = new File(USER_CONF_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        actionManager = new ActionBuilder();    // Controller
    }

    public void start() {
        SwingUtilities.invokeLater(
                new Runnable() {

                    @Override
                    public void run() {
                        LookAndFeelFactory.installJideExtension(LookAndFeelFactory.VSNET_STYLE_WITHOUT_MENU);
                        mainFrame = new MainFrame(actionManager);
                    }
                });
    }

    public void quit() {
        mainFrame.saveProperties();
        mainFrame.saveConfig();
        XProp.saveProperties(USER_PROP_FILE, "1", "1");
        int count = 5;

        for (Channel channel : mainFrame.getChannels()) {
            channel.stop();
        }

        label:
        for (Channel channel : mainFrame.getChannels()) {
            if (count > 0 && channel.isRunning()) {
                count--;
                Utils.sleep(1000);
                break label;
            }
        }

        XLog.close();
        System.exit(0);
    }

    public ActionManager getActionManager() {
        return actionManager;
    }

    @Override
    public Window getMainFrame() {
        return mainFrame;
    }

    @Override
    public String getUserConfDir() {
        return USER_CONF_DIR;
    }

    @Override
    public String getUserLogDir() {
        return USER_LOG_DIR;
    }

    @Override
    public String getUserPropFile() {
        return USER_PROP_FILE;
    }

    @Override
    public String getLangDir() {
        return LANG_DIR;
    }

    @Override
    public String getLogName() {
        return Update.getCNAME();
    }

    @Override
    public Class getMainClass() {
        return MainApplication.class;
    }

    @Override
    public String getApplicationName() {
        return "jSpool";
    }

    @Override
    public String getApplicationRelease() {
        return "1";
    }

    @Override
    public String getApplicationBuild() {
        return "100";
    }
}
