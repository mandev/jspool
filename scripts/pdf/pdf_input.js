/* 
 * This input script spool a directory.
 */

importPackage(Packages.java.io);
importPackage(Packages.java.util);
importPackage(Packages.java.lang);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.lang);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.com.AdLitteram.jSpool.Files);
importPackage(Packages.com.AdLitteram.jSpool.Sources);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.pdftool.filters);
importPackage(Packages.com.adlitteram.pdftool.utils);

SRC_DIR = "D:/in";
DST_DIR = "D:/out";

function processDate(str) {
    return "20" + str.substr(4, 2) + str.substr(2, 2) + str.substr(0, 2);
}

// Is after src date
function isAfterDate(str) {
    var da = new Date();
    da.setFullYear(str.substr(0, 4), str.substr(4, 2) - 1, str.substr(6, 2));
    da.setHours(1, 59, 0, 0);
    var today = new Date();
    return (today > da);
}

function pad(str) {
    return StringUtils.leftPad(str, 2, "0");
}

// Used to sort the Staging File Array
function sortFiles(file1, file2) {
    return strcmp(file1.getName() - file2.getName());
}

function strcmp(str1, str2) {
    return ((str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1));
}

// Sortie zip : PQLP_20121022.zip
function buildConcatZip(code) {
    var pdfTool = new PdfTool();
    var fileArray = new File(SRC_DIR).listFiles();

    for (var i = 0; i < fileArray.length; i++) {
        var srcFile = fileArray[i];
        var srcName = srcFile.getName() + "";
        var dateName = srcName.split("_")[1];
        if (srcFile.isDirectory() && isAfterDate(dateName)) {
            var files = new File(srcFile).listFiles();
            files.sort();
            var concatFilter = new Concat(new File(srcFile, srcName + ".pdf"));
            concatFilter.setDeleteSource(true);
            pdfTool.addFilter(concatFilter);
            pdfTool.execute(files);

            var d = new Date();
            var dd = d.getFullYear() + "" + pad(d.getMonth() + 1) + "" + pad(d.getDate()) + "" + pad(d.getHours()) + "" + pad(d.getMinutes()) + "" + pad(d.getSeconds());
            var zipFile = new File(SRC_DIR + "/" + code + "_" + dd + ".zip");
            ScriptUtils.zipDirToFile(srcFile, zipFile);

            var dstFile = new File(DST_DIR, zipFile.getName());
            _print("copie " + srcFile + " vers " + dstFile);
            FileUtils.copyFile(zipFile, dstFile);
            FileUtils.forceDelete(zipFile);
            FileUtils.forceDelete(srcFile);
        }
    }
}

// Sortie zip : HOPT_20121022.zip
function buildSeparateZip(code) {
    var listDir = new File(SRC_DIR).listFiles();
    for (var i = 0; i < listDir.length; i++) {
        var srcFile = listDir[i];
        var srcName = srcFile.getName() + "";
        var dateName = srcName.split("_")[1];
        if (srcFile.isDirectory() && isAfterDate(dateName)) {
            var d = new Date();
            var dd = d.getFullYear() + "" + pad(d.getMonth() + 1) + "" + pad(d.getDate()) + "" + pad(d.getHours()) + "" + pad(d.getMinutes()) + "" + pad(d.getSeconds());
            var zipFile = new File(SRC_DIR + "/" + code + "_" + dd + ".zip");
            ScriptUtils.zipDirToFile(srcFile, zipFile);
            var dstFile = new File(DST_DIR, zipFile.getName());
            _print("copie " + srcFile + " vers " + dstFile);
            FileUtils.copyFile(zipFile, dstFile);
            FileUtils.forceDelete(zipFile);
            FileUtils.forceDelete(srcFile);
        }
    }
}

// PDF: PAGE_140613_PAR_TYJ_PLIT_29_36.pdf
// PDF: PAQL_20121022_001.pdf, PAQL_20121022_002.pdf ...
function movePdf(code, regexp) {
    var listDir = new File(SRC_DIR).listFiles();
    for (var i = 0; i < listDir.length; i++) {
        var srcFile = listDir[i];
        var srcName = srcFile.getName() + "";
        _print("srcName " + srcName);
        if (!srcFile.isDirectory() && srcName.match(regexp)) {
            Thread.sleep(5000);  // stability insurance
            var dstDate = processDate(srcName.replace(regexp, "$1"));
            var book = srcName.replace(regexp, "$3");
            var page = srcName.replace(regexp, "$4");

            page = StringUtils.leftPad(page, 3, "0");
            if (book == "CANT" || book == "T28")
                page = "0" + page;
            else if (book == "CCEO" || book == "E25")
                page = "1" + page;
            else if (book == "CDYE")
                page = "2" + page;
            else
                page = "3" + page;

            var dstFile = new File(SRC_DIR + "/" + code + "_" + dstDate + "/" + code + "_" + dstDate + "_" + page + ".pdf");
            _print("copie " + srcFile + " vers " + dstFile);
            FileUtils.copyFile(srcFile, dstFile);
            FileUtils.forceDelete(srcFile);
        }
    }
}

function process(code, re) {
    movePdf(code, re);
    buildConcatZip(code);
}

// Main 
function main() {
    process("PA", new RegExp("^PAGE_(\\d+)_PIR_(ATJ)_(.+)_(\\d+)_\\d+\\.pdf", ""));
    process("PP", new RegExp("^PAGE_(\\d+)_PIR_(PR5|ZDE)_(.+)_(\\d+)_\\d+\\.pdf", ""));
    return _NOP;   // Don't do anything after this script
}

// Result _OK = 0 ; _FAIL = 1; _NOP = 2
// start & exit
try {
    _exit = main();
} catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}
