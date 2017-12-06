/**
 * LocalExec.java Copyright (C) 2002 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller
 */
package com.adlitteram.jspool.sources;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.GuiUtils;
import com.adlitteram.jasmin.utils.StreamGobbler;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.files.LocalFile;
import com.adlitteram.jspool.files.SourceFile;
import com.adlitteram.jspool.targets.AbstractTarget;
import com.adlitteram.jspool.targets.Shell;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import org.mozilla.javascript.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LocalScript extends AbstractSource {

    private static final Logger logger = LoggerFactory.getLogger(LocalScript.class);
    //
    public static final String SCRIPTSOURCE_PATH = "ExecSource.Path";
    public static final int OK = 0;
    public static final int FAIL = 1;
    public static final int NOP = 2;
    //
    private Shell shell;
    private Script script;
    private JTextField execField;

    @Override
    public String toString() {
        return getName();
    }

    @Override
    public String getName() {
        return "Script";
    }

    @Override
    public void close() {
        super.close();

        synchronized (this) {
            if (Context.getCurrentContext() != null) {
                Context.exit();
            }
        }
    }

    @Override
    public boolean run(AbstractTarget target) {

        boolean status = true;
        Object[] result;

        synchronized (this) {
            result = runScript();
        }

        int state = ((Number) result[0]).intValue();

        if (state == OK) {
            String srcDir = ((String) result[1]);
            String srcPath = ((String) result[2]);
            SourceFile srcFile = ((SourceFile) result[3]);

            if (srcFile == null && srcPath != null) {
                srcFile = new LocalFile(new File(srcPath));
            }

            if (srcDir != null && srcFile != null) {
                switch (target.run(srcDir, srcFile)) {
                    case AbstractTarget.OK:
                        srcFile.delete();
                        break;
                    case AbstractTarget.FAIL:
                        String[] args = {srcFile.getPath()};
                        channel.logInfo(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.process.message5", args));
                        status = false;
                        break;
                    case AbstractTarget.KEEP:
                        break;
                    case AbstractTarget.NOP:
                    default:
                }
            }
        } else if (state == FAIL) {
            status = false;
        } else {
            // state = NOP : do nothing
        }

        return status;
    }

    public synchronized Object[] runScript() {

        Context cx = Context.getCurrentContext();

        if (cx == null) {

            //XLog.getLogger().info(channel.getStringProp(Channel.ID)  + " - Creating script context") ;
            cx = Context.enter();
            cx.initStandardObjects();

            shell = new Shell(cx, channel);
            String[] names = {"_print", "_exec"};

            shell.defineFunctionProperties(names, Shell.class, ScriptableObject.DONTENUM);

            shell.defineProperty("_OK", OK, ScriptableObject.READONLY);
            shell.defineProperty("_FAIL", FAIL, ScriptableObject.READONLY);
            shell.defineProperty("_NOP", NOP, ScriptableObject.READONLY);
//            shell.defineProperty("_KEEP", Integer.valueOf(KEEP), ScriptableObject.READONLY);

            String filename = channel.getStringProp(SCRIPTSOURCE_PATH);
            script = compile(cx, shell, filename);
        }

        if (script == null) {
            Context.exit();
            return new Object[]{FAIL, null, null, null};
        } else {
            //ScriptableObject.putProperty(shell, "_channel", Context.javaToJS(channel, shell));
            ScriptableObject.putProperty(shell, "_localScript", Context.javaToJS(this, shell));
//         ScriptableObject.putProperty(shell, "_srcDir", Context.javaToJS(srcDir, shell));

            try {
                script.exec(cx, shell);
                Number value = (Number) shell.get("_exit", shell);
                String srcDir = (String) convertFromJS("_srcDir", String.class, cx, shell);
                String srcPath = (String) convertFromJS("_srcPath", String.class, cx, shell);
                SourceFile srcFile = (SourceFile) convertFromJS("_srcFile", SourceFile.class, cx, shell);

                return new Object[]{value, srcDir, srcPath, srcFile};
            } catch (Exception e) {
                channel.logWarning(channel.getStringProp(Channel.ID) + " - ScriptExec.run() ", e);
                Context.exit();
                return new Object[]{FAIL, null, null, null};
            }
        }
    }

    private Object convertFromJS(String str, Class type, Context cx, Shell shell) {
        try {
            if (shell.has(str, shell)) {
                return Context.jsToJava(shell.get(str, shell), type);
            }
        } catch (EvaluatorException e) {
            logger.warn("LocalScript.convertFromJS()", e);
        }
        return null;
    }

    private Script compile(Context cx, Scriptable shell, String filename) {
        FileReader in = null;

        try {
            in = new FileReader(filename);
            return cx.compileReader(shell, in, filename, 1, null);
        } catch (FileNotFoundException ex) {
            channel.logWarning(channel.getStringProp(Channel.ID) + " - ScriptExec.compile() " + filename, ex);
            Context.reportError("Couldn't open file \"" + filename + "\".");
        } catch (WrappedException we) {
            channel.logWarning(channel.getStringProp(Channel.ID) + " - ScriptExec.compile() " + we.getWrappedException().toString(), we);
        } catch (EvaluatorException | JavaScriptException ee) {
            channel.logWarning(channel.getStringProp(Channel.ID) + " - ScriptExec.compile() " + ee.getMessage(), ee);
        } catch (IOException ioe) {
            channel.logWarning(channel.getStringProp(Channel.ID) + " - ScriptExec.compile() " + ioe.getMessage(), ioe);
        } finally {
            try {
                if (in != null) {
                    in.close();
                }
            } catch (Exception e) {
            }
        }
        return null;
    }

    @Override
    public JPanel buildPanel() {

        execField = new JTextField(channel.getStringProp(SCRIPTSOURCE_PATH), 25);
        JButton browseButton = GuiUtils.createBrowseButton(execField, execField, null, "open");

        JButton editorButton = new JButton("Editer");
        editorButton.addActionListener(
                new ActionListener() {

                    @Override
                    public void actionPerformed(ActionEvent ae) {
                        exec("notepad", execField.getText());
                    }
                });

        int w[] = {5, 0, 5, 0, 5, 0, 5};
        int h[] = {5, 0, 10, 0, 0, 0, 5};
        HIGConstraints c = new HIGConstraints();
        HIGLayout layout = new HIGLayout(w, h);
        layout.setColumnWeight(4, 1);

        JPanel panel = new JPanel(layout);
        panel.add(new JLabel(Message.get("scriptExec.javascript")), c.xy(2, 2, "r"));
        panel.add(execField, c.xy(4, 2, "lr"));
        panel.add(browseButton, c.xy(6, 2, ""));
        panel.add(editorButton, c.xy(4, 4, "l"));
        return panel;
    }

    @Override
    public boolean setParameters() {
        channel.setProperty(SCRIPTSOURCE_PATH, execField.getText());
        return true;
    }

    public void exec(String exe, String scriptname) {
        Process proc = null;
        String str = "\"" + exe + "\"  \"" + scriptname + "\" ";

        try {
            proc = Runtime.getRuntime().exec(str);
            StreamGobbler errorGobbler = new StreamGobbler(proc.getErrorStream(), "ERR");
            StreamGobbler outputGobbler = new StreamGobbler(proc.getInputStream(), "OUT");
            errorGobbler.start();
            outputGobbler.start();
        } catch (Exception e) {
            channel.logWarning(channel.getStringProp(Channel.ID), e);
            if (proc != null) {
                proc.destroy();
            }
        }
    }
}
