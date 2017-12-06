/* test.js
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.nu.xom);
importPackage(Packages.com.adlitteram.pdftool) ; 
importPackage(Packages.com.adlitteram.pdftool.filters) ; 

var OUTPUT_DIR = "C:/tmp/ed3/";

//<SUPPLEMENT id="LPMA_20160108" lifetime="7" name="Le Parisien Magazine" singlePdf="true" NumberOfPages="92">
//    <file name="LPMA_20160108060141.zip/LPMA_20160108.pdf"/>
//</SUPPLEMENT>
function createXML(id, lifetime, name, single, pages, filename) {
    var root = new Element("SUPPLEMENT");
    root.addAttribute(new Attribute("id", id));
    root.addAttribute(new Attribute("lifetime", lifetime));
    root.addAttribute(new Attribute("name", name));
    root.addAttribute(new Attribute("singlePdf", single));
    root.addAttribute(new Attribute("NumberOfPages", pages));

    var fileElement = new Element("file");
    fileElement.addAttribute(new Attribute("name", filename));
    root.appendChild(fileElement);

    return new Document(root);
}

function writeXML(document, file) {
    var os = new BufferedOutputStream(new FileOutputStream(file));
    var serializer = new Serializer(os, "UTF-8");
    serializer.setIndent(3);
    serializer.write(document);
    os.close();
}

// LPMA_20160108.pdf : Le Parisien Magazine
// LPPA_20151217203749.zip : La Parisienne
function main() {
    var file = _srcFile.getFile();
    var pdfInfo = PdfExtractor.getPdfInfo(file);
    var pages = pdfInfo.getNumberOfPages();
    var id = FilenameUtils.getBaseName(_srcFile.getName());
    var filename = _srcFile.getName();
    var lifetime = -1;
    var name, single;

    if (id.startsWith("LPMA")) {
        lifetime = "7";
        name = "Le Parisien Magazine";
        single = "true";
    } else if (id.startsWith("LPPA")) {
        lifetime = "30";
        name = "La Parisienne";
        single = "true";
    }

    if (lifetime > 0) {
        var document = createXML(id, lifetime, name, single, pages, filename);
        writeXML(document, new File(OUTPUT_DIR, "supplement_" + id + ".xml"));
        FileUtils.copyFile(file, new File(OUTPUT_DIR, filename));
        return _OK;
    }
    
    return _KO;
}

// start & exit
try {
    _exit = main();
} 
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}

