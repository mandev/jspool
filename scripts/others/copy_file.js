/* copy_file.js
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

function main() {
    FileUtils.copyFile(_srcFile.getFile(), new File("C:/tmp/ecenter/spool/entree", _srcFile.getName())) ;
    return _KEEP ;
}

// start & exit 
_exit = main() ; 

