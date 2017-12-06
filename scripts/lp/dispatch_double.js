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
importPackage(Packages.nu.xom) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.adlitteram.pdftool.filters) ;
importPackage(Packages.com.adlitteram.pdftool.utils) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Paramètres
var ERROR_DIR = "C:/tmp/errors" ;

// "D:/jsrv/spool/PDF/in2", 
var OUTPUT_DIRS = [ "D:/jsrv/spool/PDF/in3", "D:/jsrv/spool/EIDOS/PROD", "D:/jsrv/spool/EIDOS/QA", "D:/jsrv/spool/EIDOS/DEV" ] ;

// Main
function main() {
 
    for (i in OUTPUT_DIRS) {
        var destFile = new File(OUTPUT_DIRS[i], _srcFile.getName()) ;
        _print("copie : " + _srcFile.getName() + " vers " + destFile.getPath()) ;
        FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    }

    return _OK ;
}

// start & exit
_exit = main() ;

