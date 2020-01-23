/* dmail.js
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

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Init 
var INPUT_DIR = _getValue("INPUT_DIR"); // "C:/tmp/sinequa1/"
var PDFTMP_DIR = "D:/tmp/pdftmp/";
var GS_EXE = "C:/Program Files/gs/gs9.07/bin/gswin64c.exe";

function convertToPdf(file) {
    var tmpFile = File.createTempFile("tmp_", ".pdf", new File(PDFTMP_DIR));
    tmpFile.deleteOnExit();

    // gswin64c.exe -dNOPAUSE -dBATCH -dSAFER -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook 
    // -dAutoRotatePages=/None -dColorImageResolution=150 -dColorImageDownsampleThreshold=1.2 
    // -dGrayImageDownsampleThreshold=1.2 -dGrayImageResolution=150 -r150 -dFastWebView 
    // -o sortie.pdf -c "512000000 setvmthreshold" -f entree.pdf

    var opt = ["-q", "-dNOPROMPT", "-dBATCH", "-dNOPAUSE", "-sDEVICE=pdfwrite",
        "-dPDFSETTINGS=/ebook", "-dAutoRotatePages=/None",
        "-dColorImageDownsampleThreshold=1.2", "-dGrayImageDownsampleThreshold=1.2",
        "-dColorImageResolution=180", "-dGrayImageResolution=180", "-r180",
        "-dFastWebView", "-o", tmpFile.getPath(),
        "-f", file.getPath()];

    _print("Launching " + GS_EXE + " " + opt + " dir: " + file.getParent());
    _exec(GS_EXE, opt, file.getParent(), 300000); // creates also parent directory

    if ( tmpFile.length() > 0 && file.length() > (tmpFile.length() * 1.2)) {
        _print("File replaced : " + Math.round(file.length() / 1000) + "Ko / " + Math.round(tmpFile.length() / 1000) + "Ko - " + file);
        FileUtils.deleteQuietly(file);
        FileUtils.moveFile(tmpFile, file);
    }
    else {
        _print("File keeped : " + Math.round(file.length() / 1000) + "Ko / " + Math.round(tmpFile.length() / 1000) + "Ko - " + file);     
        FileUtils.deleteQuietly(tmpFile);
    }
}

function listDir(dir) {
    
    var files = dir.    listFiles() ; 
    for (var i = 0; i < files.length; i++) {
        var file = files[i] ;
        if ( file.isDirectory() ) {
            if ( file.exists() ) listDir(file) ;
        }
        else if ( file.getName().endsWith(".pdf") || 
                    file.getName().endsWith(".PDF") ) {
            if ( file.exists() ) {
                _print("Files : " + file.getPath());
                convertToPdf(file)
            }
        }
    }
}

// Resize and mail
function main() {
    var dir = new File(INPUT_DIR);
    _print("Looking for PDF files in : " + dir);
    listDir(dir) ;
    
    //var files = FileUtils.listFiles(dir, ["pdf", "PDF"], true).toArray();
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

