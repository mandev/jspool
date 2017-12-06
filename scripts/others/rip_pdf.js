/* get_pdf_metada.js
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.lang)  ;
importPackage(Packages.java.io)  ;
importPackage(Packages.java.util) ; 
importPackage(Packages.com.lowagie.text) ;
importPackage(Packages.com.lowagie.text.pdf) ;
importPackage(Packages.org.apache.commons.io) ; 

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

var outputDir="/tmp/rip_out";

// Get the metadata map
function getMetadata(file)  {

  var reader = new PdfReader(file.getPath()) ;
  var map = reader.getInfo() ;
  reader.close() ;
  return map ;
}

// Set PDF Metada
function setMetadata(file, map)  {

   var reader = new PdfReader(file.getPath() + "_") ;
   var os = new BufferedOutputStream(new FileOutputStream(file), 4096) ;      
   var stamper = new PdfStamper(reader, os) ;
   stamper.setMoreInfo(map) ;

   _print("Set PDF Metadata to " + file.getPath());
   stamper.close() ;
   reader.close() ;
   os.close() ;
}

// Exec GS interpreter
function execGhostscript(file)  {

   var exe = "C:/Program Files/gs/gs8.63/bin/gswin32c.exe " ;
   var opt = "-dQUIET -dSAFER -sDEVICE=pdfwrite -dCompatibilityLevel=1.3 -dPDFSETTINGS=/prepress -dGraphicsAlphaBits=4 -r600 -o " ;
   var pdf = file.getName() + "_ " + file.getPath() ;

   _print("Launching " + exe + opt + pdf) ;
   _exec(exe + opt + pdf, outputDir, true, true) ; // creates also parent directory
}

// Main
function main() {

   var srcFile = _srcFile.getFile() ;

   var map = getMetadata(srcFile) ;
   execGhostscript(srcFile) ;
   setMetadata(new File(outputDir, srcFile.getName()), map) ;
   FileUtils.forceDelete(new File(outputDir, srcFile.getName() + "_")) ;

   return _OK ;
}

// start & exit 
_exit = main() ; 

