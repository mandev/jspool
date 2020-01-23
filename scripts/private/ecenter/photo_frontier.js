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

//ERROR_DIR = _getValue("ERROR_DIR");
INPUT_DIR = "D:/tmp/ed5/tirages/";
ERROR_DIR = "D:/tmp/ed5/tirages/ordres_erreur";
DONE_DIR = "D:/tmp/ed5/tirages/ordres_traites";
GS_EXE = "C:/Program Files/gs/gs9.16/bin/gswin64c.exe";
LOG_FILE = new File(ERROR_DIR, "photo_frontier.log");
CHARSET = "ISO-8859-1";

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

var panelFormats = {
    "13n17": "13X9", "13M17": "13X9", "13X17": "13X9", "13X19": "13X9",
    "13M19": "13X9", "13n19": "13X9", "10X10": "10X10", "10M10": "10X10",
    "10n10": "10X10"
};

function getProdDir() {
    return new File(frontiers[frontier].path + "/C8Spool/", product);
}

function getTempDir() {
    return new File(frontiers[frontier].path + "/temp/", product);
}

function getPanelName() {
    return "00000" + product + "_panel.jpeg";
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

function rasterPdfPanel() {
    var srcFile = new File(INPUT_DIR, product + ".pdf");
    var dstFile = new File(getTempDir(), getPanelName());
    var opt = ["-q", "-dNOPROMPT", "-dBATCH", "-dNOPAUSE", "-dUseCIEColor", "-sDEVICE=jpeg", "-dUseCropBox", "-dJPEGQ=95",
        "-dTextAlphaBits=4", "-dGraphicsAlphaBits=4", "-r300", "-o", dstFile.getPath(), srcFile.getPath()];
    if (_exec(GS_EXE, opt, dstFile.getParent(), 60 * 1000) != 0) {
        throw {name: "rasterPdfPanel", message: "Le fichier " + srcFile + " n'a pas pu être rasterisé", fileName: "", lineNumber: ""};
    }
}

function writeCondition() {
    var condFile = new File(getTempDir(), "condition.txt");
    if (condFile.exists() && condFile.isFile() && condFile.canRead()) {
        var inputList = FileUtils.readLines(condFile, CHARSET);
        var outputList = new ArrayList(inputList.size() + 12);
        var firstFormat = null;
        var panelFormat = "15X9";
        var placeHolder = true;
        var imageList = false;

        for (var i = 0; i < inputList.size(); i++) {
            var line = inputList.get(i);
            if (placeHolder && line.contains("DEVICEPLACEHOLDER")) {
                line = line.replace("DEVICEPLACEHOLDER", frontiers[frontier].device);
                placeHolder = false;
            }
            else if (line.startsWith("[ImageList]")) {
                imageList = true;
            }
            else if (imageList && line.endsWith("=")) {
                line = line.concat(getPanelName());
                imageList = false;
            }
            else if (line.startsWith("SizeName=")) {
                var format = panelFormats[line.split("=")[1]];
                if (format != null && format < panelFormat)
                    panelFormat = format;
                if (firstFormat == null)
                    firstFormat = line.split("=")[1];
            }
            outputList.add(line);
        }

        outputList.add("");
        outputList.add("[" + getPanelName() + "]");
        outputList.add("SizeName=" + panelFormat);
        outputList.add("PrintCnt=1");
        outputList.add("BackPrint=FREE");
        outputList.add("BackPrintLine1=*" + product + " " + firstFormat);
        outputList.add("BackPrintLine2=");
        outputList.add("Resize=FILLIN");
        outputList.add("DSC_Chk=FALSE");
        outputList.add("");

        FileUtils.writeLines(condFile, CHARSET, outputList);
    }
    else {
        throw {name: "writeCondition", message: "Le fichier " + condFile + " n'existe pas", fileName: "", lineNumber: ""};
    }
}

function extractZip() {
    var zipFile = new File(INPUT_DIR, product + ".zip");
    if (zipFile.exists() && zipFile.isFile() && zipFile.canRead()) {
        FileUtils.deleteQuietly(getTempDir());
        ScriptUtils.unzipFileToDir(zipFile, getTempDir());
    }
    else {
        throw {name: "processZip", message: "Le fichier " + zipFile + " n'existe pas", fileName: "", lineNumber: ""};
    }
}

function parseCSV(csvFile) {
    var reader = new StringReader(FileUtils.readFileToString(csvFile, CHARSET));
    var iterator = CSVFormat.DEFAULT.withDelimiter(';').parse(reader).iterator();
    while (iterator.hasNext()) {
        var record = iterator.next();
        try {
            frontier = record.get(0).toUpperCase();
            product = FilenameUtils.getBaseName(record.get(4));
            _print("frontier: " + frontier + " - product: " + product);
            extractZip();
            writeCondition();
            rasterPdfPanel();
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
