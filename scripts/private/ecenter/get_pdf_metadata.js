/* get_pdf_metada.js
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
importPackage(Packages.com.adlitteram.pdftool) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Get the metadata map 
function printMetadata(ifile)  {

   _print("Open PDF file : " + ifile.getPath());
   var reader = new PdfReader(ifile.getPath()) ;
   var map = reader.getInfo() ;

   // print all metadatas (debug)
   var it = map.entrySet().iterator() ;
   while ( it.hasNext() )  {
      var entry = it.next() ;
      _print(entry.getKey().toString() + " = " + entry.getValue().toString()) ;
   }

   _print(" ") ; 
   reader.close() ;
}

function printInfo(pdfFile)  {
   var pdfInfo = PdfExtractor.getPdfInfo(pdfFile) ;
   _print(pdfFile.getName() + " : " + pdfInfo.getMetadata("eDoc.Code")) ;

//   var it = pdfInfo.getEntrySet().iterator() ;
//   while ( it.hasNext() )  {
//      var entry = it.next() ;
//      _print(pdfFile.getName() + " : " + entry.getKey().toString() + " = " + entry.getValue().toString()) ;
//   }
//   _print(" ") ;
}

function main() {

   // don't use _srcFile.getFile() with ftp source !!!!
   printInfo(_srcFile.getFile()) ;
   
   // do something here
   return _OK ;
}

// start & exit 
_exit = main() ; 

