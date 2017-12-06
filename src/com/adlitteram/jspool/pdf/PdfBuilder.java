/*
 * PdfMerger.java
 *
 * Created on 16 mai 2006, 17:17
 *
 * To change this template, choose Tools | Template Manager
 * and open the template in the editor.
 */
package com.adlitteram.jspool.pdf;

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.NumUtils;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.Utils;
import com.drew.imaging.jpeg.JpegMetadataReader;
import com.drew.imaging.jpeg.JpegProcessingException;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.MetadataException;
import com.drew.metadata.iptc.IptcDirectory;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.*;
import java.awt.AlphaComposite;
import java.awt.Graphics2D;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PdfBuilder {

    private static final Logger logger = LoggerFactory.getLogger(PdfBuilder.class);
    //
    private static final int[] alignArray = {Element.ALIGN_LEFT, Element.ALIGN_RIGHT, Element.ALIGN_CENTER};
    private static final int OFFSET = 28;
    //
    private final Channel channel;
    private File inputFile;
    private File outputFile;
    private File cnfDir;
    private File errorDir;
    //private Directory exifDirectory ;
    private Directory iptcDirectory;
    private Properties properties;
    private ZipFile zfile;
    private ArrayList imageList;
    private ArrayList textList;
    private int quantity = 0;
    private String reference = "";
    private String source = "";
    private String category = "";
    private String address = "";
    private String note = "";
    // private String barcode = "" ;
    private String odate = "";
    private String order = "";
    private PdfReader bgReader;
    private PdfStamper bgStamper;
    private PdfReader covReader;
    private PdfReader horReader;
    private PdfReader verReader;

    public PdfBuilder(Channel channel) {
        this.channel = channel;
    }

    public boolean build(String input, String config, String error) {
        this.inputFile = new File(input);
        this.cnfDir = new File(config);
        this.errorDir = new File(error);

        try {
            // Read  Zip File, then initialize metadata & properties
            readZipFile();
            loadMetadata();
            loadProperties();

            // Init files
            String outputName = Utils.getBasename(inputFile) + ".pdf";
            String dstRegex = properties.getProperty("Dst_Regex");
            String dstName = properties.getProperty("Dst_Name");
            if (dstRegex != null && dstName != null) {
                outputName = rename(dstRegex, inputFile.getName(), dstName);
            }
            String dstDirname = properties.getProperty("Dst_Dir");
            outputFile = new File(dstDirname, outputName);

            // Load Background Template
            String filename = properties.getProperty("Pdf_Template_Path");
            bgReader = new PdfReader(filename);
            bgStamper = new PdfStamper(bgReader, new FileOutputStream(outputFile));

            String covName = properties.getProperty("Pdf_Cover_Path");
            if (covName != null) {
                covReader = new PdfReader(covName);
            }

            String horName = properties.getProperty("Pdf_Horizontal_Path");
            if (horName != null) {
                horReader = new PdfReader(horName);
            }

            String verName = properties.getProperty("Pdf_Vertical_Path");
            if (verName != null) {
                verReader = new PdfReader(verName);
            }

            // Create Index & cover & pages
            File file = getTempJpegFile(0);
            createIndexPage(file.getPath());
            createCoverPage(file.getPath());
            file.delete();

            // 29 = Janvier 2007 - 1ère page
            for (int i = 3; i <= bgReader.getNumberOfPages(); i++) {
                String name = (String) imageList.get(i - 2);
                createPage(i, getOffset(name) - OFFSET);
            }

            // Flush the PDF
            bgStamper.close();
            bgReader.close();
            if (horReader != null) {
                horReader.close();
            }
            if (verReader != null) {
                verReader.close();
            }

            // Extract text order now
            extractText();

            zfile.close();

            return true;
        }
        catch (Exception e) {
            logger.warn("", e);

            if (bgReader != null) {
                bgReader.close();
            }
            if (horReader != null) {
                horReader.close();
            }
            if (verReader != null) {
                verReader.close();
            }
            try {
                if (zfile != null) {
                    zfile.close();
                }
            }
            catch (Exception e1) {
            }

            copyToError();
            return false;
        }
    }

    private int getOffset(String str) {
        int last = str.lastIndexOf('.');
        str = str.substring(str.lastIndexOf('_', last) + 1, last);
        try {
            return Integer.parseInt(str);
        }
        catch (Exception e) {
            logger.warn("", e);
            return -1;
        }
    }

    private void readZipFile() throws IOException {
        imageList = new ArrayList();
        textList = new ArrayList();

        zfile = new ZipFile(inputFile);
        for (Enumeration entries = zfile.entries(); entries.hasMoreElements();) {
            ZipEntry entry = (ZipEntry) entries.nextElement();
            if (entry.isDirectory()) {
                continue;
            }
            if (entry.getName().toLowerCase().endsWith(".txt")) {
                textList.add(entry.getName());
            }
            else {
                imageList.add(entry.getName());
            }
        }
        Collections.sort(imageList);
    }

    private void loadMetadata() throws IOException, JpegProcessingException, MetadataException {
        InputStream is = null;

        try {
            ZipEntry entry = zfile.getEntry((String) imageList.get(0));
            is = zfile.getInputStream(entry);
            Metadata metadata = JpegMetadataReader.readMetadata(is);

            //exifDirectory = metadata.getDirectory(ExifDirectory.class);
            iptcDirectory = metadata.getDirectory(IptcDirectory.class);

            quantity = iptcDirectory.getInt(0xffffffc8);
            reference = iptcDirectory.getString(IptcDirectory.TAG_ORIGINAL_TRANSMISSION_REFERENCE);
            source = iptcDirectory.getString(IptcDirectory.TAG_SOURCE);
            category = iptcDirectory.getString(IptcDirectory.TAG_SUPPLEMENTAL_CATEGORIES);
            address = iptcDirectory.getString(IptcDirectory.TAG_SPECIAL_INSTRUCTIONS);
            note = iptcDirectory.getString(0x0279);
            //barcode = iptcDirectory.getString(0xffffffca) ;
            odate = iptcDirectory.getString(0xffffffcb);
            order = iptcDirectory.getString(0xffffffcc);

            // debug
            //displayMetadata(metadata) ;
        }
        finally {
            if (is != null) {
                is.close();
            }
        }
    }

//    private void displayMetadata(Metadata metadata) {
//        Iterator directories = metadata.getDirectoryIterator();
//        while (directories.hasNext()) {
//            Directory directory = (Directory) directories.next();
//            Iterator tags = directory.getTagIterator();
//            while (tags.hasNext()) {
//                System.out.println((Tag) tags.next());
//            }
//        }
//    }

    private void loadProperties() throws IOException {
        InputStream is = null;
        properties = new Properties();

        try {
            File file = new File(cnfDir, category + ".txt");
            is = new FileInputStream(file);
            properties.load(is);
            logger.info("Using " + file.getPath() + " for transformation.");
        }
        finally {
            try {
                if (is != null) {
                    is.close();
                }
            }
            catch (IOException ioe1) {
            }
        }
    }

    private void copyToError() {
        try {
            FileUtils.copyFileToDirectory(inputFile, errorDir);
            inputFile.delete();
        }
        catch (IOException ioe) {
            logger.info(ioe.getMessage());
        }
    }

    private void createIndexPage(String filename) throws Exception {
        // Image
        Image img = Image.getInstance(filename);
        float x = NumUtils.floatValue(properties.get("Index_Frame_X"), 0);
        float y = NumUtils.floatValue(properties.get("Index_Frame_Y"), 0);
        float w = NumUtils.floatValue(properties.get("Index_Frame_Width"), img.getWidth());
        float h = NumUtils.floatValue(properties.get("Index_Frame_Height"), img.getHeight());

        PdfContentByte overContent = bgStamper.getOverContent(1);

        float ratio = Math.min(w / img.getWidth(), h / img.getHeight());
        float w1 = ratio * img.getWidth();
        float h1 = ratio * img.getHeight();
        overContent.addImage(img, w1, 0, 0, h1, x + (w - w1) / 2, y + (h - h1) / 2);

        // Text
        addText(overContent, "1");
        addText(overContent, "2");
        addText(overContent, "3");
        addText(overContent, "4");
        addText(overContent, "5");

        // Barcode
        addBarcode(overContent);
    }

    public void createCoverPage(String filename) throws Exception {

        String name = (String) imageList.get(0);
        String str = name.substring(0, name.lastIndexOf('.')).toUpperCase();

        int offset = 1;
        if (str.endsWith("E")) {
            offset = 2;
        }
        else if (str.endsWith("F")) {
            offset = 3;
        }
        else if (str.endsWith("G")) {
            offset = 4;
        }
        else if (str.endsWith("H")) {
            offset = 5;
        }
        else if (str.endsWith("I")) {
            offset = 6;
        }
        else if (str.endsWith("J")) {
            offset = 7;
        }
        else if (str.endsWith("K")) {
            offset = 8;
        }
        else if (str.endsWith("L")) {
            offset = 9;
        }
        else if (str.endsWith("M")) {
            offset = 10;
        }

        Image img = Image.getInstance(filename);
        float x = NumUtils.floatValue(properties.get("Cover_Frame_X"), 0);
        float y = NumUtils.floatValue(properties.get("Cover_Frame_Y"), 0);
        float w = NumUtils.floatValue(properties.get("Cover_Frame_Width"), img.getWidth());
        float h = NumUtils.floatValue(properties.get("Cover_Frame_Height"), img.getHeight());

        float ratio = Math.min(w / img.getWidth(), h / img.getHeight());
        float w1 = ratio * img.getWidth();
        float h1 = ratio * img.getHeight();

        PdfContentByte overContent = bgStamper.getOverContent(2);
        PdfImportedPage ip = bgStamper.getImportedPage(covReader, offset);
        if (ip != null) {
            overContent.addTemplate(ip, 1, 0, 0, 1, 0, 0);
        }
        overContent.addImage(img, w1, 0, 0, h1, x + (w - w1) / 2, y + (h - h1) / 2);
    }

    public void createPage(int index, int page) throws Exception {
        float x, y, w, h;

        File file = getTempJpegFile(index - 2);
        Image img = Image.getInstance(file.getPath());
        PdfImportedPage ip = null;

        if (img.getWidth() >= img.getHeight()) {
            x = NumUtils.floatValue(properties.get("Horizontal_Frame_X"), 0);
            y = NumUtils.floatValue(properties.get("Horizontal_Frame_Y"), 0);
            w = NumUtils.floatValue(properties.get("Horizontal_Frame_Width"), img.getWidth());
            h = NumUtils.floatValue(properties.get("Horizontal_Frame_Height"), img.getHeight());

            if (horReader != null) {
                ip = bgStamper.getImportedPage(horReader, page);
            }

        }
        else {
            x = NumUtils.floatValue(properties.get("Vertical_Frame_X"), 0);
            y = NumUtils.floatValue(properties.get("Vertical_Frame_Y"), 0);
            w = NumUtils.floatValue(properties.get("Vertical_Frame_Width"), img.getWidth());
            h = NumUtils.floatValue(properties.get("Vertical_Frame_Height"), img.getHeight());

            if (verReader != null) {
                ip = bgStamper.getImportedPage(verReader, page);
            }
        }

        PdfContentByte overContent = bgStamper.getOverContent(index);
        if (ip != null) {
            overContent.addTemplate(ip, 1, 0, 0, 1, 0, 0);
        }

        float ratio = Math.min(w / img.getWidth(), h / img.getHeight());
        float w1 = ratio * img.getWidth();
        float h1 = ratio * img.getHeight();
        overContent.addImage(img, w1, 0, 0, h1, x + (w - w1) / 2, y + (h - h1) / 2);
        file.delete();
    }

    private void addText(PdfContentByte cb, String v) {
        try {
            String fontPath = (String) properties.get("Index_Text" + v + "_Font");
            if (fontPath == null || fontPath.length() == 0) {
                fontPath = BaseFont.HELVETICA;
            }
            BaseFont bf = BaseFont.createFont(fontPath, BaseFont.WINANSI, BaseFont.EMBEDDED);
            int size = NumUtils.intValue(properties.get("Index_Text" + v + "_Size"), 12);
            cb.setFontAndSize(bf, size);

            String text = (String) properties.get("Index_Text" + v);
            if (text != null && text.length() > 0) {
                text = replaceText(text);
                float x = NumUtils.floatValue(properties.get("Index_Text" + v + "_X"), 0);
                float y = NumUtils.floatValue(properties.get("Index_Text" + v + "_Y"), 0);
                int align = alignArray[NumUtils.intValue(properties.get("Index_Text" + v + "_Align"), 0)];


                cb.beginText();
                int j = 0;
                String str;
                int len = NumUtils.intValue(properties.get("Index_Text" + v + "_Length"), text.length());

                while (j < text.length()) {
                    if (j + len < text.length()) {
                        int i = text.lastIndexOf(' ', j + len);
                        if (i <= j) {
                            i = j + len;
                        }
                        cb.showTextAligned(align, text.substring(j, i), x, y, 0);
                        y -= (float) size * 1.2f;
                        j = i;
                    }
                    else {
                        cb.showTextAligned(align, text.substring(j), x, y, 0);
                        j = text.length();
                    }
                }
                cb.endText();

            }
        }
        catch (Exception e) {
            logger.warn("", e);
        }
    }

    private void addBarcode(PdfContentByte cb) throws IOException, DocumentException {

        if ("true".equalsIgnoreCase((String) properties.get("Index_Add_BarCod"))) {

            Barcode128 pdfBarcode = new Barcode128();
            pdfBarcode.setCode(reference);

            float x = NumUtils.floatValue(properties.get("Index_BarCod_X"), 0);
            float y = NumUtils.floatValue(properties.get("Index_BarCod_Y"), 0);
            float r = NumUtils.floatValue(properties.get("Index_BarCod_R"), 0);

            PdfTemplate img = pdfBarcode.createTemplateWithBarcode(cb, null, null);
            AffineTransform af1 = new AffineTransform();
            af1.translate(x, y);
            af1.rotate(r);

            double[] mx = new double[6];
            af1.getMatrix(mx);
            cb.addTemplate(img, (float) mx[0], (float) mx[1], (float) mx[2], (float) mx[3], (float) mx[4], (float) mx[5]);
        }
    }

    private void extractText() throws IOException {
        String textDir = (String) properties.get("Text_Dir");
        if (textDir == null) {
            return;
        }

        for (Object textList1 : textList) {
            InputStream is = null;
            FileOutputStream os = null;
            try {
                ZipEntry entry = zfile.getEntry((String) textList1);
                is = zfile.getInputStream(entry);
                File file = new File(textDir, Utils.getBasename(entry.getName()) + ".txt");
                os = new FileOutputStream(file);
                int n;
                byte[] buf = new byte[1024];
                while ((n = is.read(buf)) > 0) {
                    os.write(buf, 0, n);
                }
            } finally {
                if (os != null) {
                    os.close();
                }
                if (is != null) {
                    is.close();
                }
            }
        }
    }

    private File getTempJpegFile(int number) throws IOException {
        InputStream is = null;
        FileOutputStream os = null;
        File file = null;

        try {
            ZipEntry entry = zfile.getEntry((String) imageList.get(number));
            is = zfile.getInputStream(entry);

            file = File.createTempFile("tmp_", ".jpg");
            file.deleteOnExit();

            if (properties != null && "true".equalsIgnoreCase((String) properties.get("Recompress_Image"))) {
                float quality = NumUtils.floatValue(properties.get("Recompress_Image_Quality"), 0.9f);
                writeJPEG(ImageIO.read(is), file, quality);
            }
            else {
                os = new FileOutputStream(file);
                int n;
                byte[] buf = new byte[4096];
                while ((n = is.read(buf)) > 0) {
                    os.write(buf, 0, n);
                }
            }
        }
        finally {
            if (os != null) {
                os.close();
            }
            if (is != null) {
                is.close();
            }
        }
        return file;
    }

    private String rename(String regexp, String input, String output) {

        try {
            output = replaceText(output);
            Matcher m = Pattern.compile(regexp).matcher(input);
            if (m.matches()) {
                int state = 0;
                //int count = m.groupCount();
                StringBuilder buffer = new StringBuilder();
                StringBuffer value = null;

                for (int i = 0; i < output.length(); i++) {
                    char c = output.charAt(i);
                    if (state == 0) {
                        if (c == '{') {
                            value = new StringBuffer(2);
                            state = 1;
                        }
                        else {
                            buffer.append(c);
                        }
                    }
                    else {
                        if (c == '}') {
                            int j = Integer.parseInt(value.toString());
                            buffer.append(m.group(j));
                            state = 0;
                        }
                        else {
                            value.append(c);
                        }
                    }
                }
                return buffer.toString();
            }
        }
        catch (Exception e) {
            logger.warn(channel.getStringProp(Channel.ID) + " - " + Message.get("channel.domove.message7") + " : " + regexp);
        }
        return output;
    }

    private String replaceText(String text) {
        return text.replaceAll("\\{QUANTITY\\}", String.valueOf(quantity)).replaceAll("\\{REFERENCE\\}", reference).replaceAll("\\{SOURCE\\}", source).replaceAll("\\{CATEGORY\\}", category).replaceAll("\\{ADDRESS\\}", address).replaceAll("\\{NOTE\\}", note).replaceAll("\\{DATE\\}", odate).replaceAll("\\{ORDER\\}", order);
    }

    public static void writeJPEG(BufferedImage bi, Object obj, float quality) {

        // Create output stream
        ImageOutputStream ios = null;
        ImageWriter writer = null;

        try {
            ios = ImageIO.createImageOutputStream(obj);
            writer = (ImageWriter) ImageIO.getImageWritersByFormatName("jpg").next();
            writer.setOutput(ios);

            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(quality);
            writer.write(null, new IIOImage(getRGBImage(bi), null, null), param);

            ios.close();
            writer.dispose();
        }
        catch (Exception e) {
            logger.warn("", e);
            try {
                if (ios != null) {
                    ios.close();
                }
            }
            catch (IOException ioe) {
            }
            if (writer != null) {
                writer.dispose();
            }
        }
    }

    private static BufferedImage getRGBImage(java.awt.Image img) {
        if (img instanceof BufferedImage) {
            BufferedImage bimg = (BufferedImage) img;
            if (bimg.getType() == BufferedImage.TYPE_INT_RGB) {
                return bimg;
            }
        }

        BufferedImage bi = new BufferedImage(img.getWidth(null), img.getHeight(null), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = bi.createGraphics();
        g.setComposite(AlphaComposite.Src);
        g.drawImage(img, 0, 0, null);
        g.dispose();
        return bi;
    }
}
