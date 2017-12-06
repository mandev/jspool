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
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.adlitteram.jspool) ;

OUTPUT_DIR = "D:/Sorties/archives" ;
ERROR_DIR = "D:/Error"  ;

function between(date, d1, d2) {
    var t = date.getTime() ;
    return ( t >= d1.getTime() && t < d2.getTime()) ;
}

function createDate(h, m) {
    var d = new Date() ;
    d.setHours(h) ;
    d.setMinutes(m) ;
    d.setSeconds(0) ;
    return d ;
}

function processReg(srcFile)  {
    var now = new Date() ;
    if ( between(now, createDate(6,0), createDate(7,0))) {
        var dstFile = new File(OUTPUT_DIR, srcFile.getName()) ;
        _print("Copying " + srcFile + " to " + dstFile );
        FileUtils.copyFile(srcFile, dstFile) ;
        return _OK ;
    }
    return _KEEP ;
}

function processNat(srcFile)  {
    var now = new Date() ;
    if ( between(now, createDate(12,0), createDate(13,0))) {
        var lastModified = srcFile.lastModified() ;
        var currentTime = createDate(10,0).getTime() ; 
        if ( lastModified < currentTime ) {
            return _OK ;
        }
    }
    return _KEEP ;
}

function main() {
    
    var srcFile = _srcFile.getFile() ;
    var dpt = srcFile.getParentFile().getName() ;
    var status ;
    
    if ( dpt == "60" || dpt == "75" || dpt == "77N" || dpt == "77S" || dpt == "78" ||
        dpt == "91" || dpt == "92" || dpt == "93" ||  dpt == "94" || dpt == "95" ) {
        
        status = processReg(srcFile) ;
    }
    else if ( dpt == "NAT" ) {
        status = processNat(srcFile) ;
    }
    else {
        status = _KEEP ;
    }

    return status ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, _srcFile.getName())) ;
    _exit = _OK;
}
