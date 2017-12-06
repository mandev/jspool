/**
 * LocalExec.java Copyright (C) 2002 Emmanuel Deviller
 *
 * @version 2.0
 * @author Emmanuel Deviller
 */
package com.adlitteram.jspool.targets;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.ExecUtils;
import com.adlitteram.jasmin.utils.GuiUtils;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.files.SourceFile;
import com.adlitteram.jspool.utils.PlatformUtils;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.Dialog;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import javax.swing.*;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.SystemUtils;
import org.mozilla.javascript.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ScriptExec extends AbstractTarget {

    private static final Logger logger = LoggerFactory.getLogger(ScriptExec.class);
    //
    public static final String SCRIPTTARGET_PATH = "ExecTarget.Path";
    public static final String SCRIPTTARGET_PARAMETERS = "ExecTarget.Parameters";
    //
    private Shell shell;
    private Script script;
    //
    private JTextField execField;
    private JTextArea parametersArea;

    @Override
    public String getName() {
        return "Script";
    }

    @Override
    public synchronized void close() {
        if (Context.getCurrentContext() != null) {
            Context.exit();
        }
    }

    @Override
    public synchronized int run(String srcDir, SourceFile file) {
        Context cx = Context.getCurrentContext();

        if (cx == null) {
            cx = Context.enter();
            cx.initStandardObjects();

            shell = new Shell(cx, channel);
            String[] names = {"_print", "_exec", "_exec2", "_execFor", "_getValue", "_setValue"};
            shell.defineFunctionProperties(names, Shell.class, ScriptableObject.DONTENUM);
            shell.defineProperty("_OK", OK, ScriptableObject.READONLY);
            shell.defineProperty("_KEEP", KEEP, ScriptableObject.READONLY);
            shell.defineProperty("_FAIL", FAIL, ScriptableObject.READONLY);
            shell.defineProperty("_NOP", NOP, ScriptableObject.READONLY);

            String filename = channel.getStringProp(SCRIPTTARGET_PATH);

            String params = channel.getStringProp(SCRIPTTARGET_PARAMETERS, "");
            if (params.length() > 0 && !params.endsWith("\n")) {
                params += "\n";
            }

            for (String param : params.split("\n")) {
                int index = param.indexOf("=");
                if (index > 0 && (index + 1) < param.length()) {
                    String key = param.substring(0, index);
                    String value = param.substring(index + 1);
                    //logger.info("key: {} - value: {}", key, value) ;
                    channel.setContextValue(key, value);
                }
            }

            script = compile(cx, shell, filename);
        }

        if (script == null) {
            Context.exit();
            return FAIL;
        }
        else {
            ScriptableObject.putProperty(shell, "_srcFile", Context.javaToJS(file, shell));
            ScriptableObject.putProperty(shell, "_srcDir", Context.javaToJS(srcDir, shell));
            try {
                script.exec(cx, shell);
                Number value = (Number) shell.get("_exit", shell);
                return value.intValue();
            }
            catch (WrappedException we) {
                channel.logWarning(channel.getStringProp(Channel.ID) + " - ScriptExec.run() " + we.getWrappedException().toString(), we);
                Context.exit();
                return FAIL;
            }
            catch (Exception e) {
                channel.logWarning(channel.getStringProp(Channel.ID) + " - ScriptExec.run() : " + e.getMessage(), e);
                Context.exit();
                return FAIL;
            }
        }
    }

    private Script compile(Context cx, Scriptable shell, String filename) {
        FileReader in = null;

        try {
            in = new FileReader(filename);
            return cx.compileReader(shell, in, filename, 1, null);
        }
        catch (FileNotFoundException ex) {
            channel.logWarning(channel.getStringProp(Channel.ID) + " - ScriptExec.compile() " + filename, ex);
            Context.reportError("Couldn't open file \"" + filename + "\".");
        }
        catch (WrappedException we) {
            channel.logWarning(channel.getStringProp(Channel.ID) + " - ScriptExec.compile() " + we.getWrappedException().toString(), we);
        }
        catch (EvaluatorException | JavaScriptException ee) {
            channel.logWarning(channel.getStringProp(Channel.ID) + " - ScriptExec.compile() " + ee.getMessage(), ee);
        }
        catch (IOException ioe) {
            channel.logWarning(channel.getStringProp(Channel.ID) + " - ScriptExec.compile() " + ioe.getMessage(), ioe);
        }
        catch (Exception ex) {
            channel.logWarning(channel.getStringProp(Channel.ID) + " - ScriptExec.compile() " + ex.getMessage(), ex);
        }
        finally {
            IOUtils.closeQuietly(in);
        }
        return null;
    }

    @Override
    public JPanel buildPanel(Dialog parent) {

        execField = new JTextField(channel.getStringProp(SCRIPTTARGET_PATH), 25);
        JButton browseButton = GuiUtils.createBrowseButton(execField, execField, null, "open");

        parametersArea = new JTextArea(channel.getStringProp(SCRIPTTARGET_PARAMETERS), 10, 30);
        parametersArea.setLineWrap(true);
        parametersArea.setWrapStyleWord(false);
        GuiUtils.invertFocusTraversalBehaviour(parametersArea);

        JButton editorButton = new JButton("Edit Script");
        editorButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent ae) {
                String javaExe = FilenameUtils.normalize(SystemUtils.JAVA_HOME + "/bin/java");
                String rtextDir = FilenameUtils.normalize(PlatformUtils.PROG_DIR + "ext/java/RText/");
                String[] args = {"-jar", rtextDir + "RText.jar", execField.getText()};
                // channel.logInfo("commands: " + Arrays.asList(commands));
                // channel.logInfo("dir: " + rtextDir);

                try {
                    ExecUtils.execAsync(javaExe, args, new File(rtextDir));
                }
                catch (IOException ex) {
                    channel.logWarning(channel.getStringProp(Channel.ID), ex);
                }
            }
        });

        int w[] = {5, 0, 5, 0, 5, 0, 5};
        int h[] = {5, 0, 5, 0, 10, 0, 5};
        HIGConstraints c = new HIGConstraints();
        HIGLayout layout = new HIGLayout(w, h);
        layout.setColumnWeight(4, 1);

        JPanel panel = new JPanel(layout);
        panel.add(new JLabel(Message.get("scriptExec.javascript")), c.xy(2, 2, "r"));
        panel.add(execField, c.xy(4, 2, "lr"));
        panel.add(browseButton, c.xy(6, 2, ""));
        panel.add(editorButton, c.xy(4, 4, "l"));
        panel.add(new JLabel(Message.get("scriptExec.parameters")), c.xy(2, 6, "r"));
        panel.add(new JScrollPane(parametersArea), c.xy(4, 6, "lr"));
        return panel;
    }

    @Override
    public boolean setParameters() {
        channel.setProperty(SCRIPTTARGET_PATH, execField.getText());
        channel.setProperty(SCRIPTTARGET_PARAMETERS, parametersArea.getText());
        return true;
    }
}
