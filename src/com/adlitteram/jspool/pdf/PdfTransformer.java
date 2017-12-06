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

import com.adlitteram.jasmin.Message;
import com.adlitteram.jasmin.utils.NumUtils;
import com.adlitteram.jspool.Channel;
import com.adlitteram.jspool.Utils;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import java.awt.Color;
import java.awt.geom.AffineTransform;
import java.awt.geom.Rectangle2D;
import java.io.*;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PdfTransformer {

    private static final Logger logger = LoggerFactory.getLogger(PdfTransformer.class);
    //
    private Channel channel;
    private PdfReader reader;
    private HashMap infoMap;
    private Properties properties;
    private File pageOutputDir;
    private File coverOutputDir;
    private File inputFile;
    private String outputName;
    private String barCodText;
    private double price;
    private double totalPrice;
    private double extraPrice;
    private double extraTotalPrice;
    private double redPrice;
    private double redTotalPrice;
    private double redExtraPrice;
    private double redExtraTotalPrice;
    private boolean isCoveredExtracted;
    private int page = 1;
    private boolean status = false;

    /**
     * Creates a new instance of PdfDecryptor
     */
    public PdfTransformer(Channel channel) {
        this.channel = channel;
    }

    public boolean transform(String input, String cnfDir, String errorDir) {
        FileInputStream cnfFis = null;
        BufferedInputStream cnfBis = null;
        inputFile = new File(input);

        try {
            // Creates PdfReader
            logger.info("{} reading pdf info", inputFile.getPath());
            reader = new PdfReader(new RandomAccessFileOrArray(inputFile.getPath(), false, true), null);
            // reader = new PdfReader(input);
            infoMap = reader.getInfo();

            // Looking for config file
            String pdfCnf = infoMap.get("eDoc.Code") + ".txt";
            File cnfFile = new File(cnfDir + File.separator + pdfCnf);
            if (!cnfFile.exists()) {
                logger.info("{} does not exist. Using ''default.txt''", cnfFile.getPath());
                cnfFile = new File(cnfDir + File.separator + "default.txt");
            }

            // Loads config file to properties
            logger.info("Using {} for transformation.", cnfFile.getPath());
            cnfFis = new FileInputStream(cnfFile);
            cnfBis = new BufferedInputStream(cnfFis);
            properties = new Properties();
            properties.load(cnfBis);
            cnfBis.close();
            cnfFis.close();

            // Creates output dir
            String dstdir = properties.getProperty("Dst_Dir");
            pageOutputDir = new File(dstdir);
            if (!pageOutputDir.exists()) {
                pageOutputDir.mkdirs();
            }

            // Creates output cover dir
            dstdir = properties.getProperty("Cover_Dir");
            if (dstdir == null) {
                coverOutputDir = pageOutputDir;
            }
            else {
                coverOutputDir = new File(dstdir);
                if (!coverOutputDir.exists()) {
                    coverOutputDir.mkdirs();
                }
            }

            // Renaming the output file
            outputName = inputFile.getName();
            String regex = properties.getProperty("Dst_Regex");
            String filename = properties.getProperty("Dst_File");
            if (regex != null && filename != null) {
                outputName = rename(regex, inputFile.getName(), filename);
            }

            // Init infoMap
            infoMap.put("PageCount", String.valueOf(reader.getNumberOfPages()));
            infoMap.put("eDoc.BarCode", getBarCodeText());
            infoMap.put("Subject", getBarCodeText());
            int inside = reader.getNumberOfPages();
            if ("true".equalsIgnoreCase((String) infoMap.get("eDoc.Cover"))) {
                inside = inside - 2;
            }
            infoMap.put("InsideCount", String.valueOf(inside));

            setPrices();

            // Extracts cover if necessary
            String extractCover = properties.getProperty("Extract_Cover");
            if ("true".equalsIgnoreCase(extractCover)) {
                isCoveredExtracted = true;
            }
            else if ("auto".equalsIgnoreCase(extractCover)) {
                isCoveredExtracted = "true".equalsIgnoreCase((String) infoMap.get("eDoc.Cover"));
            }
            else {
                isCoveredExtracted = false;
            }

            if (isCoveredExtracted) {
                extractCover();
            }

            // Extracts Body
            extractBody();

            if ("true".equalsIgnoreCase(properties.getProperty("Save_Txt", "true"))) {
                saveTxtDescription();
            }

            status = true;
            logger.info("{} successfully transformed", input);
        }
        catch (IOException ioex) {
            logger.warn(input + " - transform error : " + ioex.getMessage(), ioex);
        }
        catch (Exception ex) {
            logger.warn(input + " - transform error : " + ex.getMessage(), ex);
        }
        finally {
            IOUtils.closeQuietly(cnfBis);
            IOUtils.closeQuietly(cnfFis);
            PdfUtils.closeQuietly(reader);
        }

        if (!status) {
            copyToError(inputFile, errorDir);
        }

        return status;
    }

    private void copyToError(File inputFile, String errorDir) {
        try {
            File outputFile = new File(errorDir, inputFile.getName());
            if (outputFile.exists()) {
                FileUtils.forceDelete(outputFile);
            }
            FileUtils.moveFile(inputFile, outputFile);
        }
        catch (IOException ex) {
            logger.warn(inputFile.getPath() + " - copy error : ", ex);
        }
    }

    private void saveTxtDescription() throws IOException {
        String textDir = (String) properties.get("Text_Dir");
        if (textDir == null) {
            textDir = pageOutputDir.getPath();
        }

        BufferedWriter out = null;
        try {
            File file = Utils.getExtFile(new File(textDir, outputName), "txt");
            if (!file.getParentFile().exists()) {
                FileUtils.forceMkdir(file.getParentFile());
            }

            out = new BufferedWriter(new FileWriter(file));
            Iterator it = infoMap.entrySet().iterator();
            while (it.hasNext()) {
                Map.Entry entry = (Map.Entry) it.next();
                if (entry != null && entry.getKey() != null && entry.getValue() != null) {
                    out.write(entry.getKey().toString() + "=" + entry.getValue().toString());
                    out.newLine();
                }
            }
        }
        finally {
            if (out != null) {
                out.close();
            }
        }
    }

    private void extractCover() throws IOException, DocumentException {
        double sx = NumUtils.doubleValue(properties.getProperty("Cover_Scale_X", "1d"));
        double sy = NumUtils.doubleValue(properties.getProperty("Cover_Scale_Y", "1d"));
        double angle = Math.toRadians(NumUtils.doubleValue(properties.getProperty("Cover_Angle", "0")));
        doExtractCover(sx, sy, angle);
        // extractPages(true, sx, sy, angle) ;
    }

    private void doExtractCover(double sx, double sy, double angle) throws IOException, DocumentException {

        Document doc = new Document();
        doc.setPageSize(reader.getPageSizeWithRotation(page));

        File ofile = new File(coverOutputDir, Utils.getPrefix(outputName) + "_cover.pdf");

        PdfWriter writer = PdfWriter.getInstance(doc, new FileOutputStream(ofile));

        // Copy Metadata
        infoMap.put("eDoc.PDFCoverName", ofile.getName());
        addHeaders(doc);

        // Page Size
        AffineTransform af = AffineTransform.getScaleInstance(sx, sy);
        af.rotate(angle);

        Rectangle pageSize = reader.getPageSizeWithRotation(page);
        float px = NumUtils.floatValue(properties.getProperty("Cover_Page_Width", String.valueOf(pageSize.getWidth())));
        float py = NumUtils.floatValue(properties.getProperty("Cover_Page_Height", String.valueOf(pageSize.getHeight())));
        Rectangle2D.Float rectangle = new Rectangle2D.Float(0, 0, px, py);
        Rectangle2D bounds = af.createTransformedShape(rectangle).getBounds2D();
        Rectangle rec = new Rectangle((float) bounds.getWidth(), (float) bounds.getHeight());
        doc.setPageSize(rec);

        doc.open();
        doc.newPage();

//      AffineTransform af1 = AffineTransform.getTranslateInstance(-bounds.getX(), -bounds.getY()) ;
//      af1.scale(sx, sy) ;
//      af1.rotate(angle) ;

        PdfContentByte cb = writer.getDirectContent();
        PdfTemplate template = writer.getImportedPage(reader, page);

        AffineTransform af1 = AffineTransform.getTranslateInstance(-bounds.getX(), -bounds.getY());
        af1.scale(sx, sy);
        af1.rotate(angle);

        af1.translate((px - template.getWidth()) / 2f, (py - template.getHeight()) / 2f);

        //af1.translate((rec.width()-template.getWidth()*sx)/(2f*sx), (rec.height()-template.getHeight()*sy)/(2f*sy)) ;

        double[] mx = new double[6];
        af1.getMatrix(mx);

        cb.addTemplate(template, (float) mx[0], (float) mx[1], (float) mx[2], (float) mx[3], (float) mx[4], (float) mx[5]);

        PdfTemplate utp = cb.createTemplate(rec.getWidth(), rec.getHeight());
        showTextCover(utp);
        showBarcodeCover(utp);
        showLogoCover(utp);
        cb.addTemplate(utp, 0, 0);

        doc.close();
        page++;
    }

    private void addHeaders(Document doc) {
        Iterator it = infoMap.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry entry = (Map.Entry) it.next();
            if (entry != null && entry.getKey() != null && entry.getValue() != null) {
                doc.addHeader(entry.getKey().toString(), entry.getValue().toString());
            }
        }
    }

    private void extractBody() throws IOException, DocumentException {
        double sx = NumUtils.doubleValue(properties.getProperty("Body_Scale_X", "1d"));
        double sy = NumUtils.doubleValue(properties.getProperty("Body_Scale_Y", "1d"));
        double angle = Math.toRadians(NumUtils.doubleValue(properties.getProperty("Body_Angle", "0")));
        extractPages(false, sx, sy, angle);
    }

    private void extractPages(boolean cover, double sx, double sy, double angle) throws IOException, DocumentException {

        Document doc = new Document();
        doc.setPageSize(reader.getPageSizeWithRotation(page));


        File ofile = Utils.getExtFile(new File(pageOutputDir, outputName), "pdf");
        if (cover) {
            ofile = new File(pageOutputDir, Utils.getPrefix(outputName) + "_cover.pdf");
        }

        PdfWriter writer = PdfWriter.getInstance(doc, new FileOutputStream(ofile));

        // Copy Metadata
        if (cover) {
            infoMap.put("eDoc.PDFCoverName", ofile.getName());
        }
        else {
            infoMap.put("eDoc.PDFName", ofile.getName());
        }

        Iterator it = infoMap.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry entry = (Map.Entry) it.next();
            if (entry != null && entry.getKey() != null && entry.getValue() != null) {
                doc.addHeader(entry.getKey().toString(), entry.getValue().toString());
            }
        }

        // Page Size
        AffineTransform af = AffineTransform.getScaleInstance(sx, sy);
        af.rotate(angle);

        Rectangle rec = reader.getPageSizeWithRotation(page);
        Rectangle2D.Float rectangle = new Rectangle2D.Float(0, 0, rec.getWidth(), rec.getHeight());
        Rectangle2D bounds = af.createTransformedShape(rectangle).getBounds2D();
        rec = new Rectangle((float) bounds.getWidth(), (float) bounds.getHeight());
        doc.setPageSize(rec);

        if (isCoveredExtracted) {
            page++;
        }
        if (NumUtils.intValue(properties.getProperty("Add_Index", "0")) > 0) {
            addIndexPage(writer, doc, sx, sy, angle);
        }
        else {
            doc.open();
        }

        PdfContentByte cb = writer.getDirectContent();
        int lastPage = reader.getNumberOfPages();

        while (page <= lastPage) {
            rec = reader.getPageSizeWithRotation(page);
            rectangle = new Rectangle2D.Float(0, 0, rec.getWidth(), rec.getHeight());
            bounds = af.createTransformedShape(rectangle).getBounds2D();
            rec = new Rectangle((float) bounds.getWidth(), (float) bounds.getHeight());
            doc.setPageSize(rec);

            doc.newPage();

            AffineTransform af1 = AffineTransform.getTranslateInstance(-bounds.getX(), -bounds.getY());
            af1.scale(sx, sy);
            af1.rotate(angle);

            double[] mx = new double[6];
            af1.getMatrix(mx);
            cb.addTemplate(writer.getImportedPage(reader, page), (float) mx[0], (float) mx[1], (float) mx[2], (float) mx[3], (float) mx[4], (float) mx[5]);

            page++;
        }

        if (NumUtils.intValue(properties.getProperty("Add_Page", "0")) > 0) {
            addTrailerPage(writer, doc, sx, sy, angle);
        }

        doc.close();
    }

    private void addIndexPage(PdfWriter writer, Document doc, double sx, double sy, double angle) throws IOException, DocumentException {

        AffineTransform af = AffineTransform.getScaleInstance(sx, sy);
        af.rotate(angle);

        Rectangle pageSize = reader.getPageSizeWithRotation(page);
        float px = NumUtils.floatValue(properties.getProperty("Index_Page_X", String.valueOf(pageSize.getWidth())));
        float py = NumUtils.floatValue(properties.getProperty("Index_Page_Y", String.valueOf(pageSize.getHeight())));

        Rectangle2D.Float rectangle = new Rectangle2D.Float(0, 0, px, py);
        Rectangle2D bounds = af.createTransformedShape(rectangle).getBounds2D();
        Rectangle rec = new Rectangle((float) bounds.getWidth(), (float) bounds.getHeight());
        doc.setPageSize(rec);
        doc.open();
        doc.newPage();

        PdfContentByte ucb = writer.getDirectContentUnder();
        PdfTemplate utp = ucb.createTemplate(px, py);
        showLogoIndex(utp);
        showThumbnailsIndex(utp);

        PdfContentByte cb = writer.getDirectContent();
        PdfTemplate tp = cb.createTemplate(px, py);
        showBarcodeIndex(tp);
        showTextIndex(tp);
        showTextIndex2(tp);

        AffineTransform af1 = AffineTransform.getTranslateInstance(-bounds.getX(), -bounds.getY());
        af1.scale(sx, sy);
        af1.rotate(angle);
        double[] mx = new double[6];
        af1.getMatrix(mx);
        ucb.addTemplate(utp, (float) mx[0], (float) mx[1], (float) mx[2], (float) mx[3], (float) mx[4], (float) mx[5]);
        cb.addTemplate(tp, (float) mx[0], (float) mx[1], (float) mx[2], (float) mx[3], (float) mx[4], (float) mx[5]);

        // Add page
        int num = NumUtils.intValue(properties.getProperty("Add_Index", "0"));
        for (int i = 1; i < num; i++) {
            doc.newPage();
            doc.add(Chunk.NEWLINE);
        }
    }

    private void addTrailerPage(PdfWriter writer, Document doc, double sx, double sy, double angle) throws IOException, DocumentException {

        int num = NumUtils.intValue(properties.getProperty("Add_Page", "2"));

        int logoFolio = NumUtils.intValue(properties.getProperty("InfoPage_Folio", "0"));
        if (logoFolio == 0) {
            logoFolio = num;
        }

        int barcodFolio = NumUtils.intValue(properties.getProperty("BarCod_Folio", "0"));
        if (barcodFolio == 0) {
            barcodFolio = num;
        }

        for (int i = 1; i <= num; i++) {
            doc.newPage();
            doc.add(Chunk.NEWLINE);
            if (logoFolio == i || barcodFolio == i) {
                addTrailerObjects(writer, sx, sy, angle, logoFolio == i, barcodFolio == i);
            }
        }
    }

    private void addTrailerObjects(PdfWriter writer, double sx, double sy, double angle, boolean isLogo, boolean isBarcod) throws IOException, DocumentException {
        Rectangle pageSize = reader.getPageSizeWithRotation(page - 1);
        PdfContentByte cb = writer.getDirectContent();
        PdfTemplate tp = cb.createTemplate(pageSize.getWidth(), pageSize.getHeight());

        if (isBarcod) {
            showBarcodeTrailer(tp);
        }
        if (isLogo) {
            showLogoTrailer(tp);
        }

        AffineTransform af = AffineTransform.getScaleInstance(sx, sy);
        af.rotate(angle);
        Rectangle2D.Float rectangle = new Rectangle2D.Float(0, 0, pageSize.getWidth(), pageSize.getHeight());
        Rectangle2D bounds = af.createTransformedShape(rectangle).getBounds2D();

        AffineTransform af1 = AffineTransform.getTranslateInstance(-bounds.getX(), -bounds.getY());
        af1.scale(sx, sy);
        af1.rotate(angle);
        double[] mx = new double[6];
        af1.getMatrix(mx);
        cb.addTemplate(tp, (float) mx[0], (float) mx[1], (float) mx[2], (float) mx[3], (float) mx[4], (float) mx[5]);
    }

    private void showThumbnailsIndex(PdfTemplate cb) {

        AffineTransform af = new AffineTransform();
        double iy = NumUtils.doubleValue(properties.getProperty("Index_Y", "20d"));
        af.translate(0, iy);

        double is = NumUtils.doubleValue(properties.getProperty("Index_Scale", ".3d"));
        af.scale(is, is);

        if (isCoveredExtracted || "true".equalsIgnoreCase((String) infoMap.get("eDoc.Cover"))) {
            PdfImportedPage ip = cb.getPdfWriter().getImportedPage(reader, 3);
            centerTemplate(cb, ip, (AffineTransform) af.clone());
            af.translate(0, ip.getHeight() + 30f);
            centerTemplate(cb, cb.getPdfWriter().getImportedPage(reader, 1), af);
        }
        else {
            centerTemplate(cb, cb.getPdfWriter().getImportedPage(reader, 1), af);
        }
    }

    private void centerTemplate(PdfTemplate cb, PdfImportedPage ip1, AffineTransform af) {
        PdfTemplate tp1 = cb.createTemplate(ip1.getWidth(), ip1.getHeight());
        tp1.setLineWidth(2f);
        tp1.rectangle(1, 1, tp1.getWidth() - 2, tp1.getHeight() - 2);
        tp1.stroke();

        double is = NumUtils.doubleValue(properties.getProperty("Index_Scale", ".3d"));
        af.translate(((cb.getWidth() - tp1.getWidth() * is) / 2f) / is, 0);

        double[] mx1 = new double[6];
        af.getMatrix(mx1);
        cb.addTemplate(ip1, (float) mx1[0], (float) mx1[1], (float) mx1[2], (float) mx1[3], (float) mx1[4], (float) mx1[5]);
        cb.addTemplate(tp1, (float) mx1[0], (float) mx1[1], (float) mx1[2], (float) mx1[3], (float) mx1[4], (float) mx1[5]);

    }

    private void showLogoCover(PdfTemplate cb) throws IOException {
        double x = NumUtils.doubleValue(properties.getProperty("Cover_Logo_X", "0"));
        double y = NumUtils.doubleValue(properties.getProperty("Cover_Logo_Y", "0"));
        double r = Math.toRadians(NumUtils.doubleValue(properties.getProperty("Cover_Logo_Angle", "0")));
        showLogo(cb, properties.getProperty("Cover_Page_Path"), x, y, r);
    }

    private void showLogoIndex(PdfTemplate cb) throws IOException {
        double x = NumUtils.doubleValue(properties.getProperty("Index_Logo_X", "0"));
        double y = NumUtils.doubleValue(properties.getProperty("Index_Logo_Y", "0"));
        double r = Math.toRadians(NumUtils.doubleValue(properties.getProperty("Index_Logo_Angle", "0")));
        showLogo(cb, properties.getProperty("Index_Page_Path"), x, y, r);
    }

    private void showLogoTrailer(PdfTemplate cb) throws IOException {
        double x = NumUtils.doubleValue(properties.getProperty("Info_Logo_X", "0"));
        double y = NumUtils.doubleValue(properties.getProperty("Info_Logo_Y", "0"));
        double r = Math.toRadians(NumUtils.doubleValue(properties.getProperty("Info_Logo_Angle", "0")));
        showLogo(cb, properties.getProperty("InfoPage_Path"), x, y, r);
    }

    private void showLogo(PdfTemplate cb, String pdfLogo, double sx, double sy, double r) throws IOException {
        if (pdfLogo != null) {
            File file = new File(pdfLogo);
            if (file.exists()) {
                PdfReader rd = new PdfReader(pdfLogo);

                AffineTransform af1 = new AffineTransform();
                af1.translate(sx, sy);
                af1.rotate(r);

                double[] mx = new double[6];
                af1.getMatrix(mx);
                cb.addTemplate(cb.getPdfWriter().getImportedPage(rd, 1), (float) mx[0], (float) mx[1], (float) mx[2], (float) mx[3], (float) mx[4], (float) mx[5]);

                // cb.addTemplate(cb.getPdfWriter().getImportedPage(reader, 1), sx, sy);
            }
        }
    }

    private void showBarcodeCover(PdfTemplate cb) throws IOException, DocumentException {
        if ("true".equalsIgnoreCase(properties.getProperty("Cover_Add_BarCod", "false"))) {
            double bx = NumUtils.doubleValue(properties.getProperty("Cover_BarCod_X", "10d"));
            double by = NumUtils.doubleValue(properties.getProperty("Cover_BarCod_Y", "10d"));
            double br = Math.toRadians(NumUtils.doubleValue(properties.getProperty("Cover_BarCod_Angle", "0")));
            showBarcode(cb, bx, by, br);
        }
    }

    private String getExpandedText(String line) {
        StringBuilder newLine = new StringBuilder();
        StringBuilder value = null;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (value == null) {
                if (c == '{') {
                    value = new StringBuilder();
                }
                else {
                    newLine.append(c);
                }
            }
            else {
                if (c == '}') {
                    newLine.append(getPdfMetaData(value.toString()));
                    value = null;
                }
                else {
                    value.append(c);
                }
            }
        }

        return newLine.toString();
    }

    private void showTextCover(PdfTemplate cb) throws IOException, DocumentException {

        float height = cb.getHeight();
        int fontSize = NumUtils.intValue(properties.getProperty("Cover_Text_Size", "10"));
        float xMargin = NumUtils.floatValue(properties.getProperty("Cover_Text_X", String.valueOf(fontSize)));
        float yMargin = NumUtils.floatValue(properties.getProperty("Cover_Text_Y", String.valueOf(height - fontSize)));


        int pdfAlign = PdfContentByte.ALIGN_LEFT;
        String align = properties.getProperty("Cover_Text_Align", "left");

        if ("center".equalsIgnoreCase(align)) {
            pdfAlign = PdfContentByte.ALIGN_CENTER;
        }
        else if ("right".equalsIgnoreCase(align)) {
            pdfAlign = PdfContentByte.ALIGN_RIGHT;
        }

        BaseFont bf = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        cb.setFontAndSize(bf, fontSize);

        int count = 1;
        String line;
        while ((line = properties.getProperty("Cover_Text_" + count)) != null) {

            String newLine = getExpandedText(line);

            cb.saveState();
            cb.setColorFill(Color.WHITE);
            float x = xMargin;
            float h = fontSize + 1;
            float y = yMargin - count * h - h * .2f;
            float w = bf.getWidthPoint(newLine, fontSize);

            if (pdfAlign == PdfContentByte.ALIGN_CENTER) {
                x = x - w / 2f;
            }
            else if (pdfAlign == PdfContentByte.ALIGN_RIGHT) {
                x = x - w;
            }

            cb.rectangle(x, y, w, h);
            cb.fill();
            cb.restoreState();

            cb.beginText();
            cb.showTextAligned(pdfAlign, newLine, xMargin, yMargin - count * (fontSize + 1), 0);
            cb.endText();

            count++;
        }

    }

    private void showBarcodeIndex(PdfTemplate cb) throws IOException, DocumentException {
        if ("true".equalsIgnoreCase(properties.getProperty("Index_Add_BarCod", "true"))) {
            double bx = NumUtils.doubleValue(properties.getProperty("Index_BarCod_X", "10d"));
            double by = NumUtils.doubleValue(properties.getProperty("Index_BarCod_Y", "10d"));
            double br = Math.toRadians(NumUtils.doubleValue(properties.getProperty("Index_BarCod_Angle", "0")));
            showBarcode(cb, bx, by, br);
        }
    }

    private void showBarcodeTrailer(PdfTemplate cb) throws IOException, DocumentException {
        if ("true".equalsIgnoreCase(properties.getProperty("Add_BarCod", "false"))) {
            double bx = NumUtils.doubleValue(properties.getProperty("BarCod_X", "10d"));
            double by = NumUtils.doubleValue(properties.getProperty("BarCod_Y", "10d"));
            double br = Math.toRadians(NumUtils.doubleValue(properties.getProperty("BarCod_Angle", "0")));
            showBarcode(cb, bx, by, br);
        }
    }

    private void showBarcode(PdfTemplate cb, double bx, double by, double br) throws IOException, DocumentException {
        Barcode128 cod = new Barcode128();  // 39 7cm 128 4cm
        cod.setCode(getBarCodeText());
        PdfTemplate cbTemplate = cod.createTemplateWithBarcode(cb, Color.BLACK, Color.BLACK);

        PdfTemplate bgTemplate = cbTemplate.createTemplate(cbTemplate.getWidth() + 10, cbTemplate.getHeight() + 10);
        bgTemplate.setColorFill(Color.WHITE);
        bgTemplate.rectangle(0, 0, bgTemplate.getWidth(), bgTemplate.getHeight());
        bgTemplate.fill();

        bgTemplate.addTemplate(cbTemplate, 5, 5);
        AffineTransform af1 = new AffineTransform();
        af1.translate(bx, by);
        af1.rotate(br);

        double[] mx = new double[6];
        af1.getMatrix(mx);
        cb.addTemplate(bgTemplate, (float) mx[0], (float) mx[1], (float) mx[2], (float) mx[3], (float) mx[4], (float) mx[5]);
    }

    private void showTextIndex(PdfTemplate cb) throws IOException, DocumentException {

        float height = cb.getHeight();
        float fontSize = NumUtils.floatValue(properties.getProperty("Index_Text_Size", "10"));
        float xMargin = NumUtils.floatValue(properties.getProperty("Index_Text_X", String.valueOf(fontSize)));
        float yMargin = NumUtils.floatValue(properties.getProperty("Index_Text_Y", String.valueOf(height - fontSize)));

        int pdfAlign = PdfContentByte.ALIGN_LEFT;
        String align = properties.getProperty("Index_Text_Align", "left");
        if ("center".equalsIgnoreCase(align)) {
            pdfAlign = PdfContentByte.ALIGN_CENTER;
        }
        else if ("right".equalsIgnoreCase(align)) {
            pdfAlign = PdfContentByte.ALIGN_RIGHT;
        }

        BaseFont bf = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        //cb.setFontAndSize(bf, fontSize);

        int count = 1;

        String line;
        while ((line = properties.getProperty("Index_Text_" + count)) != null) {
            cb.beginText();
            float fs = NumUtils.floatValue(properties.getProperty("Index_Text_Size_" + count, String.valueOf(fontSize)), fontSize);
            cb.setFontAndSize(bf, fs);
            String newLine = getExpandedText(line);
            yMargin = yMargin - fs - 1f;
            cb.showTextAligned(pdfAlign, newLine, xMargin, yMargin, 0);
            count++;
            cb.endText();
        }

    }

    private void showTextIndex2(PdfTemplate cb) throws IOException, DocumentException {

        float height = cb.getHeight();
        int fontSize = NumUtils.intValue(properties.getProperty("Index_Text2_Size", "10"));
        float xMargin = NumUtils.floatValue(properties.getProperty("Index_Text2_X", String.valueOf(cb.getWidth() - fontSize)));
        float yMargin = NumUtils.floatValue(properties.getProperty("Index_Text2_Y", String.valueOf(height - fontSize)));

        int pdfAlign = PdfContentByte.ALIGN_RIGHT;
        String align = properties.getProperty("Index_Text2_Align", "right");
        if ("center".equalsIgnoreCase(align)) {
            pdfAlign = PdfContentByte.ALIGN_CENTER;
        }
        else if ("".equalsIgnoreCase(align)) {
            pdfAlign = PdfContentByte.ALIGN_LEFT;
        }

        cb.beginText();
        BaseFont bf = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        cb.setFontAndSize(bf, fontSize);

        int count = 1;
        String line;
        while ((line = properties.getProperty("Index_Text2_" + count)) != null) {
            String newLine = getExpandedText(line);
            cb.showTextAligned(pdfAlign, newLine, xMargin, yMargin - count * (fontSize + 1), 0);
            count++;
        }

        cb.endText();
    }

    private String getPdfMetaData(String key) {
        Object value = infoMap.get(key);
        return (value == null) ? "###" : (String) value;
    }

    private String getBarCodeText() {
        if (barCodText == null) {

            barCodText = (String) infoMap.get("eDoc.BarCode");

            if (barCodText == null) {
                String prefix = properties.getProperty("BarCod_Prefix");
                if (prefix == null) {
                    prefix = String.valueOf(System.currentTimeMillis());
                    prefix = prefix.substring(Math.max(0, prefix.length() - 6));
                }

                String num = (String) infoMap.get("Decrypt.Barcode");
                num = (num == null) ? "0" : num;
                String padding = "0000000";
                num = padding.substring(Math.min(num.length(), padding.length())) + num;

                barCodText = (prefix + num).toUpperCase();
            }
        }
        return barCodText;
    }

    private void setPrices() {
        double baseValue = NumUtils.doubleValue(properties.getProperty("Price_Base_Value", "0d"));
        double extraValue = NumUtils.doubleValue(properties.getProperty("Price_Extra_Value", "0d"));
        double reduceValue = NumUtils.doubleValue(properties.getProperty("Price_Reduced_Value", "0d"));

        int basePage = NumUtils.intValue(properties.getProperty("Price_Base_Page", "0"));
        int pageCount = NumUtils.intValue(getPdfMetaData("PageCount"));
        int copies = NumUtils.intValue(getPdfMetaData("eDoc.Copies"));

        extraPrice = Math.max(0, pageCount - basePage) * extraValue;
        redExtraPrice = extraPrice + extraPrice * reduceValue / 100d;

        price = baseValue + extraPrice;
        redPrice = price + price * reduceValue / 100d;

        totalPrice = price * copies;
        redTotalPrice = totalPrice + totalPrice * reduceValue / 100d;

        extraTotalPrice = extraPrice * copies;
        redExtraTotalPrice = extraTotalPrice + extraTotalPrice * reduceValue / 100d;

        if (price > 0) {
            infoMap.put("eDoc.BasePrice", String.format("%1$.2f", new Double(baseValue)));
            infoMap.put("eDoc.ReducedBasePrice", String.format("%1$.2f", new Double(baseValue + baseValue * reduceValue / 100d)));

            infoMap.put("eDoc.ExtraPrice", String.format("%1$.2f", new Double(extraPrice)));
            infoMap.put("eDoc.ReducedExtraPrice", String.format("%1$.2f", new Double(redExtraPrice)));

            infoMap.put("eDoc.Price", String.format("%1$.2f", new Double(price)));
            infoMap.put("eDoc.ReducedPrice", String.format("%1$.2f", new Double(redPrice)));

            infoMap.put("eDoc.TotalPrice", String.format("%1$.2f", new Double(totalPrice)));
            infoMap.put("eDoc.ReducedTotalPrice", String.format("%1$.2f", new Double(redTotalPrice)));

            infoMap.put("eDoc.ExtraTotalPrice", String.format("%1$.2f", new Double(extraTotalPrice)));
            infoMap.put("eDoc.ReducedExtraTotalPrice", String.format("%1$.2f", new Double(redExtraTotalPrice)));
        }

    }

    public String rename(String pat, String src, String out) {

        try {
            out = out.replaceAll("\\{BARCODE\\}", getBarCodeText());

            Pattern pattern = Pattern.compile(pat);

            Matcher m = pattern.matcher(src);

            if (m.matches()) {
                int state = 0;
                StringBuilder trg = new StringBuilder();
                StringBuilder value = null;

                for (int i = 0; i < out.length(); i++) {
                    char c = out.charAt(i);

                    if (state == 0) {
                        if (c == '{') {
                            value = new StringBuilder(2);
                            state = 1;
                        }
                        else {
                            trg.append(c);
                        }
                    }
                    else {
                        if (c == '}') {
                            int j = Integer.parseInt(value.toString());
                            trg.append(m.group(j));
                            state = 0;
                        }
                        else {
                            value.append(c);
                        }
                    }
                }
                return trg.toString();
            }
            else {
                logger.warn("{} - {}", channel.getStringProp(Channel.ID), Message.get("channel.domove.message5"));
                return src;
            }
        }
        catch (Exception e) {
            logger.warn("{} - {} : {}", new Object[]{channel.getStringProp(Channel.ID), Message.get("channel.domove.message7"), pat});
            return src;
        }
    }
}
