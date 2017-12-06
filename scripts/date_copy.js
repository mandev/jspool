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
OUTPUT_DIRS = [ "C:/tmp/spools/ed2", "C:/tmp/spools/ed3" ] ;


// Today
function getToday() {
    var da = new Date() ;
    var jour = new String(da.getDate()) ;
    if ( jour.length == 1 ) jour = "0" + jour ;

    var mois = new String(da.getMonth()+1) ;
    if ( mois.length == 1 ) mois = "0" + mois ;

    var annee = new String(da.getFullYear()).substr(2,2) ;
    return jour + mois + annee ;	
}


// Main
function main() {

   var file = _srcFile.getFile() ;
   var name = getToday() + "_" + _srcFile.getName() ;

   for (i in OUTPUT_DIRS) {
      var destFile = new File(OUTPUT_DIRS[i], name) ;
      _print("copie : " + _srcFile.getName() + " vers " + destFile.getPath()) ;
      FileUtils.copyFile(file, destFile) ;
   }

   return _OK ;
}

// start & exit
_exit = main() ;
