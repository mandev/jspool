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
var OUTPUT_DIRS = [ "C:/tmp/sortie" ] ;

// Main
function main() {
 
    // Fichier entrée :  PAR_70809_ENFRANCE01sGAU_CP.pdf
    // Fichier de sortie : PAGE_070809_PAR_XXX.pdf

    var tokens = _srcFile.getName().split("_") ;

    var media = tokens[0] ;
    var pdate = tokens[1] + "" ;    // force javascript String
    if ( pdate.length == 5 ) pdate = "0" + pdate ;
    var id = tokens[2] ;

    var ext = FilenameUtils.getExtension(_srcFile.getName()) ;
    var filename = "PAGE_" + pdate + "_" + media + "_" + id + "." + ext ;

    for (i in OUTPUT_DIRS) {
        var destFile = new File(OUTPUT_DIRS[i], filename) ;
        _print("copie : " + _srcFile.getName() + " vers " + destFile.getPath()) ;
        FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    }

    return _OK ;
}

// start & exit
_exit = main() ;

