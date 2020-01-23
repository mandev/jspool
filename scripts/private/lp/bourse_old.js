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
DEST_DIR=[ "D:/LP/arrExt/bourse_in" ] ;

// Fichier : brslp1802_q.eps et brslp1802_nb.eps
function renomme(name) {
    var da = new Date() ;
    da.setFullYear(da.getFullYear(), name.substr(7,2)-1, name.substr(5,2)) ;
    da.setDate(da.getDate()+1);
    var jour = new String(da.getDate()) ;
    if ( jour.length == 1 ) jour = "0" + jour ;

    var mois = new String(da.getMonth()+1) ;
    if ( mois.length == 1 ) mois = "0" + mois ;

    var annee = new String(da.getFullYear()).substr(2,2) ;
    return 'brslp_' + jour + mois + annee + name.substr(name.indexOf("_",0),7) ;	
}

function getToday() {
}

// Main 
function main() {
 
    for (i in DEST_DIR) {
    	var destDir = new File(DEST_DIR[i]) ;
    	var destFile = new File(destDir, _srcFile.getName()) ;
	if (DEST_DIR[i].substr(DEST_DIR[i].indexOf("_",0),3).equals("_in")) {
	    destFile = new File(destDir, renomme(_srcFile.getName())) ;
	}	
    	_print("La bourse - copie " + _srcFile.getName() + " vers " + destDir) ;
    	FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    }	
    return _OK ;
    //return _KEEP ;
}

// start & exit 
_exit = main() ; 

