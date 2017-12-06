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
importPackage(Packages.org.apache.commons.io) ; 
importPackage(Packages.com.adlitteram.pdftool) ; 
importPackage(Packages.com.adlitteram.pdftool.filters) ; 

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

var MAX_WIDTH = 400 ;
var MAX_HEIGHT = 400 ;
 
var pdfFile ;
var pageNumber ;
var pageWidth ;
var pageHeight ;
var outputDir ;
var cover ;
var res ;

// Print all metadatas
function printInfo(pdfFile)  {
   var pdfInfo = PdfExtractor.getPdfInfo(pdfFile) ;
   var it = pdfInfo.getEntrySet().iterator() ;
   while ( it.hasNext() )  {
      var entry = it.next() ;
      _print(entry.getKey().toString() + " = " + entry.getValue().toString()) ;
   }
}

// Init variables from Metadata
function initMetadata()  {
   var pdfInfo = PdfExtractor.getPdfInfo(pdfFile) ;
   var customerId = pdfInfo.getMetadata("eDoc.CustomerId") ;
   var purchaseId = pdfInfo.getMetadata("eDoc.PurchaseId") ;
   var transfertId = pdfInfo.getMetadata("eDoc.TransfertId") ;
   
   cover = pdfInfo.getMetadata("eDoc.Cover") ;
   pageNumber = pdfInfo.getNumberOfPages() ;
   outputDir = "C:\\tmp\\httpdocs\\userspace\\"+ customerId + "\\flashbooks\\" + purchaseId + "-" + transfertId ;
}

// Compute resolution from size
function initResolution() {
   var dimension = PdfExtractor.getPageSize(pdfFile, (cover=="true")?2:1) ;
   var r = Math.min(1, Math.min(MAX_WIDTH/dimension.getWidth(), MAX_HEIGHT/dimension.getHeight())) ;
   pageWidth = dimension.getWidth() * r ;
   pageHeight = dimension.getHeight() * r ;
   res = r * 72 ;
   //_print("Res = " + res + " dim = " + dimension) ;
}

// Write the XML for the page turner component
function writeXML() {
   var xmlData="<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>\n" ;
   xmlData += "<content width=\"" + Math.round(pageWidth) + "\" height=\"" + Math.round(pageHeight) + "\" ";
   xmlData += "bgcolor=\"cccccc\" loadercolor=\"ffffff\" panelcolor=\"5d5d61\" buttoncolor=\"5d5d61\" textcolor=\"ffffff\">\n" ;
   for (var i=1;i<=pageNumber;i++) {
      xmlData += "<page src=\"" + outputDir + "/pages/" + "page_" + i + ".jpg" + "\" ></page>\n" ;
   }
   xmlData += "</content>" ;

   var xmlFile = new File(outputDir + "/xml/", "pages.xml") ;
   _print("Writing " + xmlFile.getPath()) ;
   FileUtils.writeStringToFile(xmlFile, xmlData, "ISO8859_1") ; // creates also parent directory
}

// Write the XML for the page turner component
function filterPDF() {
   var pdfTool = new PdfTool() ;
   pdfTool.addFilter(new CropMargin(null, 3*72/25.4, 3*72/25.4, 3*72/25.4, 3*72/25.4)) ;
   pdfTool.execute(pdfFile) ;
}

// Exec GS interpreter
function execGhostscript()  {
   var exe = "C:\\Program Files\\gs\\gs8.56\\bin\\gswin32c.exe " ;
   var opt = "-dQUIET -dSAFER -sDEVICE=jpeg -dJPEGQ=85 -dGraphicsAlphaBits=4 -r" + res + " -o " ;   // -dDOINTERPOLATE
   var pdf = "page_%00d.jpg \"" + pdfFile.getPath() + "\"" ;

   _print("Launching " + exe + opt + pdf) ;
   _exec(exe + opt + pdf, outputDir + "/pages/", true, true) ; // creates also parent directory
}

// Main
function main() {

   pdfFile = _srcFile.getFile() ;

   initMetadata() ;
   filterPDF() ;
   initResolution() ;
   execGhostscript() ;
   writeXML() ;

   return _OK ;
}

// start & exit 
_exit = main() ; 

