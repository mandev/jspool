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
OUT_DIRS = [ "D:/AUJSPORT/TEMPAUJSPORT/arrivees/infographies", 
             "D:/AUJSPORT/SAUVAUJSPORT/infographies" ] ;

RIP_DIRS = [ "D:/AUJSPORT/TEMPAUJSPORT/infographies" ] ;

// Copy the srcfile to outputdir 
// Append the src directory name to the destination filename
function main() {

     for (i in OUT_DIRS) {
        var dstFile = new File(OUT_DIRS[i], _srcFile.getName()) ;
        _print("copie fichier : " + _srcFile.getName() + " vers " + dstFile) ;
        FileUtils.copyFile(_srcFile.getFile(), dstFile) ;
     }

     var ext = FilenameUtils.getExtension(_srcFile.getName()).toUpperCase() ;
     if ( ext == "PDF" || ext == "PS" || ext == "EPS" ) {
        for (i in RIP_DIRS) {
           var dstFile = new File(RIP_DIRS[i], _srcFile.getName()) ;
           _print("copie fichier : " + _srcFile.getName() + " vers " + dstFile) ;
           FileUtils.copyFile(_srcFile.getFile(), dstFile) ;
        }
     }

     return _OK ;
}

// start & exit 
_exit = main() ; 

