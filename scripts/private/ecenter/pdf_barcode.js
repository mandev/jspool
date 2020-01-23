/* pdf_barcode.js
 * Emmanuel Deviller
 *
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile)
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.java.util) ;
importPackage(Packages.com.lowagie.text) ;
importPackage(Packages.com.lowagie.text.pdf) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.adlitteram.pdftool.filters) ;

// Init
MM = 72 / 25.4;
OUTPUT_FILE = "C:/tmp/ed1/{BASE}_{TEMP}.pdf" ;

// Get the barcode string from the metadata
function getBarcodeFromMetadata(srcFile)  {
    var pdfInfo = PdfExtractor.getPdfInfo(srcFile.getFile()) ;
    var code = pdfInfo.getMetadata("eDoc.Code");
    _print("barcode: " + code) ;
    return code ;
}

// Get the barcode string from filename
function getBarcodeFromName(srcFile) {
    var code = FilenameUtils.getBasename(srcFile.getName());
    _print("barcode: " + code) ;
    return code ;
}

// Main
function main() {

    var code = getBarcodeFromMetadata(_srcFile);
    var rf = new RenderFilter(OUTPUT_FILE, 0);
    rf.addRender(new BarCode(code, 78.7 * MM, 2 * MM, .5, .5, 0, BarCode.ALIGN_CENTER));

    var pdfTool = new PdfTool();
    pdfTool.addFilter(rf);
    pdfTool.execute(_srcFile.getFile());
    return _OK ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
}
