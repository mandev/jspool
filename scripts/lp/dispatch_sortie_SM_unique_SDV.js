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

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

//////////////////////////////////////////////////////////////////////////////////////
// Paramètres
//////////////////////////////////////////////////////////////////////////////////////

// Edition unique 77 à modifier pour SDV
// A modifier pour la formule ETE
var ALL_PDF    = [ "D:/LP/ArrMethode/pages/milibris/milibris_ftp" ] ;

// Définitions de expression régulières PDF
var re_par_nat_pdf  = new RegExp("^PAGE_\\d+_PAR_PAR7S_T7S_\\d+_\\d+\\.pdf", "i") ;
var re_par_edi_pdf  = new RegExp("^PAGE_\\d+_PAR_PAR7S_E7S_\\d+_\\d+\\.pdf", "i") ;

// Copie les fichier vers les répertoires
function copyFileTo(dirs) {
    for (i in dirs) {
    	   var file = _srcFile.getName().replaceAll("7S", "7N") ;
        var destFile = new File(dirs[i], file) ;
        _print("copie : " + file + " vers " + destFile.getPath()) ;
        FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    }
}

// Main
function main() {

    var name = _srcFile.getName() ;

    if ( name.match(re_par_nat_pdf) ) copyFileTo(ALL_PDF) ;
    if ( name.match(re_par_edi_pdf) ) copyFileTo(ALL_PDF) ;
 
    return _OK ;
}

// start & exit
_exit = main() ;
