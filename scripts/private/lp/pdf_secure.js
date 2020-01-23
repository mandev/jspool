/* 
 * Emmanuel Deviller
 * 
 * test.js
 */

importPackage(Packages.java.awt);
importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.pdftool.filters);
importPackage(Packages.com.adlitteram.pdftool.utils);

// Init
var OUTPUT_DIR = _getValue("OUTPUT_DIR") ;

// Main
function main() {
    var dirname = new File(OUTPUT_DIR).getName() ;
    var output = OUTPUT_DIR + "/" + _srcFile.getName() ;
    
    _print("Securising: " + dirname + "/" + _srcFile.getName());
    var renderFilter = new RenderFilter(0);
    renderFilter.addRender(new Text(dirname, 33, 28 , 0, 0, null, 1, Color.WHITE));
    var pdfTool = new PdfTool();
    pdfTool.addFilter(new AddMetadata(output, "source", dirname + "/" + _srcFile.getName()));
    pdfTool.addFilter(renderFilter);
    pdfTool.execute(_srcFile.getFile());
    return _OK;
}

// start & exit
try {
    // _exit :  _OK = 0 ; _FAIL = 1 ; _NOP = 2 ; _KEEP = 3 ;
    _exit = main();
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}
