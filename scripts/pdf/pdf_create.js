/* 
 * Create PDF
 */
importPackage(Packages.java.io)  ;
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.adlitteram.pdftool.filters) ;
importPackage(Packages.com.adlitteram.pdftool.utils) ;


var OUTPUT_DIR = _getValue("OUTPUT_DIR") ;
var file = new File(OUTPUT_DIR + "/page.pdf") ;
_print("Creating pdf: " + file.getPath());

var pdfTool = new PdfTool();
pdfTool.addFilter(new Create(file.getPath(), 278 * NumUtils.MMtoPT, 375 * NumUtils.MMtoPT, 1));
pdfTool.execute();

_print("pdf created");

// _exit :  _OK = 0 ; _FAIL = 1 ; _NOP = 2 ; _KEEP = 3 ;
_exit=_OK ; 

