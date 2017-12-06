/* pdf_dcopy.js
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

// Init directory (no limit!)
OUTPUT_DIR = "C:/dsiprod/production/archived_files" ;


// Main
function main() {

   var file = _srcFile.getFile() ;
   var destFile = new File(OUTPUT_DIR, _srcFile.getName() + "." + (new Date()).getTime()) ;
   _print("copie : " + _srcFile.getName() + " vers " + destFile.getPath()) ;
   FileUtils.copyFile(file, destFile) ;

   return _OK ;
}

// start & exit
_exit = main() ;
