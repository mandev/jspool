/* 
 * Emmanuel Deviller
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

var OUTPUT_DIR = _getValue("OUTPUT_DIR") ;

function createXML() {
    var root = new Element("root");
    var article = new Element("article");
    root.appendChild(article);
    return new Document(root);
}

function writeXML(document, file) {
    var os = new BufferedOutputStream(new FileOutputStream(file)) ;
    var serializer = new Serializer(os, "ISO-8859-1");
    serializer.setIndent(4);
    serializer.setMaxLength(64);
    serializer.write(document);
    os.close() ;
}

function main() {
    var file = _srcFile.getFile() ;

    _print("Creating xml");
    var document = createXML() ;

    _print("Writing xml");
    var file = new File(OUTPUT_DIR, _srcFile.getName() + ".xml") ;
    writeXML(document, file) ;

    return _OK ;
}

// start & exit
_exit = main() ;

