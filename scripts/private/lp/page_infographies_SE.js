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
DEST_DIR=[ "D:/METHODE/DEV/infographies_SE","D:/METHODE/QA/infographies_SE","D:/METHODE/PROD/infographies_SE", "D:/METHODE/PRODV6/infographies_SE" ] ;

// Fichier : 20150528_SE_13755510845367.pdf
/*function isTomorrow(name) {
    var da = new Date() ;
    da.setFullYear(name.substr(0,4), name.substr(4,2)-1, name.substr(6,2)) ;
    da.setHours(6,0,0,0) ;

    var today = new Date() ;
    if ( today < da ) {
        da.setDate(da.getDate()-1) ;
        return ( today > da ) ;
    }
    return false ;
}
*/
// Main 
function main() {
 
//if ( isTomorrow(_srcFile.getName()) ) {
	for (i in DEST_DIR) {
            var destDir = new File(DEST_DIR[i]) ;
            var destFile = new File(destDir, _srcFile.getName()) ;
	       // if (DEST_DIR[i].substr(DEST_DIR[i].indexOf("_",0),3).equals("_in")) {
		      destFile = new File(destDir, _srcFile.getName()) ;
	       // }
            _print("Infographies SE - copie " + _srcFile.getName() + " vers " + destDir) ;
            FileUtils.copyFile(_srcFile.getFile(), destFile) ;
	}

        return _OK ;
        //return _KEEP ;
   //}    
    //return _KEEP ;
}

// start & exit 
_exit = main() ; 

