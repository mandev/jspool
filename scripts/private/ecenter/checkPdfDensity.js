/* test.js
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
importPackage(Packages.org.apache.commons.io) ; 
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.com.adlitteram.pdftool) ; 
importPackage(Packages.com.adlitteram.pdftool.filters) ; 
importPackage(Packages.com.lowagie.text) ; 
importPackage(Packages.com.lowagie.text.pdf) ; 

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

DST_DIR = "E:/tmp/ed4" ;
DSP_DIRS = [ "E:/tmp/ed5", "E:/tmp/ed6" ];
DENSITY_CHECK=5;

function dispatchPdf(srcFile) {
    //_print("dispatch: " + srcFile.getName() ) ;    
    
    var count = 9999999 ;
    var dstDir ;
    
    for(var i in DSP_DIRS){
        var dir = new File(DSP_DIRS[i]) ;
        var c = dir.list().length ;
        if ( c == 0 ) {
            dstDir = dir ;
            break ;
        }
        else if ( c < count) {
            count = c ;
            dstDir = dir ;
        }
    }
    
    var dstFile = new File(dstDir, srcFile.getName()) ;    
    _print("copy " + srcFile.getPath() + " " + dstFile.getPath() ) ;
    if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
    FileUtils.moveFile(srcFile, dstFile) ;
}

function checkPdfDensity(srcFile) {
    //_print("checkPdfDensity: " + srcFile.getName() ) ;    

    var length = srcFile.length()  ;
    var pdfInfo = PdfExtractor.getPdfInfo(srcFile) ;
    var pageCount = pdfInfo.getNumberOfPages();    
    var d = pdfInfo.getLastPageSize() 
    var surface = d.getWidth() * d.getHeight() ;
    var density = length / ( surface * pageCount) ;
	
    if ( density < DENSITY_CHECK  ) {
        var dstFile = new File(DST_DIR, srcFile.getName()) ;    
        _print("copy " + srcFile.getPath() + " " + dstFile.getPath() ) ;
        if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
        FileUtils.moveFile(srcFile, dstFile) ;
    }
    else {
        dispatchPdf(srcFile) ;
    }   
}

function main() {
    checkPdfDensity(_srcFile.getFile()) ;
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



