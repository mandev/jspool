package com.adlitteram.jspool.gui;

import com.adlitteram.jspool.utils.Utils;
import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.property.XProp;
import com.adlitteram.jasmin.action.ActionManager;
import com.adlitteram.jasmin.gui.GuiBuilder;
import com.adlitteram.jasmin.log.XLog;
import com.adlitteram.jasmin.utils.GuiUtils;
import com.adlitteram.jspool.*;
import com.adlitteram.jspool.log.DirectHandler;
import com.adlitteram.jspool.properties.XmlChannelReader;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import javax.swing.*;
import javax.swing.event.ListSelectionEvent;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MainFrame extends JFrame {

    private static final Logger LOG = LoggerFactory.getLogger(MainFrame.class);

    public static String[] statusArray = {
        XProp.get("channel.stop"),
        XProp.get("channel.start"),
        XProp.get("channel.active"),
        XProp.get("channel.failed"),
        XProp.get("channel.run"),
        XProp.get("channel.down"),
        XProp.get("channel.up"),
        XProp.get("channel.disable")
    };

    private final GuiBuilder guiBuilder;
    private final JSplitPane splitPane;
    private final JTabbedPane logPane;
    private final LogArea allLogArea;
    private final DirectHandler allLogAreaHandler;
    private JTable channelTable;
    private JPopupMenu popupMenu;
    private ArrayList<Channel> channelList = new ArrayList<>();
    public ChannelModel channelModel;
    public int lastSelectedRow = 0;

    public MainFrame(ActionManager actionManager) {
        super(Update.getNAME() + " " + Version.getRELEASE());

        guiBuilder = new GuiBuilder(actionManager);

        // Log pane
        allLogArea = new LogArea();
        allLogAreaHandler = new DirectHandler(allLogArea);
        XLog.getRootLogger().addHandler(allLogAreaHandler);

        // Table Popup Menu
        popupMenu = new JPopupMenu();
        popupMenu.add(guiBuilder.buildMenuItem("StartChannel", null, null, null, null, this));
        popupMenu.add(guiBuilder.buildMenuItem("StopChannel", null, null, null, null, this));
        popupMenu.add(new JSeparator());
        popupMenu.add(guiBuilder.buildMenuItem("ModifyChannel", null, null, null, null, this));
        popupMenu.add(guiBuilder.buildMenuItem("CopyChannel", null, null, null, null, this));
        popupMenu.add(new JSeparator());
        popupMenu.add(guiBuilder.buildMenuItem("ShowLogArea", null, null, null, null, this));
        popupMenu.add(guiBuilder.buildMenuItem("ResetLogArea", null, null, null, null, this));
        popupMenu.add(new JSeparator());
        popupMenu.add(guiBuilder.buildMenuItem("EnableChannel", null, null, null, null, this));
        popupMenu.add(guiBuilder.buildMenuItem("DisableChannel", null, null, null, null, this));

        // Table pane
        channelModel = new ChannelModel(this);
        channelTable = new JTable(channelModel);
        channelTable.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        channelTable.addMouseListener(new MouseAdapter() {

            @Override
            public void mouseClicked(MouseEvent e) {

                if (SwingUtilities.isLeftMouseButton(e) && e.getClickCount() == 2) {
                    int index = channelTable.getSelectedRow();
                    if (index >= 0 && index < channelList.size()) {
                        MainFrame.this.showLogArea(channelList.get(index));
                    }
                }
                else if (SwingUtilities.isRightMouseButton(e)) {
                    int rowNumber = channelTable.rowAtPoint(e.getPoint());
                    ListSelectionModel model = channelTable.getSelectionModel();
                    model.setSelectionInterval(rowNumber, rowNumber);
                    popupMenu.show(e.getComponent(), e.getX(), e.getY());
                }
            }
        });

        UIManager.put("ProgressBar.selectionBackground", Color.black);
        UIManager.put("ProgressBar.selectionForeground", Color.black);
        UIManager.put("ProgressBar.foreground", Color.orange);

        // Color Bar
        DownloadBar downBar = new DownloadBar(0, 100);
        downBar.setStringPainted(true);
        downBar.setBorder(new javax.swing.border.EmptyBorder(0, 0, 0, 0));

        UploadBar upBar = new UploadBar(0, 100);
        upBar.setStringPainted(true);
        upBar.setBorder(new javax.swing.border.EmptyBorder(0, 0, 0, 0));
        upBar.setUI(new MyProgressUI());

        channelTable.setDefaultRenderer(DownloadBar.class, downBar);
        channelTable.setDefaultRenderer(UploadBar.class, upBar);
        //tableView.setRowHeight(upBar.getPreferredSize().height+2) ; // jdk1.3
        channelTable.setRowHeight(upBar.getPreferredSize().height);

        ListSelectionModel rowSM = channelTable.getSelectionModel();

        rowSM.addListSelectionListener((ListSelectionEvent e) -> {
            ListSelectionModel lsm = (ListSelectionModel) e.getSource();
            if (lsm.isSelectionEmpty()) {
                while (lastSelectedRow >= channelList.size()) {
                    lastSelectedRow--;
                }
                if (lastSelectedRow >= 0) {
                    lsm.setSelectionInterval(lastSelectedRow, lastSelectedRow);
                }
            }
            else {
                lastSelectedRow = lsm.getMinSelectionIndex();
            }
        });

        JToolBar toolBar = buildToolBar();

        JScrollPane channelPane = new JScrollPane(channelTable);
        channelPane.setPreferredSize(new Dimension(400, 50));
        channelPane.getViewport().setBackground(Color.white);

        JScrollPane logScrollPane = new JScrollPane(allLogArea);
        logScrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);

        Object insets = UIManager.get("TabbedPane.contentBorderInsets");
        UIManager.put("TabbedPane.contentBorderInsets", new Insets(0, 0, 0, 0));
//        logPane = new JideTabbedPane();
//        logPane.scrollSelectedTabToVisible(true);
//        logPane.setTabLayoutPolicy(JTabbedPane.SCROLL_TAB_LAYOUT);
//        logPane.setBoldActiveTab(true);

        logPane = new JTabbedPane();
//        logPane.scrollSelectedTabToVisible(true);
        logPane.setTabLayoutPolicy(JTabbedPane.SCROLL_TAB_LAYOUT);

        UIManager.put("TabbedPane.contentBorderInsets", insets);
        logPane.addTab(" * ", logScrollPane);
        //logPane.insertTab(" * ", null, logScrollPane, null, 0);

        //JSplitPane splitPane = new JSplitPane(JSplitPane.VERTICAL_SPLIT, channelPane, logPane);
        splitPane = new JSplitPane(JSplitPane.VERTICAL_SPLIT);
//        splitPane.setProportionalLayout(true);
//        splitPane.add(channelPane, JideBoxLayout.VARY);
//        splitPane.add(logPane, JideBoxLayout.FLEXIBLE);
        splitPane.setDividerLocation(300);
        splitPane.setDividerSize(5);
        splitPane.setContinuousLayout(true);
        splitPane.add(channelPane);
        splitPane.add(logPane);

        getContentPane().add(toolBar, BorderLayout.NORTH);
        getContentPane().add(splitPane, BorderLayout.CENTER);

        // Top Left Icon
        setIconImage(GuiUtils.loadImage("/icons/gears.gif", Main.class));

        // Creation des menus
        JMenuBar menuBar = new JMenuBar();
        menuBar.add(buildFileMenu());
        menuBar.add(buildChannelMenu());
        menuBar.add(buildHelpMenu());
        setJMenuBar(menuBar);

        // Handle frame button
        addWindowListener(new WindowAdapter() {

            @Override
            public void windowClosing(WindowEvent e) {
                GuiUtils.saveBounds(MainFrame.this, "mainframe");
                Main.getApplication().quit();
            }
        });

        loadConfig();

        // Layout the current frame
        pack();
        loadProperties();
        setVisible(true);
    }

    public final void loadProperties() {
        GuiUtils.loadBounds(this, "MainFrame");
//        splitPane.setProportions(NumUtils.stringToDoubleArray(XProp.get("MainFrame.divider", ".8")));
    }

    public final void saveProperties() {
//        XProp.put("MainFrame.divider", NumUtils.doubleArrayToString(splitPane.getProportions()));
        GuiUtils.saveBounds(this, "MainFrame");
    }

    private void loadConfig() {
        try {
            File file = new File(MainApplication.USER_CONF_DIR + "channels.xml");
            if (file.exists()) {
                LOG.info(Message.get("mainframe.loadConfig") + " " + file.getPath());
                XmlChannelReader.read(this, file.toURI());
            }
        }
        catch (Exception e) {
            LOG.warn("MainFrame.loadConfig() : ", e);
        }

        // Autostart
        channelList.stream().filter(Channel::autoStart).forEach(Channel::start) ;
    }

    public JTable getChannelTable() {
        return channelTable;
    }

    public void showLogArea(Channel channel) {
        for (int i = 0; i < logPane.getComponentCount(); i++) {
            JComponent cmpt = (JComponent) logPane.getComponentAt(i);
            if (cmpt.getClientProperty("CHANNEL") == channel) {
                logPane.setSelectedIndex(i);
                return;
            }
        }
    }

    public void resetLogArea() {
        JComponent cmpt = (JComponent) logPane.getSelectedComponent();
        if (cmpt instanceof JScrollPane) {
            JScrollPane scrollPane = (JScrollPane) cmpt;
            LogArea logArea = (LogArea) scrollPane.getViewport().getView();
            logArea.reset();
        }
    }

    public void addLogArea(Channel channel) {
        //LOG.info("Adding LogArea for channel " + channel.getID()) ;
        LogArea logArea = new LogArea();
        JScrollPane logScrollPane = new JScrollPane(logArea);
        logScrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);
        logScrollPane.putClientProperty("CHANNEL", channel);

        int i;
        for (i = 0; i < channelList.size(); i++) {
            if (channelList.get(i) == channel) {
                break;
            }
        }
        logPane.insertTab(channel.getID(), null, logScrollPane, null, i + 1);
        //logPane.addTab(channel.getID(), logScrollPane);

        channel.getChannelLogger().addHandler(new DirectHandler(logArea));
    }

    public void setLogTitle(Channel channel) {
        for (int i = 0; i < logPane.getComponentCount(); i++) {
            JComponent cmpt = (JComponent) logPane.getComponentAt(i);
            if (cmpt.getClientProperty("CHANNEL") == channel) {
                logPane.setTitleAt(i, channel.getID());
                return;
            }
        }
    }

    public void removeLogArea(Channel channel) {
        for (int i = 0; i < logPane.getComponentCount(); i++) {
            JComponent cmpt = (JComponent) logPane.getComponentAt(i);
            if (cmpt.getClientProperty("CHANNEL") == channel) {
                logPane.remove(i);
                return;
            }
        }
    }

    public GuiBuilder getGuiBuilder() {
        return guiBuilder;
    }

    public ArrayList<Channel> getChannels() {
        return channelList;
    }

    private JToolBar buildToolBar() {
        JToolBar toolBar = new JToolBar();
        toolBar.setFloatable(false);
        toolBar.add(guiBuilder.buildButton("StartAllChannels", null, null, null, null, this));
        toolBar.add(guiBuilder.buildButton("StopAllChannels", null, null, null, null, this));
        toolBar.add(Box.createHorizontalStrut(10));
        //toolBar.add(guiBuilder.buildButton("ShowLogArea", null, null, null, null, this));
        toolBar.add(guiBuilder.buildButton("ResetLogArea", null, null, null, null, this));
        toolBar.add(Box.createHorizontalStrut(10));
        toolBar.add(guiBuilder.buildButton("NewChannel", null, null, null, null, this));
        toolBar.add(guiBuilder.buildButton("ModifyChannel", null, null, null, null, this));
        toolBar.add(Box.createHorizontalStrut(10));
        toolBar.add(guiBuilder.buildButton("StartChannel", null, null, null, null, this));
        toolBar.add(guiBuilder.buildButton("StopChannel", null, null, null, null, this));
        toolBar.add(Box.createHorizontalStrut(10));
        toolBar.add(guiBuilder.buildButton("UpperChannel", null, null, null, null, this));
        toolBar.add(guiBuilder.buildButton("LowerChannel", null, null, null, null, this));
        return toolBar;
    }

    // GUI & Menus
    private JMenu buildFileMenu() {
        JMenu menu = guiBuilder.buildMenu("Files");
        menu.add(guiBuilder.buildMenuItem("StartAllChannels", null, null, null, null, this));
        menu.add(guiBuilder.buildMenuItem("StopAllChannels", null, null, null, null, this));
        menu.add(new JSeparator());
        menu.add(guiBuilder.buildMenuItem("ShowLogArea", null, null, null, null, this));
        menu.add(guiBuilder.buildMenuItem("ResetLogArea", null, null, null, null, this));
        menu.add(guiBuilder.buildMenuItem("Preferences", null, null, null, null, this));
        menu.add(new JSeparator());
        menu.add(guiBuilder.buildMenuItem("Quit"));
        return menu;
    }

    // GUI & Menus
    private JMenu buildChannelMenu() {
        JMenu menu = guiBuilder.buildMenu("Channel");
        menu.add(guiBuilder.buildMenuItem("NewChannel", null, null, null, null, this));
        menu.add(guiBuilder.buildMenuItem("CopyChannel", null, null, null, null, this));
        menu.add(guiBuilder.buildMenuItem("ModifyChannel", null, null, null, null, this));
        menu.add(new JSeparator());
        menu.add(guiBuilder.buildMenuItem("StartChannel", null, null, null, null, this));
        menu.add(guiBuilder.buildMenuItem("StopChannel", null, null, null, null, this));
        menu.add(new JSeparator());
        menu.add(guiBuilder.buildMenuItem("EnableChannel", null, null, null, null, this));
        menu.add(guiBuilder.buildMenuItem("DisableChannel", null, null, null, null, this));
        menu.add(new JSeparator());
        menu.add(guiBuilder.buildMenuItem("DestroyChannel", null, null, null, null, this));
        return menu;
    }

    // GUI & Menus
    private JMenu buildHelpMenu() {
        JMenu menu = guiBuilder.buildMenu("Help");
        menu.add(guiBuilder.buildMenuItem("About", null, null, null, null, this));
        return menu;
    }

    public void updateComponentUI() {
    }

    // Save the configuration file
    public void saveConfig() {
        char c = '\0';

        StringBuffer buffer = new StringBuffer("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        buffer.append("<!-- Last save: ").append((new Date()).toString()).append(" -->\n");
        buffer.append("<!-- Fichiers de configuration des canaux -->\n\n");
        buffer.append("<xchannels>\n");

        for (Channel channel : channelList) {
            buffer.append("  <channel\n");
            for (Iterator j = channel.getProperties().keySet().iterator(); j.hasNext();) {
                String k = (String) j.next();
                buffer.append("    ").append(k).append("=\"");
                Utils.appendAndNormalize(buffer, channel.getStringProp(k));
                buffer.append("\"\n");
            }
            buffer.append("  />\n");
        }
        buffer.append("</xchannels>");

        try {
            File configFile = new File(MainApplication.USER_CONF_DIR, "channels.xml");
            File oldConfigFile = new File(MainApplication.USER_CONF_DIR, "channels.xml.bak");
            if (configFile.exists()) {
                FileUtils.copyFile(configFile, oldConfigFile, true);
            }
            FileUtils.writeStringToFile(configFile, buffer.toString(), "UTF-8");
        }
        catch (IOException ioe) {
            LOG.warn("MainFrame.saveConfig() : ", ioe);
        }
    }

    // TabbedPaneUI
    public class MyTabbedPaneUI extends javax.swing.plaf.basic.BasicTabbedPaneUI {

        @Override
        protected Insets getContentBorderInsets(int tabPlacement) {
            return new Insets(0, 0, 0, 0);
        }

        @Override
        protected void paintContentBorder(Graphics g, int tabPlacement, int selectedIndex) {
        }
    }
}
