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
importPackage(Packages.org.apache.commons.io) ; 
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.com.adlitteram.pdftool) ; 
importPackage(Packages.com.adlitteram.pdftool.filters) ; 

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

DST_DIR = "D:/tmp/ed2" ;
DST_DIR2 = "D:/tmp/ed3" ;
TMP_DIR = "E:/tmp/pdf" ;

// 64 bits
GS_EXE = "C:/Program Files/gs/gs9.04/bin/gswin64c.exe" ;
// 32 bits
// GS_EXE = "C:/Program Files/gs/gs9.04/bin/gswin32c.exe" ;

// Exec GS interpreter
function convertToPdf(srcFile)  {
    var dstFile = new File(DST_DIR, srcFile.getName()) ;    
    var tmpFile = File.createTempFile("plate_", ".pdf", srcFile.getParentFile()) ;   
    tmpFile.deleteOnExit()  ;

    var opt = [ "-q", "-dNOPROMPT", "-dBATCH", "-dNOPAUSE", 
                "-sDEVICE=pdfwrite", "-dUseCIEColor",
                "-dCompatibilityLevel=1.4", "-o", 
                tmpFile.getPath(), srcFile.getPath() ] ;

    _print("Launching " + GS_EXE + " " + opt) ;
    var status = _exec(GS_EXE, opt, tmpFile.getParent(), 5 * 60000) ; // 30 minutes time out
    if ( status != 0 || !tmpFile.exists() || tmpFile.length() == 0 ) {
        _print("Error converting to PDF") ;
    }
    else {
        _print("Converting to PDF done") ;
    }
   
    FileUtils.deleteQuietly(dstFile) ;
    FileUtils.moveFile(tmpFile, dstFile) ;
    return dstFile ;
}

// Exec GS interpreter
function convertToJpeg(srcFile)  {
    var dstFile = new File(DST_DIR2, srcFile.getName()) ;    
    var tmpFile = File.createTempFile("plate_", ".pdf", srcFile.getParentFile()) ;   
    tmpFile.deleteOnExit()  ;


    var opt = [ "-q", "-dNOPROMPT", "-dBATCH", "-dNOPAUSE", 
                "-sDEVICE=jpeg", "-dUseCIEColor",
                "-dJPEGQ=85", "-dTextAlphaBits=4", 
                "-dGraphicsAlphaBits=4", "-r180",
                "-o", 
                tmpFile.getPath(), srcFile.getPath() ] ;

    _print("Launching " + GS_EXE + " " + opt) ;
    var status = _exec(GS_EXE, opt, tmpFile.getParent(), 5 * 60000) ; // 30 minutes time out
    if ( status != 0 || !tmpFile.exists() || tmpFile.length() == 0 ) {
        _print("Error converting to JPEG") ;
    }
    else {
        _print("Converting to PDF done") ;
    }
   
    FileUtils.deleteQuietly(dstFile) ;
    FileUtils.moveFile(tmpFile, dstFile) ;
    return dstFile
}


function execGS(srcFile) {
    //_print("execGS: " + srcFile.getName() ) ;    
                    
    var tmpFile = new File(TMP_DIR, srcFile.getName()) ;    
    var dstFile = new File(DST_DIR, srcFile.getName()) ;    

    var opt = [ "-q", "-dNOPROMPT", "-dBATCH", "-dNOPAUSE", 
    "-sDEVICE=pdfwrite", "-dPDFSETTINGS=/printer", "-dUseCIEColor",
    "-dDownsampleColorImages=true", "-dColorImageDownsampleThreshold=1.2",
    "-dDownsampleGrayImages=true" , "-dGrayImageDownsampleThreshold=1.2", 
    "-dTextAlphaBits=4", "-dGraphicsAlphaBits=4", "-o", 
    tmpFile.getPath(), srcFile.getPath() ] ;

    _print("Launching " + GS_EXE + " " + opt + " dir: " + tmpFile.getParent()) ;
    var status = _exec(GS_EXE, opt, tmpFile.getParent(), 30 * 60000) ; // 30 minutes time out
    
    if ( status != 0 || !tmpFile.exists() || tmpFile.length() == 0 || tmpFile.length() >= (srcFile.length()*.9) ) {
        if ( tmpFile.exists() ) FileUtils.forceDelete(tmpFile) ;
        _print("copy " + srcFile.getPath() + " " + dstFile.getPath() ) ;
        if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
        FileUtils.moveFile(srcFile, dstFile) ;
    }
    else {
        _print("addMetadata " + tmpFile.getPath()) ;
        var pdfInfo = PdfExtractor.getPdfInfo(srcFile) ;
        var pdfTool = new PdfTool() ;
        pdfTool.addFilter(new AddMetadata(pdfInfo.getProperties())) ;
        pdfTool.execute(tmpFile) ;
   
        _print("copy " + tmpFile.getPath() + " " + dstFile.getPath() ) ;
        if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
        FileUtils.moveFile(tmpFile, dstFile) ;
    }   
}

function main() {
    convertToJpeg(convertToPdf(_srcFile.getFile()) ) ;
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



