package com.adlitteram.jspool.pdf;

import com.adlitteram.jspool.Update;
import com.adlitteram.jspool.Version;
import com.lowagie.text.DocumentException;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.PdfStamper;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.RandomAccessFileOrArray;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.InetAddress;
import java.util.Date;
import java.util.HashMap;

import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PdfUtils {

    private static final Logger logger = LoggerFactory.getLogger(PdfUtils.class);
    //
    // recrypt the fdc

    public static void recrypt(File ifile, File ofile, byte[] ownerPassword) throws IOException, DocumentException {
        PdfReader reader = null;
        FileOutputStream os = null;
        try {
            reader = new PdfReader(new RandomAccessFileOrArray(ifile.getPath(), false, true), null);
            //reader = new PdfReader(ifile.getPath());
            os = new FileOutputStream(ofile);
            PdfStamper stamper = new PdfStamper(reader, os);
            stamper.setEncryption(ownerPassword, ownerPassword, 0, PdfWriter.STRENGTH128BITS);
            stamper.close();
        }
        finally {
            PdfUtils.closeQuietly(reader);
            IOUtils.closeQuietly(os);
        }
    }

    // recrypt the fdc
    public static void addInfo(File ifile, File ofile, HashMap map) throws IOException, DocumentException {
        PdfReader reader = null;
        FileOutputStream os = null;
        try {
            reader = new PdfReader(new RandomAccessFileOrArray(ifile.getPath(), false, true), null);
            //reader = new PdfReader(ifile.getPath());
            os = new FileOutputStream(ofile);
            PdfStamper stamper = new PdfStamper(reader, os);
            stamper.setMoreInfo(map);
            stamper.close();
        }
        finally {
            PdfUtils.closeQuietly(reader);
            IOUtils.closeQuietly(os);
        }
    }

    // decrypt the fdc
    public static void decrypt(File ifile, File ofile, byte[] ownerPassword) throws IOException, DocumentException {
        PdfReader reader = null;
        FileOutputStream os = null;

        try {
            reader = new PdfReader(new RandomAccessFileOrArray(ifile.getPath(), false, true), ownerPassword);
            //reader = new PdfReader(ifile.getPath(), ownerPassword);
            os = new FileOutputStream(ofile);
            PdfStamper stamper = new PdfStamper(reader, os);

            InetAddress addr = InetAddress.getLocalHost();
            String hostaddr = addr.getHostAddress();
            String address = addr.getAddress().toString();
            int number = Counter.next();

            logger.info("decrypt counter : " + number);

            HashMap map = new HashMap();
            map.put("Decrypt.Id", address + "-" + Integer.toHexString(number));
            map.put("Decrypt.Host", hostaddr);
            map.put("Decrypt.Number", String.valueOf(number));
            map.put("Decrypt.Barcode", String.valueOf(number));
            map.put("Decrypt.Date", new Date().toString());
            map.put("Decrypt.Name", Update.getNAME() + " " + Version.getRELEASE());

//         if ( PdfDecryptor.getNumber() > 100 ) {
//            for (int i=1 ; i <= stamper.getReader().getNumberOfPages(); i++) {
//               addWaterMark(stamper.getOverContent(i)) ;
//            }
//         }

            stamper.setMoreInfo(map);
            stamper.close();
        }
        finally {
            PdfUtils.closeQuietly(reader);
            IOUtils.closeQuietly(os);
        }

    }

    public static void closeQuietly(PdfReader reader) {
        if (reader != null) {
            reader.close();
        }
    }
    // Build and Add the watermark
//    private static void addWaterMark(PdfContentByte cb) {
//        PdfTemplate mark = cb.createTemplate(200, 110);
//
//        mark.setRGBColorFill(1, 1, 1);
//        mark.setRGBColorFillF(1, 1, 1);
//        mark.setRGBColorStroke(1, 1, 1);
//        mark.setRGBColorStrokeF(1, 1, 1);
//
//        BaseFont font = null;
//
//        try {
//            font = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
//            //BaseFont font = BaseFont.createFont("c:\\winnt\\fonts\\casmira_.ttf", BaseFont.CP1252, BaseFont.EMBEDDED);
//        }
//        catch (Exception e) {
//            logger.warn("", e);
//        }
//
//        for (int i = 0; i < 3; i += 2) {
//            mark.ellipse(1, 1, 99, 99);
//            mark.ellipse(15, 15, 85, 85);
//            mark.stroke();
//
//            mark.beginText();
//            mark.setFontAndSize(font, 12);
//            mark.showTextAligned(PdfContentByte.ALIGN_CENTER, "Made", 50, 60, 0);
//            mark.showTextAligned(PdfContentByte.ALIGN_CENTER, "with", 50, 47, 0);
//            mark.showTextAligned(PdfContentByte.ALIGN_CENTER, Update.getNAME(), 50, 33, 0);
//
//            //if ( LicenceFrame.isDemoLicense() )  {
//            mark.setFontAndSize(font, 10);
//            mark.showTextAligned(PdfContentByte.ALIGN_CENTER, "Demo", 50, 6, 0);
//            mark.showTextAligned(PdfContentByte.ALIGN_CENTER, "Demo", 50, 88, 0);
//            //}
//
//            mark.endText();
//            mark.transform(AffineTransform.getTranslateInstance(1d, 1d));
//
//            mark.setRGBColorFill(0, 0, 0);
//            mark.setRGBColorFillF(0, 0, 0);
//            mark.setRGBColorStroke(0, 0, 0);
//            mark.setRGBColorStrokeF(0, 0, 0);
//        }
//        cb.addTemplate(mark, 0.866f, .5f, -0.5f, 0.866f, 50f, 10f);
//    }
}
