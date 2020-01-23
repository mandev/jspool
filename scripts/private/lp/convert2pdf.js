/* test.js
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.com.adlitteram.jspool);

OUTPUT_DIR = _getValue("OUTPUT_DIR");
ERROR_DIR = _getValue("ERROR_DIR");

// 32 bits / 64 bits
//GS_EXE = "C:/Program Files/gs/gs9.14/bin/gswin32c.exe" ;
GS_EXE = "C:/Program Files/gs/gs9.14/bin/gswin64c.exe";

// Exec GS interpreter
function convertToPdf(file) {
    var tmpFile = File.createTempFile("tmp_", ".pdf", file.getParentFile());
    tmpFile.deleteOnExit();

//"-sPAPERSIZE=a3 ",
    var opt = ["-q", "-dNOPROMPT", "-dBATCH", "-dNOPAUSE",
        "-sDEVICE=pdfwrite", "-dPDFSETTINGS=/prepress", "-dEPSCrop",
        "-o", tmpFile.getPath(), file.getPath()];

    _print("Launching " + GS_EXE + " " + opt);
    var status = _exec(GS_EXE, opt, tmpFile.getParent(), 5 * 60000); // 5 minutes time out
    
    if (status != 0 || !tmpFile.exists() || tmpFile.length() == 0) {
        _print("Error converting to PDF: " + _srcFile.getName());
        var errorFile = new File(ERROR_DIR, _srcFile.getName());
        FileUtils.copyFile(file, errorFile);
    }
    else {
        _print("Converting to PDF done: " + _srcFile.getName());
        copyFile(tmpFile);
    }
    FileUtils.deleteQuietly(tmpFile);
}

function copyFile(file) {
    var dirs = OUTPUT_DIR.split(";");
    var filename = FilenameUtils.removeExtension(_srcFile.getName()) + ".pdf";
    for (var i = 0; i < dirs.length; i++) {
        var dstFile = new File(dirs[i], filename);
        _print("Copying " + file.getName() + " to " + dstFile);
        FileUtils.copyFile(file, dstFile);
    }
}

function main() {
    convertToPdf(_srcFile.getFile());
    return _OK;
}

// start & exit 
try {
    _exit = main();
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}



