/*
 * PdfDecryptor.java
 *
 * Created on 22 décembre 2005, 15:47
 *
 * To change this template, choose Tools | Options and locate the template under
 * the Source Creation and Management node. Right-click the template and choose
 * Open. You can then make changes to the template in the Source Editor.
 */
package com.adlitteram.jspool.pdf;

import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.Utils;
import com.adlitteram.jspool.xml.XPropertiesReader;
import com.lowagie.text.DocumentException;
import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Properties;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PdfDecryptor {

    private static final Logger logger = LoggerFactory.getLogger(PdfDecryptor.class);
    //
    private static final Charset ISO_8859_1 = Charset.forName("ISO-8859-1");
    private static final byte[] ownerPassword = {'e', 'n', 'u', 'l', 'l', '3', 'X', 'W', 'h', '0', 'o', 'E'};
    private static final byte[] ownerPassword2 = {'F', 'a', 'Z', 'n', 'u', 'l', 'l', '0', 'r', 'R', '3', 'b'};
    //
    private final Channel channel;

    /**
     * Creates a new instance of PdfDecryptor
     */
    public PdfDecryptor(Channel channel) {
        this.channel = channel;
    }

    public boolean decrypt(String input, String output, String error, String passwords) {
        File ifile = new File(input);
        File ofile = Utils.getExtFile(new File(output, ifile.getName()), "pdf");
        File efile = new File(error, ifile.getName());

        if (!ofile.getParentFile().exists()) {
            ofile.getParentFile().mkdirs();
        }
        if (!efile.getParentFile().exists()) {
            efile.getParentFile().mkdirs();
        }

        String[] passArray = passwords.split("\n");
        ArrayList<byte[]> passList = new ArrayList<>(passArray.length + 2);
        for (String password : passArray) {
            byte[] b = password.getBytes(ISO_8859_1) ;
            if ( b.length > 0 ) passList.add(b);
        }
        passList.add(ownerPassword);
        passList.add(ownerPassword2);

        for (int i = 0; i < passList.size(); i++) {
            try {
                logger.info("password: " + new String(passList.get(i)));
                PdfUtils.decrypt(ifile, ofile, passList.get(i));
                logger.info(input + " succesfully decrypted - index: " + (i + 1));
                break;
            }
            catch (Exception e) {
                if (i == (passList.size() - 1)) {
                    logger.warn(input + " - decrypt error : ", e);
                    logger.info("error : unable to decrypt " + input);
                    try {
                        FileUtils.copyFile(ifile, efile);
                        FileUtils.forceDelete(ifile);
                    }
                    catch (IOException e2) {
                        logger.warn(input + " - copy error : ", e2);
                    }
                }
            }
        }

        return true;
    }

    public boolean setInfoMap(String input, String output, String error) {
        File xmlFile, pdfFile;

        if (input.toLowerCase().endsWith(".xml")) {
            xmlFile = new File(input);
            pdfFile = Utils.getExtFile(xmlFile, "pdf");
        }
        else {
            pdfFile = new File(input);
            xmlFile = Utils.getExtFile(pdfFile, "xml");
        }

        File ofile = new File(output, pdfFile.getName());
        if (!ofile.getParentFile().exists()) {
            ofile.getParentFile().mkdirs();
        }

        File efile = new File(error);
        if (!efile.exists()) {
            efile.mkdirs();
        }

        //logger.info("recrypt: " + input) ;
        long pdfSize = pdfFile.length();
        long xmlSize = xmlFile.length();

        //Utils.sleep(10000);

        if (!pdfFile.exists() || pdfFile.length() != pdfSize) {
            logger.info(pdfFile + " is not stable or does not exists");
            return false;
        }

        if (!xmlFile.exists() || xmlFile.length() != xmlSize) {
            logger.info(xmlFile + " is not stable or does not exists");
            return false;
        }

        try {
            Properties props = new Properties();
            XPropertiesReader.read(props, "eDoc.", new File(xmlFile.getPath()).toURI());
            props.put("Author", props.getProperty("eDoc.FirstName", "") + " " + props.getProperty("eDoc.LastName", ""));

            PdfUtils.addInfo(pdfFile, ofile, new HashMap(props));
            logger.info(input + " successfully processed (Addinfo)");

            pdfFile.delete();
            xmlFile.delete();
        }
        catch (IOException | DocumentException e) {
            logger.warn(input + " - recrypt error : ", e);
            logger.info("Addinfo error " + input);

            try {
                FileUtils.copyFile(xmlFile, efile);
                FileUtils.copyFile(pdfFile, efile);
                xmlFile.delete();
                pdfFile.delete();
            }
            catch (IOException e2) {
                logger.warn(input + " - copy error : ", e2);
            }
        }

        return true;
    }

    public boolean recrypt(String input, String output, String error) {

        File ifile = new File(input);
        File ofile = Utils.getExtFile(new File(output, ifile.getName()), "fdc");
        File efile = new File(error, ifile.getName());

        if (!ofile.getParentFile().exists()) {
            ofile.getParentFile().mkdirs();
        }
        if (!efile.getParentFile().exists()) {
            efile.getParentFile().mkdirs();
        }

        //logger.info("recrypt: " + input) ;
        try {
            PdfUtils.recrypt(ifile, ofile, ownerPassword);
            logger.info(input + " successfully recrypted");
        }
        catch (IOException | DocumentException e) {
            logger.warn(input + " - recrypt error : ", e);
            logger.info("Recrypt error : " + input);

            try {
                FileUtils.copyFile(ifile, efile);
                ifile.delete();
            }
            catch (IOException e2) {
                logger.warn(input + " - copy error : ", e2);
            }
        }

        return true;
    }
}
