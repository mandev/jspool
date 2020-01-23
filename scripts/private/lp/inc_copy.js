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

// Init directory (no limit!)
MAX_FILE=5 ;
ROOT = "C:/tmp/ed2" ;
DATA = [ "data01", "data02", "data03", "data04", "data05", 
    "data06", "data07", "data08",  "data09", "data10", 
    "data11", "data12", "data13", "data14", "data15", 
    "data16", "data17", "data18",  "data19", "data20" ]; 

// Copy MAX_FILE in each directory
function main() {

    var dir = new File(ROOT + "/" + DATA[0] + "/" + DATA[0] )
    var destFile = new File(dir, _srcFile.getName()) ;
    _print("copie fichier : " + _srcFile.getName() + " vers " + dir) ;
    FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    
    var filenames = dir.list() ;
    _print("nombre de fichiers : " + filenames.length ) ;
    if ( filenames.length >= MAX_FILE ) {
        for (var i in DATA ) {
            for (var j in DATA) {
                var ndir = new File(ROOT + "/" + DATA[i] + "/" + DATA[j] )
                if ( ! ndir.exists() ) {
                    _print("rename dir : " + dir + " vers " + ndir) ;
                    ndir.getParentFile().mkdirs() ;
                    dir.renameTo(ndir) ;
                    return _OK ;
                }
            }
        }
        _print("ATTENTION - le nombre de répertoires maximum a été atteint!") ;
    }
    
    return _OK ;
}

// start & exit 
_exit = main() ; 

