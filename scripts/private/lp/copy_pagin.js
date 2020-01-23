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
//var OUTPUT_DIRS = [ "D:/Tomcat/webapps/pagin/production/spool/ctp" ] ;
var OUTPUT_DIRS = [ "C:/tmp/ed2" ] ;


// Main
function main() {

    // PAR_31203_SPEC02sGAU_CP.pdf
    var re1 = new RegExp("^(.+)_(.+)_(.+)sDRO_CP\\.pdf", "") ;
    var re2 = new RegExp("^(.+)_(.+)_(.+)~sDRO_CP\\.pdf", "") ;

    var name = _srcFile.getName() + "" ;
    if ( name.match(re1) && !name.match(re2) ) name = name.replace(re1, "$1_$2_$3~sDRO_CP.pdf") ;

    for (i in OUTPUT_DIRS) {
        var destFile = new File(OUTPUT_DIRS[i], name) ;
        _print("copie : " + _srcFile.getName() + " vers " + destFile.getPath()) ;
        FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    }

    return _OK ;
}

// start & exit
_exit = main() ;

