/* test.js
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

// Init
//DEST_DIR="D:/LP/depart/nat/codebarre/" ;
DEST_DIR2=[ "D:/METHODE/PROD/codebarre/",
	    "D:/METHODE/DEV/codebarre/",
	    "D:/METHODE/QA/codebarre/",
	    "D:/METHODE/PRODV6/codebarre/"];
DEST_DIR3="D:/LP/ArrExt/codebarre_in/";

function renomme(name) {
    var nom = "" ; 
    // Traitement fichier LP
    // Y090213.eps
	
    if (name.substr(0,1).equals("Y")) {
	nom = "CBLP_" + name.substr(5,2) + name.substr(3,2) + "20" + name.substr(1,2) + name.substr(name.indexOf("."),4) ;  
    }
    else {
	// Traitement fichier AUJ
	// 00123-0218_-0080-__.eps
	var today = new Date() ;
	var year = today.getFullYear();
	if ( (today.getDate() == 31)&&(today.getMonth() == 11) ) {
		year = today.getFullYear()+1 ;
	}
	if (name.substr(0,5).equals("00123")) {
	    nom = "CBAU_" + name.substr(8,2) + name.substr(6,2) + year + name.substr(name.indexOf("."),4) ;
	}
	else {
	    nom = "CBAUDIM_" + name.substr(8,2) + name.substr(6,2) + year + name.substr(name.indexOf("."),4) ;
	}
    }
    return nom ;
}

// Fichier : CBAU0611.eps
function isTomorrow(name) {
    var today = new Date() ;
    var da = new Date() ;
    da.setFullYear(today.getFullYear(), name.substr(name.indexOf(".")-6,2)-1, name.substr(name.indexOf(".")-8,2)) ;

    // Cas special du CBAU0101.eps
    if ( (today.getDate() == 31)&&(today.getMonth() == 11) ) {
        da.setFullYear(today.getFullYear()+1, name.substr(name.indexOf(".")-6,2)-1, name.substr(name.indexOf(".")-8,2)) ;
    }
    da.setHours(6,0,0,0) ;
    
    // Envoi du cas du sup Eco : selection du dat� de LUNDI
    if ((da.getDay()==1)&&(name.substr(2,2).equals("LP"))) return true;

    var today = new Date() ;
    if ( today < da ) {
        da.setDate(da.getDate()-1) ;
        return ( today > da ) ;
    }
	
    return false ;
}

// Main 
function main() {
    
    var src_file = renomme(_srcFile.getName()) ;
    //_print("Code barre - nouveau nom : " + src_file) ;

    if ( isTomorrow(src_file) ) {
//if (1) {
        // copie de l'eps 
//        var destDir = new File(DEST_DIR) ;
//	var destFile = new File(destDir + "/" + src_file) ;
//        _print("Code barre - copie " + src_file + " vers " + destDir) ;
//        FileUtils.copyFile(_srcFile.getFile(), destFile) ;

        if (src_file.substr(src_file.indexOf(".",0),4).equals(".pdf")) {
	    for (i in DEST_DIR2) {
	    	var destDir2 = new File(DEST_DIR2[i]) ;
		var destFile2 = new File(destDir2 + "/" + src_file) ;
            	_print("Code barre -  copie " + src_file + " vers " + destDir2) ;
            	FileUtils.copyFile(_srcFile.getFile(), destFile2) ;
	    }
	} 
	else {
	    var destDir3 = new File(DEST_DIR3) ;
	    var destFile3 = new File(destDir3 + "/" + src_file) ;
            _print("Code barre - copie " + src_file + " vers " + destDir3) ;
            FileUtils.copyFile(_srcFile.getFile(), destFile3) ;
	}
        return _OK ;
        //return _KEEP ;
    }    
    return _KEEP ;
}

// start & exit 
_exit = main() ; 

