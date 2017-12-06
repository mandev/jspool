/* 
* Emmanuel Deviller
* 
* inout.js
*/

// Attention aux mots réservés : ex.  file.delete => file["delete"] )

importPackage(Packages.java.io)  ;
importPackage(Packages.com.AdLitteram.jSpool.Files) ; 
importPackage(Packages.com.AdLitteram.jSpool.Sources) ; 

// _localScript : the being executed script (LocalScript)
// _channel : the current channel (Channel)
// _print() : print string to log
// _exit : OK = 0 ; FAIL = 1 ; NOP = 2 


SRC_DIR="C:/staging/" ;


OUT_DIR="C:/staging/" ;
SRC_DIR="C:/staging/" ;

//    SET-PIXSMILE-A3-001
//
//    AGEN-PIXSMILE-21x21-RIGIDE
//    AGEN-PIXSMILE-21x21-001
//    AGEN-PIXSMILE-A4HR-001
//
//    CALE-PIXSMILE-A4P-001
//    CALE-PIXSMILE-A3V-001
//    CALE-PIXSMILE-BUR-001
//    CALE-PIXSMILE-TOWER-A3
//
//    BOOK-PIXSMILE-15x15R-001
//    BOOK-PIXSMILE-21x21R-001
//    BOOK-PIXSMILE-A4HR-001
//    BOOK-PIXSMILE-A4VR-001
//    BOOK-PIXSMILE-30x30R-001
//    BOOK-PIXSMILE-A3HR-001
//
//    CARD-PIXSMILE-148x105-001

    "BOOK-PIXSMILE-15x15R-001",



function initMetadata()  {
   var pdfInfo = PdfExtractor.getPdfInfo(pdfFile) ;
   var customerId = pdfInfo.getMetadata("eDoc.CustomerId") ;
   var purchaseId = pdfInfo.getMetadata("eDoc.PurchaseId") ;
   var transfertId = pdfInfo.getMetadata("eDoc.TransfertId") ;

   cover = pdfInfo.getMetadata("eDoc.Cover") ;
   pageNumber = pdfInfo.getNumberOfPages() ;
   outputDir = "C:\\tmp\\httpdocs\\userspace\\"+ customerId + "\\flashbooks\\" + purchaseId + "-" + transfertId ;
}

// Is Tomorrow
function isTomorrow(name) {
    var da = new Date() ;
    da.setFullYear("20" + name.substr(6,2), name.substr(3,2)-1, name.substr(0,2)) ;
    da.setHours(6,0,0,0) ;
    
    var today = new Date() ;
    if ( today < da ) {
        da.setDate(da.getDate()-1) ;
        return ( today > da ) ;
    }
    return false ;
}

// Return requested dir
function getDir() {
    var src = new File(SRC_DIR) ;
    if (src.isDirectory()) {
        var listDir = src.listFiles();
        for (var i=0; i<listDir.length; i++) {
            var srcDir1 = listDir[i] ; 
            if ( isTomorrow(srcDir1.getName()) ) {
                return srcDir1.getPath() ;
            }
        }
    }
    return "" ;
}

// Init and Wrap Local Spool
function initLocalSpool() {
    localDir = _localScript.getProperty("_localDir") ;
    if ( localDir == null ) {
        localDir = new LocalDir() ;
        localDir.init(_channel) ;
        _localScript.setProperty("_localDir", localDir) ;
    }
    return localDir ;
}

// Main 
function main() {
    var localDir = initLocalSpool() ;    
    var srcDir = getDir() ;
    
    if (srcDir != "") {
        var dir = new File(srcDir) ;    
        if ( dir.exists() && dir.isDirectory()) {        
            var srcFile = new LocalFile(dir, 3, false, 0);        
            _print("LocalDir " + _channel.getTrgHandler()) ;    
            localDir.doRun(srcDir, srcFile, _channel.getTrgHandler()) ;
        }
    }
    else {
        _print("Tomorrow dir not found.") ;    
    }
    
    return _NOP ;   // Don't do anything after this script
}

// Result _OK = 0 ; _FAIL = 1; _NOP = 2
_exit=main() ; 

