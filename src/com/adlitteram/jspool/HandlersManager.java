/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.adlitteram.jspool;

import com.adlitteram.jspool.sources.FtpSource;
import com.adlitteram.jspool.sources.LocalDir;
import com.adlitteram.jspool.sources.LocalScript;
import com.adlitteram.jspool.sources.MailSource;
import com.adlitteram.jspool.targets.*;

public class HandlersManager {

    public static Class[] getSourceHandlers() {
        return new Class[]{
            LocalDir.class,
            FtpSource.class,
            LocalScript.class,
            MailSource.class
        };
    }

    public static Class[] getTargetHandlers() {
        if ("jSpool".equals(Update.getNAME())) {
            return new Class[]{
                LocalMove.class,
                FtpMove.class,
                LocalExec.class,
                Purge.class,
                MailSend.class,
                ScriptExec.class,
                Unzip.class
            };
        } else {
            return new Class[]{
                LocalMove.class,
                FtpMove.class,
                LocalExec.class,
                Purge.class,
                MailSend.class,
                ScriptExec.class,
                PdfDecrypt.class,
                PdfTransform.class,
                PdfRecrypt.class,
                Unzip.class,
                PdfBuild.class,
                PdfAddInfo.class,};
        }

    }
}
