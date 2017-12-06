/*
 * Shell.java
 * Created on 10 octobre 2005, 20:37
 *
 */
package com.adlitteram.jspool.targets;

import com.adlitteram.jasmin.utils.ExecUtils;
import com.adlitteram.jspool.Channel;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import org.apache.commons.exec.CommandLine;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.ImporterTopLevel;
import org.mozilla.javascript.Scriptable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Shell extends ImporterTopLevel {

    private static final Logger logger = LoggerFactory.getLogger(Shell.class);
    //
    private final Channel channel;

    public Shell(Context cx, Channel channel) {
        super(cx);
        this.channel = channel;
    }

    private Channel getChannel() {
        return channel;
    }

    public static Object _getValue(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
        Shell shell = (Shell) thisObj;
        String key = Context.toString(args[0]);
        return Context.javaToJS(shell.getChannel().getContextValue(key), shell);
    }

    public static void _setValue(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
        Shell shell = (Shell) thisObj;
        String key = Context.toString(args[0]);
        shell.getChannel().setContextValue(key, Context.jsToJava(args[1], Object.class));
    }

    public static void _print(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
        Shell shell = (Shell) thisObj;
        for (Object arg : args) {
            shell.getChannel().logInfo(shell.getChannel().getStringProp(Channel.ID) + " - " + Context.toString(arg));
        }
    }

    private static File createDir(String dirname) {
        File dirFile = new File(dirname);
        if (!dirFile.exists()) {
            dirFile.mkdirs();
        }
        return dirFile;
    }

    // do not use
    public static void _execFor(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
        CommandLine cmd = CommandLine.parse((String) args[0]);
        String dir = Context.toString(args[1]);
        long wait = (long) Context.toNumber(args[2]);
        ByteArrayOutputStream bos = null;
        if (args.length > 3) {
            bos = (ByteArrayOutputStream) Context.jsToJava(args[3], ByteArrayOutputStream.class);
        }

        try {
            ExecUtils.exec(cmd.getExecutable(), cmd.getArguments(), createDir(dir), bos, wait);
        }
        catch (IOException ex) {
            logger.warn("Error launching external application: {} - {}", cmd, ex.getMessage());
        }
    }

    // do not use
    public static void _exec2(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
        CommandLine cmd = CommandLine.parse((String) args[0]);
        String dir = Context.toString(args[1]);
        long wait = (long) Context.toNumber(args[3]);

        try {
            ExecUtils.exec(cmd.getExecutable(), cmd.getArguments(), createDir(dir), null, wait);
        }
        catch (IOException ex) {
            logger.warn("Error launching external application: {} - {}", cmd, ex.getMessage());
        }
    }

    public static int _exec(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
        String app = Context.toString(args[0]);
        String[] opt = (String[]) Context.jsToJava(args[1], String[].class);
        String dir = Context.toString(args[2]);
        long wait = (long) Context.toNumber(args[3]);
        ByteArrayOutputStream bos = (args.length > 4) ? (ByteArrayOutputStream) Context.jsToJava(args[4], ByteArrayOutputStream.class) : null;

        try {
            ExecUtils.exec(app, opt, createDir(dir), bos, wait);
        }
        catch (IOException ex) {
            logger.warn("Error executing external application: {} - {}", app, ex.getMessage());
            return 1;
        }

        return 0;
//        return _exec3(cx, thisObj, args, funObj);
    }

//    public static int _exec3(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
//        String app = Context.toString(args[0]);
//        String[] opts = (String[]) Context.jsToJava(args[1], String[].class);
//        String dir = Context.toString(args[2]);
//        long wait = (long) Context.toNumber(args[3]);
//        ByteArrayOutputStream bos = (args.length > 4) ? (ByteArrayOutputStream) Context.jsToJava(args[4], ByteArrayOutputStream.class) : null;
//        return ExecUtils2.exec(app, opts, dir, bos);
//    }
    
//    public static void _exec(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
//
//        String app = Context.toString(args[0]);
//        String dir = Context.toString(args[1]);
//        //boolean gobble = Context.toBoolean(args[2]);
//        boolean wait = Context.toBoolean(args[3]);
//
//        try {
//            if (wait) {
//                ExecUtils.exec(app, new String[]{}, createDir(dir));
//            }
//            else {
//                ExecUtils.execAsync(app, new String[]{}, createDir(dir));
//            }
//        }
//        catch (IOException ex) {
//            logger.warn("Error launching external application: ", ex);
//        }
//    }
}
