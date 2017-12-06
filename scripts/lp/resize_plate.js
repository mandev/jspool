/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.adlitteram.pdftool.filters) ;
importPackage(Packages.com.adlitteram.pdftool.utils) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Globals
var OUTPUT_DIRS = [ "C:/Methode/PDF2" ] ;

var pdfFile ;

// Split the plate into 2 pages
function resizePlate(file) {
    _print("Resizing plate");

    pdfFile = File.createTempFile("plate_", ".pdf") ;
    pdfFile.deleteOnExit() ;
    var pdfTool = new PdfTool();
    pdfTool.addFilter(new CropMargin(pdfFile.getPath(), -36* NumUtils.MMtoPT, -10* NumUtils.MMtoPT, -1* NumUtils.MMtoPT, -28* NumUtils.MMtoPT ));
    pdfTool.execute(file);

}

// Main
function main() {
 
    var file = _srcFile.getFile() ;

    resizePlate(file) ;

    for (i in OUTPUT_DIRS) {
        var destFile = new File(OUTPUT_DIRS[i], file.getName()) ;
        _print("copie : " + pdfFile.getName() + " vers " + destFile.getPath()) ;
        FileUtils.copyFile(pdfFile, destFile) ;
    }
    FileUtils.deleteQuietly(pdfFile) ;

    return _OK ;
}

// start & exit
_exit = main() ;

