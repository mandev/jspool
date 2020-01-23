/* Robocop.js
* Paul Huynh
*
* _srcDir : the spooled directory (String)
* _srcFile : the file found (SourceFile)
* _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
*
*/

importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ;

// Debug
_print("srcDir : " + _srcDir);
_print("srcFile : " + _srcFile.getPath());
_print("srcFile : " + _srcFile.getName());

// Init
SRC_DIR="C:/temp/MAG/Arrivée_Manchette" ;
DEST_DIR="C:/temp/MAG/DEPART" ;

// Main
function main() {
    
    var fic = _srcFile.getFile().getParentFile() ;
    var ed = fic.getFile().getParentFile() ;
    
    // On a pris la bonne date à priori avec le script d'input
    if ( isTomorrow(dat) ) {
        _print("fichier source : " + _srcFile.getName() + ".") ;
        _print("fichier cible : " + fic.getName() + ".") ;
        _print("parution : " + ed.getName() + ".") ;
        
        var destName = DEST_DIR + "/" + ed.getName() + "/" + fic.getName().substring(fic.getName().indexOf("_")+1, fic.getName().indexOf("_")+13) + "_" + fic.getName().substring(0,fic.getName().indexOf("_")) + ".eps" ;
        var destFile = new File(destName) ;
        var OKName = _srcFile.getFile().getParentFile().getPath() + "/OK" ;
        var OKFile = new File(OKName) ;
        
        _print("copie du fichier : " + srcFile + " vers : " + destFile.getPath() ) ;
        FileUtils.copyFile(_srcFile.getFile(), destFile) ;
        FileUtils.touch(OKFile) ;
        
        return _OK ;
        // return _KEEP ;
    }
    
    return _KEEP ;
}

// start & exit
_exit = main() ;

