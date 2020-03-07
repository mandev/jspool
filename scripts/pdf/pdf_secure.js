/* 
 * Secure a PDF
 */

importPackage(Packages.java.awt);
importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.pdftool.filters);
importPackage(Packages.com.adlitteram.pdftool.utils);

var OUTPUT_DIR = _getValue("OUTPUT_DIR") ;

function main() {
    var dirname = new File(OUTPUT_DIR).getName() ;
    var output = OUTPUT_DIR + "/" + _srcFile.getName() ;
    
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
    _exit = main();
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}
