/**
 * Channel.java
 * Copyright (C) 2000 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller  */
package com.adlitteram.jspool;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.NumUtils;
import com.adlitteram.jspool.gui.MainFrame;
import com.adlitteram.jspool.sources.AbstractSource;
import com.adlitteram.jspool.targets.AbstractTarget;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map.Entry;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;

public class Channel implements Runnable {
    //

    public static final int STOP = 0;
    public static final int START = 1;
    public static final int ACTIVE = 2;
    public static final int FAILED = 3;
    public static final int RUN = 4;
    public static final int DOWN = 5;
    public static final int UP = 6;
    public static final int DISABLE = 7;
    //
    public static final String ID = "Ident";
    public static final String TEMPO = "Tempo";
    public static final String STABILITY = "Stability";
    public static final String MAXFILES = "MaxFiles";
    public static final String SRCMODE = "Source.Mode";
    public static final String TRGMODE = "Target.Mode";
    public static final String SUBDIR = "SubDir";
    public static final String DELSUBDIRDELAY = "DelSubDirDelay";
    public static final String ZERO = "ZeroLength";
    public static final String AUTOSTART = "AutoStart";
    public static final String FILTER = "Filter";
    public static final String DISABLED = "Disabled";
    public static final String SRCCLASS = "SourceClass";
    public static final String TRGCLASS = "TargetClass";
    //
    private static final Class[] sourceHandlers = HandlersManager.getSourceHandlers();
    private static final Class[] targetHandlers = HandlersManager.getTargetHandlers();
    //
    private MainFrame frame;                       // Parent frame
    private Logger channelLogger ;
    private Thread clockThread;                    // Internal thread
    private HashMap properties = new HashMap();   // Hash table properties
    private HashMap contextMap = new HashMap();   // Hash table properties
    private int status = STOP;                     // Status of the channel
    private boolean isSleeping;
    private boolean isRunning;
    private Pattern regexp;
    public AbstractSource[] srcHandlers;
    public AbstractTarget[] trgHandlers;
    // Transfert filename & progress
    private int progressVal = 0;
    private String uploadFilename;
    private String downloadFilename;
    //
    // Constructor

    public Channel(MainFrame frame) {
        this(frame, null);
    }

    public Channel(MainFrame frame, HashMap props) {
        this.frame = frame;
        
        channelLogger = Logger.getAnonymousLogger() ;

        if (props != null) {
            for (Iterator i = props.entrySet().iterator(); i.hasNext();) {
                Entry entry = (Entry) i.next();
                properties.put(entry.getKey(), entry.getValue() == null ? null : entry.getValue().toString());
            }
            setRegexp();
        }

        updateHandlers();
    }

    public Logger getChannelLogger() {
        return channelLogger;
    }

    public void logInfo(String msg) {
        channelLogger.info(msg);
    }

    public void logWarning(String msg, Throwable thrown) {
        channelLogger.log(Level.WARNING, msg, thrown);
    }

    @Override
    public String toString() {
        return getStringProp(ID);
    }

    public String getID() {
        return getStringProp(ID);
    }

    public int getStability() {
        return getIntProp(STABILITY, 3);
    }

    public boolean listSubDir() {
        return getBooleanProp(SUBDIR, false);
    }

    public long deleteSubDirDelay() {
        return getLongProp(DELSUBDIRDELAY, 0);
    }

    public boolean zeroLength() {
        return getBooleanProp(ZERO, false);
    }

    public boolean autoStart() {
        return getBooleanProp(AUTOSTART, false);
    }

    public final boolean setRegexp() {
        try {
            String filter = getStringProp(FILTER);
            if (filter != null && filter.length() > 0) {
                regexp = Pattern.compile(filter);
            }
            else {
                regexp = null;
            }
            return true;
        }
        catch (Exception e) {
            logWarning(this.getStringProp(Channel.ID) + " - " + Message.get("chprops.okpressed.message2"), e);
            regexp = null;
            return false;
        }
    }

    public Pattern getRegexp() {
        return regexp;
    }

    // Set the channel status and update the frame
    public void setStatus(int stat) {
        status = stat;
        frame.channelModel.updateChannel(this);
    }
    // Get the status of this channel

    public int getStatus() {
        return status;
    }

    public Object getContextValue(String key) {
        return contextMap.get(key);
    }

    public void setContextValue(String key, Object value) {
        contextMap.put(key, value);
    }

    // Properties
    public HashMap getProperties() {
        return properties;
    }

    public void unsetProperty(String key) {
        properties.remove(key);
    }

    public void setProperty(Object key, Object obj) {
        properties.put(key, obj);
    }

    public Object getProperty(Object key) {
        return properties.get(key);
    }

    public String getStringProp(Object key) {
        Object obj = properties.get(key);
        return (obj == null) ? null : obj.toString();
    }

    public String getStringProp(Object key, String dft) {
        Object obj = properties.get(key);
        return (obj == null) ? dft : obj.toString();
    }

    public boolean getBooleanProp(Object key, boolean dft) {
        try {
            String s = getStringProp(key);
            return (s == null) ? dft : Boolean.parseBoolean(s);
        }
        catch (Exception e) {
            return dft;
        }
    }

    public int getIntProp(Object key, int dft) {
        try {
            return Integer.parseInt(getStringProp(key));
        }
        catch (Exception e) {
            return dft;
        }
    }

    public long getLongProp(Object key, long dft) {
        try {
            return Long.parseLong(getStringProp(key));
        }
        catch (Exception e) {
            return dft;
        }
    }

    public double getDoubleProp(Object key, double dft) {
        try {
            return Double.parseDouble(getStringProp(key));
        }
        catch (Exception e) {
            return dft;
        }
    }

    /////////////////////////////////////////////////////////////////////////
    // Source and target handlers
    /////////////////////////////////////////////////////////////////////////
    public String getSrcHandlerName(int index) {
        return srcHandlers[index].getName() ;
//        String str = sourceHandlers[index].getName();
//        return str.substring(str.lastIndexOf('.') + 1);
    }

    public String getTrgHandlerName(int index) {
        return trgHandlers[index].getName() ;
//        String str = targetHandlers[index].getName();
//        return str.substring(str.lastIndexOf('.') + 1);
    }

    public final void updateHandlers() {
        srcHandlers = new AbstractSource[sourceHandlers.length];
        for (int i = 0; i < sourceHandlers.length; i++) {
            try {
                srcHandlers[i] = (AbstractSource) sourceHandlers[i].newInstance();
                srcHandlers[i].init(this);
            }
            catch (Exception e) {
                logWarning(this.getStringProp(Channel.ID) + " - Channel.updateHandlers() - sourceHandlers : ", e);
            }
        }

        trgHandlers = new AbstractTarget[targetHandlers.length];
        for (int i = 0; i < targetHandlers.length; i++) {
            try {
                trgHandlers[i] = (AbstractTarget) targetHandlers[i].newInstance();
                trgHandlers[i].init(this);
            }
            catch (Exception e) {
                logWarning(this.getStringProp(Channel.ID) + " - Channel.updateHandlers() - trgHandlers : ", e);
            }
        }
    }

    public AbstractSource getSrcHandler() {
        String className = getStringProp(SRCCLASS);

        // If classname exists, take it
        if (className != null) {
            for (int i = 0; i < sourceHandlers.length; i++) {
                if (className.equals(getSrcHandlerName(i))) {
                    setProperty(Channel.SRCCLASS, className);
                    return srcHandlers[i];
                }
            }
        }

        // Othewise take the srcMode
        int i = NumUtils.clamp(0, getIntProp(SRCMODE, 0), sourceHandlers.length - 1);
        setProperty(Channel.SRCCLASS, getSrcHandlerName(i));
        return srcHandlers[i];
    }

    public AbstractTarget getTrgHandler() {
        String className = getStringProp(TRGCLASS);

        // If classname exists, take it
        if (className != null) {
            for (int i = 0; i < targetHandlers.length; i++) {
                if (className.equals(getTrgHandlerName(i))) {
                    setProperty(Channel.TRGCLASS, className);
                    return trgHandlers[i];
                }
            }
        }

        // Othewise take the trgMode
        int i = NumUtils.clamp(0, getIntProp(TRGMODE, 0), targetHandlers.length - 1);
        setProperty(Channel.TRGCLASS, getTrgHandlerName(i));
        return trgHandlers[i];
    }

    public String getSourceName() {
        return getSrcHandler().getName();
    }

    public String getTargetName() {
        return getTrgHandler().getName();
    }
    // Thread

    public void start() {
        if (clockThread == null && status != DISABLE) {
            isRunning = true;
            contextMap = new HashMap();
            clockThread = new Thread(this);
            clockThread.setPriority(Thread.NORM_PRIORITY - 1);
            clockThread.start();
            setStatus(START);
            logInfo(this.getStringProp(Channel.ID) + " - " + Message.get("channel.start"));
        }
    }

    @Override
    public void run() {
        Thread myThread = Thread.currentThread();
        long tempo = getLongProp(TEMPO, 60);

        AbstractSource sh = getSrcHandler();
        AbstractTarget th = getTrgHandler();

        while (clockThread == myThread) {
            isSleeping = false;
            setStatus(RUN);

            try {
                setStatus(sh.run(th) ? ACTIVE : FAILED);
            }
            catch (Exception e) {
                //logWarning(this.getStringProp(Channel.ID) + " - Channel.run()  : ", e);
                setStatus(FAILED);
            }
//            catch (Error e) {
//                // Very nasty hack - Thanks to the terrible design in AbstractDocument
//                if ( e.getMessage().equals("Interrupted attempt to aquire write lock")) break ;
//                else throw e ;
//            }

            isSleeping = true;
            if (clockThread != null) {
                try {
                    Thread.sleep(tempo * 1000L);
                }
                catch (InterruptedException e) {
                    //logWarning(this.getStringProp(Channel.ID) + " - Channel.run()  : ", e);
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }

        th.close();
        sh.close();
        contextMap.clear();

        if (status == ACTIVE || status == RUN || status == START) {
            setStatus(STOP);
        }

        isRunning = false;
    }

    public void stop() {
        if (clockThread != null) {
            if (isSleeping) {
                clockThread.interrupt();
            }
            clockThread = null;
            logInfo(getStringProp(Channel.ID) + " - " + Message.get("channel.stop"));
            setStatus(STOP);
        }
    }

    public void disable() {
        stop();
        setStatus(DISABLE);
        setProperty(DISABLED, "true");
    }

    public void enable() {
        setStatus(STOP);
        setProperty(DISABLED, "false");
    }

    public boolean isDisabled() {
        return (status == DISABLE);
    }

    public boolean isRunning() {
        return isRunning;
    }

    public boolean isStopped() {
        return (clockThread == null);
    }
    // Progress Bar

    public void update(int val) {
        progressVal = val;
        if (status == DOWN) {
            frame.channelModel.updateDownBar(this);
        }
        else if (status == UP) {
            frame.channelModel.updateUpBar(this);
        }
    }

    public int getProgress() {
        return progressVal;
    }

    public String getDownloadFilename() {
        return (downloadFilename == null) ? "" : downloadFilename;
    }

    public String getUploadFilename() {
        return (uploadFilename == null) ? "" : uploadFilename;
    }

    public void setDownloadFilename(String str) {
        downloadFilename = str;
    }

    public void setUploadFilename(String str) {
        uploadFilename = str;
    }
}
