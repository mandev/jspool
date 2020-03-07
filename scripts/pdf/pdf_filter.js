/* 
 * Exec external PDF tool and add metadat to PDF
 */

importPackage(Packages.java.io);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.pdftool.filters);

DST_DIR = "D:/tmp/ed2";
DST_DIR2 = "D:/tmp/ed3";
TMP_DIR = "E:/tmp/pdf";

GS_EXE = "C:/Program Files/gs/gs9.04/bin/gswin64c.exe";

function execGS(srcFile) {
    var tmpFile = new File(TMP_DIR, srcFile.getName());
    var dstFile = new File(DST_DIR, srcFile.getName());

    var opt = ["-q", "-dNOPROMPT", "-dBATCH", "-dNOPAUSE",
        "-sDEVICE=pdfwrite", "-dPDFSETTINGS=/printer", "-dUseCIEColor",
        "-dDownsampleColorImages=true", "-dColorImageDownsampleThreshold=1.2",
        "-dDownsampleGrayImages=true", "-dGrayImageDownsampleThreshold=1.2",
        "-dTextAlphaBits=4", "-dGraphicsAlphaBits=4", "-o", tmpFile.getPath(), srcFile.getPath()];

    _print("Launching " + GS_EXE + " " + opt + " dir: " + tmpFile.getParent());
    var status = _exec(GS_EXE, opt, tmpFile.getParent(), 30 * 60000); // 30 minutes time out

    if (status != 0 || !tmpFile.exists() || tmpFile.length() == 0 || tmpFile.length() >= (srcFile.length() * .9)) {
        if (tmpFile.exists())
            FileUtils.forceDelete(tmpFile);
        _print("copy " + srcFile.getPath() + " " + dstFile.getPath());
        if (dstFile.exists())
            FileUtils.forceDelete(dstFile);
        FileUtils.moveFile(srcFile, dstFile);
    } else {
        _print("addMetadata " + tmpFile.getPath());
        var pdfInfo = PdfExtractor.getPdfInfo(srcFile);
        var pdfTool = new PdfTool();
        pdfTool.addFilter(new AddMetadata(pdfInfo.getProperties()));
        pdfTool.execute(tmpFile);

        _print("copy " + tmpFile.getPath() + " " + dstFile.getPath());
        if (dstFile.exists())
            FileUtils.forceDelete(dstFile);
        FileUtils.moveFile(tmpFile, dstFile);
    }
}

function main() {
    execGS(_srcFile.getFile());
    return _OK;
}

// start & exit 
try {
    _exit = main();
} catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}



