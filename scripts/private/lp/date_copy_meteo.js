/* pdf_dcopy.js
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

// Fichier : 20130615_METEO_PUB.pdf ou 20130615_METEO_NOPUB.pdf ou leparisien_20130614.pdf
function isTomorrow(name) {
    var da = new Date() ;
    if ((name.substr(0,4)) == "lepa") {
    	da.setFullYear(name.substr(11,4), name.substr(15,2)-1, name.substr(17,2)) ;	
    	} else {
	da.setFullYear(name.substr(0,4), name.substr(4,2)-1, name.substr(6,2)) ;
    }
  	    
    //// da.setFullYear("20" + name.substr(6,2), name.substr(4,2)-1, name.substr(2,2)) ;
   
    da.setHours(6,0,0,0) ;

    var today = new Date() ;
    if ( today < da ) {
        da.setDate(da.getDate()-1) ;
        return ( today > da ) ;
    }
    return false ;
}


// Init directory (no limit!)
OUTPUT_DIR = ["D:/LP/ArrExt/meteo_in"] ;
OUTPUT_DIR2 = ["D:/LP/ArrExt/meteo_in"] ;
//OUTPUT_DIR = ["D:/METHODE/DEV/infographies","D:/METHODE/QA/infographies"];
//OUTPUT_DIR2 = ["D:/METHODE/DEV/infographies","D:/METHODE/QA/infographies"];

// Today
function getToday() {
    var da = new Date() ;
    da.setDate(da.getDate()+1);
    var jour = new String(da.getDate()) ;
    if ( jour.length == 1 ) jour = "0" + jour ;

    var mois = new String(da.getMonth()+1) ;
    if ( mois.length == 1 ) mois = "0" + mois ;

    var annee = new String(da.getFullYear()).substr(2,2) ;
    return jour + mois + annee ;	
}


// Main
function main() {
	if ( isTomorrow(_srcFile.getName()) ) {
   		var file = _srcFile.getFile() ;
   		var name = _srcFile.getName().substr(0, _srcFile.getName().indexOf(".")) + "_" + getToday() + ".eps" ;
   		var ext = FilenameUtils.getExtension(_srcFile.getName()).toLowerCase() ;

   		if (ext.equals("eps")) {
   		var name = _srcFile.getName().substr(0, _srcFile.getName().indexOf(".")) + "_" + getToday() + ".eps" ;
		var destFile = new File(OUTPUT_DIR, name) ;
   		_print("copie : " + _srcFile.getName() + " vers " + destFile.getPath()) ;
   		FileUtils.copyFile(file, destFile) ;
   		}
   	else if (ext.equals("pdf")){
	//var name = _srcFile.getName() ;
	var name = _srcFile.getName().substr(0, _srcFile.getName().indexOf(".")) + "_" + getToday() + ".pdf" ;
	for (i in OUTPUT_DIR2) {
    	    var destFile = new File(OUTPUT_DIR2[i], name) ;
    	    // _print("je suis dans pdf" );
	    _print("copie : " + _srcFile.getName() + " vers " + destFile.getPath()) ;
   	    FileUtils.copyFile(file, destFile) ;
			}
   		}
   	return _OK ;
	}
   	return _KEEP ;
}

// start & exit
_exit = main() ;
