/* 
 * Emmanuel Deviller
 * 
 * test.js
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.adlitteram.pdftool.filters) ;
importPackage(Packages.com.adlitteram.pdftool.utils) ;

// Init
var pdfTool = new PdfTool();
pdfTool.addFilter(new Create("D:/page.pdf", 278*NumUtils.MMtoPT, 375*NumUtils.MMtoPT, 1));
pdfTool.execute();

// _exit :  _OK = 0 ; _FAIL = 1 ; _NOP = 2 ; _KEEP = 3 ;
_exit=_OK ; 

