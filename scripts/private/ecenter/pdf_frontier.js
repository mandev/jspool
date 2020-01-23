/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io);
importPackage(Packages.java.util);
importPackage(Packages.org.apache.commons.csv);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.lang);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.pdftool.filters);
importPackage(Packages.com.adlitteram.pdftool.utils);

//ERROR_DIR = _getValue("ERROR_DIR");
INPUT_DIR = "D:/tmp/ed5/tirages/";
ERROR_DIR = "D:/tmp/ed5/tirages/ordres_erreur";
DONE_DIR = "D:/tmp/ed5/tirages/ordres_traites";
GS_EXE = "C:/Program Files/gs/gs9.16/bin/gswin64c.exe";
LOG_FILE = new File(ERROR_DIR, "photo_frontier.log");
CHARSET = "ISO-8859-1";

var P2MM = 25.4 / 72;
var frontier = null;
var product = null;

var frontiers = {
    "PRESSE-K": {device: "1SP-2500sRGB", path: "D:/frontiers/frontend/"},
    "PRESSE-L": {device: "2SP-2500sRGB", path: "D:/frontiers/frontend02/"},
    "PRESSE-M": {device: "3SP-2500sRGB", path: "D:/frontiers/frontend03/"},
    "PRESSE-N": {device: "4SP-2500sRGB", path: "D:/frontiers/frontend04/"},
    "PRESSE-O": {device: "5SP-2500sRGB", path: "D:/frontiers/frontend05/"},
    "PRESSE-P": {device: "6SP-2500sRGB", path: "D:/frontiers/frontend06/"},
    "PRESSE-Q": {device: "7SP-2500sRGB", path: "D:/frontiers/frontend07/"},
    "PRESSE-R": {device: "sRGBFMPC", path: "D:/frontiers/front570/"},
    "PRESSE-S": {device: "9SP-2500sRGB", path: "D:/frontiers/frontend09/"},
    "PRESSE-T": {device: "10SP-2500sRGB", path: "D:/frontiers/frontend10/"},
    "PRESSE-U": {device: "11SP-2500sRGB", path: "D:/frontiers/frontend11/"},
    "PRESSE-V": {device: "FrontiersRGB", path: "D:/frontiers/fe-frontend/"}
};

function getProdDir() {
    return new File(frontiers[frontier].path + "/C8Spool/", product);
}

function getTempDir() {
    return new File(frontiers[frontier].path + "/temp/", product);
}

function processException(e) {
    var logmsg = "ERROR: " + e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "] - CsvFile: " + _srcFile.getFile().getName();
    if (frontier != null && product != null) {
        logmsg += " - Frontier: " + frontier + " - Product: " + product;
        FileUtils.deleteQuietly(getTempDir());
    }
    _print(logmsg);
    FileUtils.writeStringToFile(LOG_FILE, new Date() + " - " + logmsg + "\n", CHARSET, true);
}

function sendToProduction() {
    FileUtils.deleteQuietly(getProdDir());
    FileUtils.moveDirectory(getTempDir(), getProdDir());
    FileUtils.touch(new File(getProdDir(), "end.txt"));
}

function rasterPdf() {
    var files = FileUtils.listFiles(getTempDir(), ["pdf"], true).toArray();
    for (var i = 0; i < files.length; i++) {
        var srcFile = files[i];
        var basename = FilenameUtils.getBaseName(srcFile);
        var dstFile = new File(getTempDir(), basename + ".jpg");

        var opt = ["-q", "-dNOPROMPT", "-dBATCH", "-dNOPAUSE", "-dUseCIEColor", "-sDEVICE=jpeg", "-dUseCropBox", "-dJPEGQ=95",
            "-dTextAlphaBits=4", "-dGraphicsAlphaBits=4", "-r300", "-o", dstFile.getPath(), srcFile.getPath()];

        if (_exec(GS_EXE, opt, dstFile.getParent(), 60 * 1000) != 0) {
            throw {name: "rasterPdfPanel", message: "Le fichier " + srcFile + " n'a pas pu être rasterisé", fileName: "", lineNumber: ""};
        }
        FileUtils.deleteQuietly(srcFile);
    }
}

function getSizeName(width, height) {
    return Math.round(width * P2MM) + "X" + Math.round(height * P2MM);
}

function writeCondition() {
    var outList = new ArrayList();
    var files = FileUtils.listFiles(getTempDir(), ["pdf"], true).toArray();
    var condFile = new File(getTempDir(), "condition.txt");

    outList.add("[OutDevice]");
    outList.add("DeviceName=" + frontiers[frontier].device);

    outList.add("");
    outList.add("[ImageList]");
    outList.add("ImageCnt=" + files.length );
    for (var i = 0; i < files.length; i++) {
        if (files[i].getName().endsWith(".pdf")) {
            outList.add((i + 1) + "=" + FilenameUtils.getBaseName(files[i].getName()) + ".jpg");
        }
    }

    for (var i = 0; i < files.length; i++) {
        var pdfInfo = PdfExtractor.getPdfInfo(files[i]);
        var size = pdfInfo.getLastPageSize();
        var sizeName = getSizeName(size.getWidth(), size.getHeight());
        outList.add("");
        outList.add("[" + FilenameUtils.getBaseName(files[i].getName()) + ".jpg]");
        outList.add("SizeName=" + sizeName);
        outList.add("PrintCnt=1");
        outList.add("BackPrint=FREE");
        outList.add("BackPrintLine1=*" + product + " " + sizeName);
        outList.add("BackPrintLine2=");
        outList.add("Resize=FILLIN");
        outList.add("DSC_Chk=FALSE");
    }
    FileUtils.writeLines(condFile, CHARSET, outList);
}

function splitPdf() {
    var pdfFile = new File(INPUT_DIR, product + ".pdf");
    if (pdfFile.exists() && pdfFile.isFile() && pdfFile.canRead()) {
        FileUtils.forceMkdir(getTempDir());
        var pdfTool = new PdfTool();
        var splitPageFilter = new SplitPage(getTempDir() + "/{BASE}_{COUNT}.pdf", 1);
        pdfTool.addFilter(splitPageFilter);
        pdfTool.execute(pdfFile);
    }
    else {
        throw {name: "processZip", message: "Le fichier " + pdfFile + " n'existe pas", fileName: "", lineNumber: ""};
    }
}

// Presse-M;M150911082956;_CGIN_Tirages_en152-B;PHO-en152-B;9758090.pdf;1;1;Tirages_CGIN
function parseCSV(csvFile) {
    var reader = new StringReader(FileUtils.readFileToString(csvFile, CHARSET));
    var iterator = CSVFormat.DEFAULT.withDelimiter(';').parse(reader).iterator();
    while (iterator.hasNext()) {
        var record = iterator.next();
        try {
            frontier = record.get(0).toUpperCase();
            product = FilenameUtils.getBaseName(record.get(4));
            _print("frontier: " + frontier + " - product: " + product + " - pdf: " + product + ".pdf");

            splitPdf();
            writeCondition();
            rasterPdf();
            sendToProduction();
        }
        catch (e) {
            processException(e);
        }
        frontier = product = null;
    }
}

// start & exit
try {
    parseCSV(_srcFile.getFile());
    FileUtils.copyFile(_srcFile.getFile(), new File(DONE_DIR, _srcFile.getFile().getName()));
    _exit = _OK;
}
catch (e) {
    processException(e);
    FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, _srcFile.getFile().getName()));
    FileUtils.deleteQuietly(_srcFile.getFile());
    _exit = _FAIL;
}
