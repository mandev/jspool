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
OUTPUT_DIRS = new Array()
OUTPUT_DIRS[0] = "C:/tmp/ed5" ;
OUTPUT_DIRS[1] = "C:/tmp/ed6" ;

// Copy the srcfile to outputdir 
// Append the src directory name to the destination filename
function main() {

     for (i in OUTPUT_DIRS) {

        // Construct the destination file (don't use with ftp source)
        var prefix = _srcFile.getFile().getParentFile().getName() ;
        var destFile = new File(OUTPUT_DIRS[i], prefix + "_" + _srcFile.getName()) ;

        _print("copie fichier : " + _srcFile.getName() + " vers " + destFile) ;
        FileUtils.copyFile(_srcFile.getFile(), destFile) ;
      }

     return _OK ;
}

// start & exit 
_exit = main() ; 

