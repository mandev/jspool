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
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.adlitteram.pdftool.filters) ;
importPackage(Packages.com.adlitteram.pdftool.utils) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Paramètres
var OUTPUT_DIRS = [ "D:/jsrv/spool/Suivi/out" ] ;

var RE1 = new RegExp("^(\\d+)_(\\d+)_(.+)_\\.pdf", "") ;
var RE2 = new RegExp("^(\\d+)_(.+)\\.pdf", "") ;

// 1_131203_SPEC02_.pdf
function multiPage() {
//   _print("multiPage()");
   
   var basename = FilenameUtils.getBaseName(_srcFile.getName()) ;
   var tokens = basename.split("_") ;
   var count  = tokens[0] + "" ;
   var date = tokens[1] + "" ;  
   var name = tokens[2] + "" ;      
   //_print(count + " " + date + " " + name) ;

   if ( name.length > 2 ) {
      var base = name.substring(0, name.length-2) ;
      var num = name.substring(base.length, name.length) ;
      if ( num.match(/^\d\d$/)) {
         var n = pad(parseInt(count, 10) - 1 + parseInt(num, 10))  ;
         copyPage(_srcFile.getFile(), "PAGE_" + date + "_TAP_" + base + n + ".pdf") ;
      }
   }
}

// 131203_SPEC02.pdf
function singlePage() {
//   _print("singlePage()");
   
   var pdfInfo = PdfExtractor.getPdfInfo(_srcFile.getFile()) ;
   var pageCount = pdfInfo.getNumberOfPages(); 

   if ( pageCount > 1 ) {
      _print("spliting page: " + pageCount) ;
      var pdfTool = new PdfTool();
      var splitPageFilter = new SplitPage("D:/Mag/Pages/Suivi/{COUNT}_{BASE}_.pdf", 1) ;
      pdfTool.addFilter(splitPageFilter);
      pdfTool.execute(_srcFile.getFile());
   }
   else {
      var name = _srcFile.getName() + "" ;
      copyPage(_srcFile.getFile(), name.replace(RE2, "PAGE_$1_TAP_$2.pdf")) ;
   }
}

function copyPage(file, name) {
   for (i in OUTPUT_DIRS) {
      var dstFile = new File(OUTPUT_DIRS[i], name) ;
      _print("copy " + file.getName() + " to " + dstFile.getPath()) ;
      FileUtils.copyFile(file, dstFile) ;
   }
}

function pad(num) {
   return ( num < 10 ) ? "0" + num : "" + num  ;
}

// Main
function main() {

   var name = _srcFile.getName() + "" ;

   if ( name.match(RE1) ) {
      multiPage() ;
   }
   else if ( name.match(RE2) ) {
      singlePage() ;
   }
 
   return _OK ;
}

// start & exit
_exit = main() ;

