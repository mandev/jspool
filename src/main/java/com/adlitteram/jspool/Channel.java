package com.adlitteram.jspool;

import static com.adlitteram.jasmin.Message.get;
import static com.adlitteram.jasmin.utils.NumUtils.clamp;
import static com.adlitteram.jspool.HandlersManager.getSourceHandlers;
import static com.adlitteram.jspool.HandlersManager.getTargetHandlers;
import static java.lang.Boolean.parseBoolean;
import static java.lang.Double.parseDouble;
import static java.lang.Integer.parseInt;
import static java.lang.Long.parseLong;
import static java.lang.Thread.NORM_PRIORITY;
import static java.lang.Thread.currentThread;
import static java.lang.Thread.sleep;
import static java.util.logging.Level.WARNING;
import static java.util.regex.Pattern.compile;

import com.adlitteram.jspool.gui.MainFrame;
import com.adlitteram.jspool.sources.AbstractSource;
import com.adlitteram.jspool.targets.AbstractTarget;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;
import java.util.regex.Pattern;

public class Channel implements Runnable {

    public static final int STOP = 0;
    public static final int START = 1;
    public static final int ACTIVE = 2;
    public static final int FAILED = 3;
    public static final int RUN = 4;
    public static final int DOWN = 5;
    public static final int UP = 6;
    public static final int DISABLE = 7;

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

    private static final Class[] SOURCE_HANDLERS = getSourceHandlers();
    private static final Class[] TARGET_HANDLERS = getTargetHandlers();
    private static final Logger CHANNEL_LOGGER = Logger.getAnonymousLogger();

    private final MainFrame frame;                       // Parent frame
    private Thread clockThread;                    // Internal thread
    private final Map<Object, Object> properties;
    private HashMap<String, Object> contextMap;
    private int status = STOP;                     // Status of the channel
    private boolean isSleeping;
    private boolean isRunning;
    private Pattern regexp;
    public AbstractSource[] srcHandlers;
    public AbstractTarget[] trgHandlers;
    private int progressVal = 0;
    private String uploadFilename;
    private String downloadFilename;

    public Channel(MainFrame frame) {
        this(frame, null);
    }

    public Channel(MainFrame frame, Map<Object, Object> props) {
        this.frame = frame;
        this.contextMap = new HashMap<>();
        this.properties = new HashMap<>();

        if (props != null) {
            properties.putAll(props);
            setRegexp();
        }
        updateHandlers();
    }

    public Logger getChannelLogger() {
        return CHANNEL_LOGGER;
    }

    public void logInfo(String msg) {
        CHANNEL_LOGGER.info(msg);
    }

    public void logWarning(String msg, Throwable thrown) {
        CHANNEL_LOGGER.log(WARNING, msg, thrown);
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

    public boolean setRegexp() {
        try {
            String filter = getStringProp(FILTER);
            if (filter != null && filter.length() > 0) {
                regexp = compile(filter);
            }
            else {
                regexp = null;
            }
            return true;
        }
        catch (Exception e) {
            logWarning(this.getStringProp(ID) + " - " + get("chprops.okpressed.message2"), e);
            regexp = null;
            return false;
        }
    }

    public Pattern getRegexp() {
        return regexp;
    }

    public void setStatus(int stat) {
        status = stat;
        frame.channelModel.updateChannel(this);
    }

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
    public Map<Object, Object> getProperties() {
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
            return (s == null) ? dft : parseBoolean(s);
        }
        catch (Exception e) {
            return dft;
        }
    }

    public int getIntProp(Object key, int dft) {
        try {
            return parseInt(getStringProp(key));
        }
        catch (NumberFormatException e) {
            return dft;
        }
    }

    public long getLongProp(Object key, long dft) {
        try {
            return parseLong(getStringProp(key));
        }
        catch (NumberFormatException e) {
            return dft;
        }
    }

    public double getDoubleProp(Object key, double dft) {
        try {
            return parseDouble(getStringProp(key));
        }
        catch (NumberFormatException e) {
            return dft;
        }
    }

    public String getSrcHandlerName(int index) {
        return srcHandlers[index].getName();
    }

    public String getTrgHandlerName(int index) {
        return trgHandlers[index].getName();
    }

    public void updateHandlers() {
        srcHandlers = new AbstractSource[SOURCE_HANDLERS.length];
        for (int i = 0; i < SOURCE_HANDLERS.length; i++) {
            try {
                srcHandlers[i] = (AbstractSource) SOURCE_HANDLERS[i].newInstance();
                srcHandlers[i].init(this);
            }
            catch (IllegalAccessException | InstantiationException e) {
                logWarning(this.getStringProp(ID) + " - Channel.updateHandlers() - sourceHandlers : ", e);
            }
        }

        trgHandlers = new AbstractTarget[TARGET_HANDLERS.length];
        for (int i = 0; i < TARGET_HANDLERS.length; i++) {
            try {
                trgHandlers[i] = (AbstractTarget) TARGET_HANDLERS[i].newInstance();
                trgHandlers[i].init(this);
            }
            catch (IllegalAccessException | InstantiationException e) {
                logWarning(this.getStringProp(ID) + " - Channel.updateHandlers() - trgHandlers : ", e);
            }
        }
    }

    public AbstractSource getSrcHandler() {
        String className = getStringProp(SRCCLASS);

        // If className exists, take it
        if (className != null) {
            for (int i = 0; i < SOURCE_HANDLERS.length; i++) {
                if (className.equals(getSrcHandlerName(i))) {
                    setProperty(SRCCLASS, className);
                    return srcHandlers[i];
                }
            }
        }

        // Otherwise take the srcMode
        int i = clamp(0, getIntProp(SRCMODE, 0), SOURCE_HANDLERS.length - 1);
        setProperty(SRCCLASS, getSrcHandlerName(i));
        return srcHandlers[i];
    }

    public AbstractTarget getTrgHandler() {
        String className = getStringProp(TRGCLASS);

        // If className exists, take it
        if (className != null) {
            for (int i = 0; i < TARGET_HANDLERS.length; i++) {
                if (className.equals(getTrgHandlerName(i))) {
                    setProperty(TRGCLASS, className);
                    return trgHandlers[i];
                }
            }
        }

        // Otherwise take the trgMode
        int i = clamp(0, getIntProp(TRGMODE, 0), TARGET_HANDLERS.length - 1);
        setProperty(TRGCLASS, getTrgHandlerName(i));
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
            contextMap = new HashMap<>();
            clockThread = new Thread(this);
            clockThread.setPriority(NORM_PRIORITY - 1);
            clockThread.start();
            setStatus(START);
            logInfo(this.getStringProp(ID) + " - " + get("channel.start"));
        }
    }

    @Override
    public void run() {
        Thread myThread = currentThread();
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
                setStatus(FAILED);
            }

            isSleeping = true;
            if (clockThread != null) {
                try {
                    sleep(tempo * 1_000L);
                }
                catch (InterruptedException e) {
                    currentThread().interrupt();
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
            logInfo(getStringProp(ID) + " - " + get("channel.stop"));
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
