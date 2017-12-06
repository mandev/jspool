/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots reserves : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.java.util) ;
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.lowagie.text) ; 
importPackage(Packages.com.lowagie.text.pdf) ; 
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// PDF properties

// Output directory
OUTPUT_DIR = "C:/tmp/" ;
ERROR_DIR = "C:/tmp/"

// Main
function main() {
    var content = "fjdufi diufi dufd" ;
    var state = 0 ;
    var nbChar = 0 ;
    for (var i = 0; i<content.length; i++) {
        var c = content.charAt(i);
        if ( state == 0) {
//            if ( c == '&' ) {
//                state = 1;
//                nbChar++;
//            }
//            else if ( c == '<' ) {
//                state = 1;
//            }
//            else nbChar++ ;
            nbChar++ ;
        }
        else if ( state == 1) {
            if ( c == ';' || c == '>' ) state = 0 ;
        }
    }
    _print("counter: " + nbChar) ;

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

