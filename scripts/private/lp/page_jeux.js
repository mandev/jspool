/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

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

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Init
//OUTPUT_DIR="D:/LP/DEPART/NAT/JEUX" ;
//OUTPUT_DIR2="D:/METHODE/JEUX" ;
OUTPUT_DIR2=[ "D:/METHODE/PROD/JEUX", 
             "D:/METHODE/DEV/JEUX",
             "D:/METHODE/QA/JEUX", 
             "D:/METHODE/PRODV6/JEUX" ] ;
             


function renomme(name) {
    var nom = "" ; 
    // 1002_1827.eps
	
    var today = new Date() ;
	var year = today.getFullYear();
	if ( (today.getDate() == 31)&&(today.getMonth() == 11) ) {
		year = today.getFullYear()+1 ;
	}
	nom = year + name ;
    return nom ;
}

// Fichier : 1002_1827.eps
function isTomorrow(name) {
    var today = new Date() ;
    var da = new Date() ;
    da.setFullYear(today.getFullYear(), name.substr(2,2)-1, name.substr(0,2)) ;
    // Cas special du 0101_xxxx.eps
    if ( (today.getDate() == 31)&&(today.getMonth() == 11) ) {
        da.setFullYear(today.getFullYear()+1, name.substr(2,2)-1, name.substr(0,2)) ;
    }
    da.setHours(9,0,0,0) ;

    if ( today < da ) {
        da.setDate(da.getDate()-1) ;
        return ( today > da ) ;
    }
    
    return false ;
}

// Main
function main() {

    if ( isTomorrow(_srcFile.getName()) ) {
//        var destDir = new File(OUTPUT_DIR) ;
//	var destFile = new File(destDir, renomme(_srcFile.getName())) ;
//        _print("copie fichier : " + _srcFile.getName() + " vers " + destDir) ;
//        FileUtils.copyFile(_srcFile.getFile(), destFile) ;
	
	if (_srcFile.getName().substr(_srcFile.getName().indexOf(".",0),4).equals(".pdf")) {
	    for (i in OUTPUT_DIR2) {
        	var destDir2 = new File(OUTPUT_DIR2[i]) ;
       	    	var destFile2 = new File(destDir2, "jeux_" + renomme(_srcFile.getName())) ;
            	_print("copie fichier : " + _srcFile.getName() + " vers " + destDir2) ;
            	FileUtils.copyFile(_srcFile.getFile(), destFile2) ;
	    }
	}
        
	return _OK ;
        //return _KEEP ;
    }


    return _KEEP ;

}

// start & exit
_exit = main() ;


