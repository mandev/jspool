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
importPackage(Packages.java.util) ; 
importPackage(Packages.com.lowagie.text) ; 
importPackage(Packages.com.lowagie.text.pdf) ; 
importPackage(Packages.org.apache.commons.io) ; 

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Init directory (no limit!)
OUTPUT_DIRS = new Array()
OUTPUT_DIRS[0] = "C:/tmp/ed5" ;

function setMetadata(ifile, ofile, map)  {

   var reader = new PdfReader(ifile.getPath()) ;
   var os = new FileOutputStream(ofile) ;      

   _print("Open PDF file : " + ifile.getPath());
   var stamper = new PdfStamper(reader, os) ;
   stamper.setMoreInfo(map) ;

   _print("Copy PDF to : " + ofile.getPath());
   stamper.close() ;
   reader.close() ;
   os.close() ;
}

// Copy the srcfile to outputdir 
// Append the src directory name to the destination filename
function main() {

   // Create the destination directory if necessary 
   for (i in OUTPUT_DIRS) {
      var destDir = new File(OUTPUT_DIRS[i]) ;
      if ( ! destDir.exists() ) destDir.mkdirs() ;

      // Construct the destination file
      var filename = _srcFile.getName() ;

      var i0 = filename.lastIndexOf("-cpy") ;
      var i1 = filename.lastIndexOf(".") ;
      if ( i0 > 0 && i1 > 0 && i1 > i0 ) {
         var copies=filename.substring(i0+4,i1) ;   
         _print("copies : " + copies);

         var destFile = new File(destDir, _srcFile.getName()) ;
         var map = new HashMap() ;
         map.put("eDoc.Copies", copies) ;      

         setMetadata(_srcFile.getFile(), destFile, map) ;
      }
      else {
         _print("Le fichier ne contient pas de -cpy!");
      }      
   }

   return _OK ;
}

// start & exit 
_exit = main() ; 

