/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots r�serv�s : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

//////////////////////////////////////////////////////////////////////////////////////
// Param�tres
//////////////////////////////////////////////////////////////////////////////////////

// Edition unique � modifier pour SDV
var ALL_PDF    = [ "D:/LP/ArrMethode/pages/milibris/milibris_ftp" ] ;

// Editions � copier
var EDITIONS = [ "60", "7S", "7N", "91", "78", "95", "92", "93", "94" ] ;
// D�finitions de expression r�guli�res PDF
var re_par_nat_pdf  = new RegExp("^PAGE_\\d+_PAR_PAR75_T75_\\d+_\\d+\\.pdf", "i") ;
var re_par_edi_pdf  = new RegExp("^PAGE_\\d+_PAR_PAR75_E75_\\d+_\\d+\\.pdf", "i") ;

// Copie les fichier vers les r�pertoires
function copyFileTo(dirs) {
    for (i in dirs) {
    	   for (j in EDITIONS) {
    	   	   var file = _srcFile.getName().replaceAll("75", EDITIONS[j]) ;
        	   var destFile = new File(dirs[i], file) ;
             _print("copie : " + file + " vers " + destFile.getPath()) ;
             FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    	   }
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
