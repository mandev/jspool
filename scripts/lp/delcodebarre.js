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

// Fichier : CBAU0611.eps
function isToday(name) {
    var today = new Date() ;
    var da = new Date() ;
    da.setFullYear(today.getFullYear(), name.substr(name.indexOf(".")-2,2)-1, name.substr(name.indexOf(".")-4,2)) ;
    da.setHours(6,0,0,0) ;

    var today = new Date() ;
    today .setDate(today .getDate()-2) ;
    if ( today < da ) {
        da.setDate(da.getDate()-2) ;
        return ( today > da ) ;
    }
    return false ;
}

// Main 
function main() {
 
    if ( isToday(_srcFile.getName()) ) {
        var srcFile = new File(_srcDir, _srcFile.getName()) ;
        _print("Code barre - suppression " + _srcFile.getName() + " dans " + _srcDir) ;
        srcFile['delete']() ;

        return _OK ;
        //return _KEEP ;
    }    
    return _KEEP ;
}

// start & exit 
_exit = main() ; 

