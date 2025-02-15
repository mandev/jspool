package com.adlitteram.jspool.utils;

import com.adlitteram.jspool.Main;
import java.io.File;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.SystemUtils;

public class PlatformUtils {

  public static final String HOME_DIR = getHomeDir();
  public static final String PROG_DIR = getProgDir();

  private static String getHomeDir() {
    if (SystemUtils.getUserHome().isDirectory()) {
      return appendSeparator(SystemUtils.USER_HOME);
    }
    return SystemUtils.IS_OS_WINDOWS ? "C:\\" : "/";
  }

  // Typically :
  // Windows : c:\\program files\\pictbook
  // Linux : /usr/local/pictbook
  // MacOSX : /Application/PictBook.app/Contents/Resources/
  private static String getProgDir() {
    return SystemUtils.IS_OS_MAC_OSX
        ? getMacOSXProgDir(Main.class)
        : appendSeparator(SystemUtils.USER_DIR);
  }

  // jar:file:/D:/distrib/windows/SmileBook/lib/edoc.jar!/com/AdLitteram/eDoc/Resources/default.xml
  public static String getMacOSXProgDir(Class<?> klass) {
    File file = null; // return file

      ClassLoader cl = klass.getClassLoader();
      if (cl == null) {
        cl = ClassLoader.getSystemClassLoader();
      }

      URL url = cl.getResource(klass.getName().replace('.', '/') + ".class");

      if (url != null) {
        String ef = url.toExternalForm();
        String lc = ef.toLowerCase();
        while (lc.startsWith("jar:") || lc.startsWith("file:/")) {
          if (lc.startsWith("jar:")) {
            if (lc.contains("!/")) {
              ef = ef.substring("jar:".length(), (ef.indexOf("!/")));
            } // strip encapsulating "jar:" and "!/..." from JAR url
            else {
              ef = ef.substring("jar:".length());
            } // strip encapsulating "jar:"
          }
          if (lc.startsWith("file:/")) {
            ef = ef.substring("file:/".length()); // strip encapsulating "file:/"
            if (!ef.startsWith("/")) {
              ef = ("/" + ef);
            }
            while (ef.length() > 1 && ef.charAt(1) == '/') {
              ef = ef.substring(1);
            }
          }
          lc = ef.toLowerCase();
        }
        ef = URLDecoder.decode(ef, StandardCharsets.UTF_8);
        file = new File(ef);
        file = file.getParentFile().getParentFile();
        file = new File(file, "Resources");
        if (file.exists()) {
          file = file.getAbsoluteFile();
        }
      }
      return file == null ? null : appendSlash(file.getPath());
  }

  private static String appendSeparator(String str) {
    String s = FilenameUtils.separatorsToUnix(str);
    return s.endsWith("/") ? str : str + File.separator;
  }

  private static String appendSlash(String str) {
    str = FilenameUtils.separatorsToUnix(str);
    return str.endsWith("/") ? str : str + "/";
  }
}
