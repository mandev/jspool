package com.adlitteram.jspool.targets;

import static com.adlitteram.jasmin.Message.get;
import static com.adlitteram.jasmin.utils.ExecUtils.execAsync;
import static com.adlitteram.jasmin.utils.GuiUtils.createBrowseButton;
import static com.adlitteram.jasmin.utils.GuiUtils.invertFocusTraversalBehaviour;
import static com.adlitteram.jspool.Channel.ID;
import static com.adlitteram.jspool.utils.PlatformUtils.PROG_DIR;
import static org.apache.commons.io.FilenameUtils.normalize;
import static org.apache.commons.io.IOUtils.closeQuietly;
import static org.apache.commons.lang3.SystemUtils.JAVA_HOME;
import static org.mozilla.javascript.Context.enter;
import static org.mozilla.javascript.Context.exit;
import static org.mozilla.javascript.Context.getCurrentContext;
import static org.mozilla.javascript.Context.javaToJS;
import static org.mozilla.javascript.Context.reportError;
import static org.mozilla.javascript.ScriptableObject.DONTENUM;
import static org.mozilla.javascript.ScriptableObject.READONLY;
import static org.mozilla.javascript.ScriptableObject.putProperty;
import static org.slf4j.LoggerFactory.getLogger;

import com.adlitteram.jspool.files.SourceFile;
import cz.autel.dmi.HIGConstraints;
import cz.autel.dmi.HIGLayout;
import java.awt.Dialog;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import javax.swing.*;
import org.mozilla.javascript.*;
import org.slf4j.Logger;

public class ScriptExec extends AbstractTarget {

  private static final Logger LOG = getLogger(ScriptExec.class);

  public static final String SCRIPT_TARGET_PATH = "ExecTarget.Path";
  public static final String SCRIPT_TARGET_PARAMETERS = "ExecTarget.Parameters";

  private Shell shell;
  private Script script;

  private JTextField execField;
  private JTextArea parametersArea;

  @Override
  public String getName() {
    return "Script";
  }

  @Override
  public synchronized void close() {
    if (getCurrentContext() != null) {
      exit();
    }
  }

  @Override
  public synchronized int run(String srcDir, SourceFile file) {
    Context cx = getCurrentContext();

    if (cx == null) {
      cx = enter();
      cx.initStandardObjects();

      shell = new Shell(cx, channel);
      String[] names = {"_print", "_exec", "_exec2", "_execFor", "_getValue", "_setValue"};
      shell.defineFunctionProperties(names, Shell.class, DONTENUM);
      shell.defineProperty("_OK", OK, READONLY);
      shell.defineProperty("_KEEP", KEEP, READONLY);
      shell.defineProperty("_FAIL", FAIL, READONLY);
      shell.defineProperty("_NOP", NOP, READONLY);

      String filename = channel.getStringProp(SCRIPT_TARGET_PATH);

      String params = channel.getStringProp(SCRIPT_TARGET_PARAMETERS, "");
      if (!params.isEmpty() && !params.endsWith("\n")) {
        params += "\n";
      }

      for (String param : params.split("\n")) {
        int index = param.indexOf('=');
        if (index > 0 && (index + 1) < param.length()) {
          String key = param.substring(0, index);
          String value = param.substring(index + 1);
          channel.setContextValue(key, value);
        }
      }

      script = compile(cx, shell, filename);
    }

    if (script == null) {
      exit();
      return FAIL;
    } else {
      putProperty(shell, "_srcFile", javaToJS(file, shell));
      putProperty(shell, "_srcDir", javaToJS(srcDir, shell));
      try {
        script.exec(cx, shell);
        Number value = (Number) shell.get("_exit", shell);
        return value.intValue();
      } catch (WrappedException we) {
        channel.logWarning(
            channel.getStringProp(ID)
                + " - ScriptExec.run() "
                + we.getWrappedException().toString(),
            we);
        exit();
        return FAIL;
      } catch (Exception e) {
        channel.logWarning(
            channel.getStringProp(ID) + " - ScriptExec.run() : " + e.getMessage(), e);
        exit();
        return FAIL;
      }
    }
  }

  private Script compile(Context cx, Scriptable shell, String filename) {
    FileReader in = null;

    try {
      in = new FileReader(filename);
      return cx.compileReader(shell, in, filename, 1, null);
    } catch (FileNotFoundException ex) {
      channel.logWarning(channel.getStringProp(ID) + " - ScriptExec.compile() " + filename, ex);
      reportError("Couldn't open file \"" + filename + "\".");
    } catch (WrappedException we) {
      channel.logWarning(
          channel.getStringProp(ID)
              + " - ScriptExec.compile() "
              + we.getWrappedException().toString(),
          we);
    } catch (EvaluatorException | JavaScriptException | IOException ee) {
      channel.logWarning(
          channel.getStringProp(ID) + " - ScriptExec.compile() " + ee.getMessage(), ee);
    } finally {
      closeQuietly(in);
    }
    return null;
  }

  @Override
  public JPanel buildPanel(Dialog parent) {

    execField = new JTextField(channel.getStringProp(SCRIPT_TARGET_PATH), 25);
    JButton browseButton = createBrowseButton(execField, execField, null, "open");

    parametersArea = new JTextArea(channel.getStringProp(SCRIPT_TARGET_PARAMETERS), 10, 30);
    parametersArea.setLineWrap(true);
    parametersArea.setWrapStyleWord(false);
    invertFocusTraversalBehaviour(parametersArea);

    JButton editorButton = new JButton("Edit Script");
    editorButton.addActionListener(
        ae -> {
          String javaExe = normalize(JAVA_HOME + "/bin/java");
          String rtextDir = normalize(PROG_DIR + "ext/java/RText/");
          String[] args = {"-jar", rtextDir + "RText.jar", execField.getText()};
          try {
            execAsync(javaExe, args, new File(rtextDir));
          } catch (IOException ex) {
            channel.logWarning(channel.getStringProp(ID), ex);
          }
        });

    int[] w = {5, 0, 5, 0, 5, 0, 5};
    int[] h = {5, 0, 5, 0, 10, 0, 5};
    HIGConstraints c = new HIGConstraints();
    HIGLayout layout = new HIGLayout(w, h);
    layout.setColumnWeight(4, 1);

    JPanel panel = new JPanel(layout);
    panel.add(new JLabel(get("scriptExec.javascript")), c.xy(2, 2, "r"));
    panel.add(execField, c.xy(4, 2, "lr"));
    panel.add(browseButton, c.xy(6, 2, ""));
    panel.add(editorButton, c.xy(4, 4, "l"));
    panel.add(new JLabel(get("scriptExec.parameters")), c.xy(2, 6, "r"));
    panel.add(new JScrollPane(parametersArea), c.xy(4, 6, "lr"));
    return panel;
  }

  @Override
  public boolean setParameters() {
    channel.setProperty(SCRIPT_TARGET_PATH, execField.getText());
    channel.setProperty(SCRIPT_TARGET_PARAMETERS, parametersArea.getText());
    return true;
  }
}
