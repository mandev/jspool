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
DEST_DIR=[ "C:/export/home/election/methode/prod","C:/export/home/election/methode/qa","C:/export/home/election/methode/dev","C:/export/home/election/methode/sav", "C:/export/home/election/methode/prodv6" ] ;

function renomme(name) {
    var da = new Date() ;
    da.setDate(da.getDate()+1);
    var jour = new String(da.getDate()) ;
    if ( jour.length == 1 ) jour = "0" + jour ;

    var mois = new String(da.getMonth()+1) ;
    if ( mois.length == 1 ) mois = "0" + mois ;

    var annee = new String(da.getFullYear()) ;
    return annee + mois + jour + "_" + FilenameUtils.getBaseName(name) + "_" + da.getHours() + da.getMinutes() + da.getSeconds() + "." + FilenameUtils.getExtension(name);	
}

// Main 
function main() {
 
    for (i in DEST_DIR) {
    	var destDir = new File(DEST_DIR[i]) ;
    //	var destFile = new File(destDir, renomme(_srcFile.getName())) ;
	//_print("Elections - copie " + renomme(_srcFile.getName()) + " vers " + destDir) ;
    	var destFile = new File(destDir, _srcFile.getName()) ;
	_print("Elections - copie " + _srcFile.getName() + " vers " + destDir) ;
    	FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    }	
    return _OK ;
    //return _KEEP ;
}

// start & exit 
_exit = main() ; 

