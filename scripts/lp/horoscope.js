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
//OUTPUT_DIR="D:/LP/depart/NAT/horoscope" ;
//OUTPUT_DIR2="D:/METHODE/horoscope" ;
OUTPUT_DIR2=["D:/METHODE/PROD/horoscope", "D:/METHODE/QA/horoscope", "D:/METHODE/DEV/horoscope", "D:/METHODE/PRODV6/horoscope"]  ;

// Fichier : horo_010209_v1.eps
function isTomorrow(name) {
    var today = new Date() ;
    var da = new Date() ;
    da.setFullYear("20"+name.substr(9,2), name.substr(7,2)-1, name.substr(5,2)) ;
    da.setHours(7,0,0,0) ;

    if ( today < da ) {
        da.setDate(da.getDate()-1) ;
        return ( today > da ) ;
    }
    
    return false ;
}

// Fichier : horo_01_02_09_v1.eps
// On enlève les underscore dans la date
function renomme(name) {
   
    if ( name.substr(7,1).equals("_") ) {
        return name.substr(0,7) + name.substr(8,2) + name.substr(11,9) ;
    }
    
    return name ;
}

// Main
function main() {
    var name = renomme(_srcFile.getName()) ;

    if ( isTomorrow(name) ) {
//        var destDir = new File(OUTPUT_DIR) ;

        // copie de l'eps et pdf
       
//	var destFile = new File(destDir, name) ;
//        _print("copie fichier : " + name + " vers " + destDir) ;
//        FileUtils.copyFile(_srcFile.getFile(), destFile) ;
	 

        if (name.substr(name.indexOf(".",0),4).equals(".pdf")) {
            for (i in OUTPUT_DIR2) {
		var destDir2 = new File(OUTPUT_DIR2[i]) ;
	    	var destFile2 = new File(destDir2,name) ;
            	_print("copie fichier : " + name + " vers " + destDir2) ;
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


