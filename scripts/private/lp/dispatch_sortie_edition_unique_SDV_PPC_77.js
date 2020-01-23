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

// Edition unique à modifier pour SDV
var ALL_PDF    = [ "D:/LP/ArrMethode/pages/milibris/milibris_ftp" ] ;

// Editions à copier
var EDITIONS = [ "92", "93", "94" ] ;
var EDITIONS77 = [ "7N" ];

// Définitions de expression régulières PDF
var re_par_nat_pdf  = new RegExp("^PAGE_\\d+_PAR_PAR75_T75_\\d+_\\d+\\.pdf", "i") ;
var re_par_edi_pdf  = new RegExp("^PAGE_\\d+_PAR_PAR75_E75_\\d+_\\d+\\.pdf", "i") ;

var re_par_nat_pdf77  = new RegExp("^PAGE_\\d+_PAR_PAR7S_T7S_\\d+_\\d+\\.pdf", "i") ;
var re_par_edi_pdf77  = new RegExp("^PAGE_\\d+_PAR_PAR7S_E7S_\\d+_\\d+\\.pdf", "i") ;



// Copie les fichier vers les répertoires - cas du 77
function copyFileTo77(dirs) {
    for (i in dirs) {
    	   for (j in EDITIONS77) {
    	   	   var file = _srcFile.getName().replaceAll("7S", EDITIONS77[j]) ;
        	   var destFile = new File(dirs[i], file) ;
             _print("copie : " + file + " vers " + destFile.getPath()) ;
             FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    	   }
    }
}

// Copie les fichier vers les répertoires - cas PPC
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
 	if ( name.match(re_par_nat_pdf77) ) copyFileTo77(ALL_PDF) ;
   	if ( name.match(re_par_edi_pdf77) ) copyFileTo77(ALL_PDF) ;
 
    return _OK ;
}

// start & exit
_exit = main() ;
