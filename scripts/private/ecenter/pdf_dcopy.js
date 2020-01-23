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
importPackage(Packages.java.util) ;
importPackage(Packages.com.lowagie.text) ;
importPackage(Packages.com.lowagie.text.pdf) ;
importPackage(Packages.org.apache.commons.io) ;

// Init directory (no limit!)
OUTPUT_DIRS = [ "C:/tmp/ed5", "C:/tmp/ed6" ] ;

// Get the metadata map
function getMetadata(ifile)  {
   var reader = new PdfReader(ifile.getPath()) ;
   var map = reader.getInfo() ;
   reader.close() ;
   return map ;
}

// Main
function main() {

   var file = _srcFile.getFile() ;
   var map = getMetadata(file) ;
   var name = _srcFile.getName() + "_" +  map.get("eDoc.Copies") ;

   for (i in OUTPUT_DIRS) {
      var destFile = new File(OUTPUT_DIRS[i], name) ;
      _print("copie : " + _srcFile.getName() + " vers " + destFile.getPath()) ;
      FileUtils.copyFile(file, destFile) ;
   }

   return _OK ;
}

// start & exit
_exit = main() ;
