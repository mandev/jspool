/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.java.util)  ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.apache.commons.lang) ;
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());
OUTPUT_DIRS = [ "C:/tmp/ed2", "C:/tmp/ed3" ] ;

// 29/08/2012 17:31:19 
function getTime() {
    var d = new Date() ;
    return  pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) ;
}

function pad(num) {
    return ( num < 10 ) ? "0" + num : "" + num  ;
}

function writeElement(document, dstFile) {
    _print("writeElement: " + dstFile );
    if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
    if ( !dstFile.getParentFile().exists() ) FileUtils.forceMkdir(dstFile.getParentFile()) ;
    var os = new BufferedOutputStream(new FileOutputStream(dstFile)) ;
    var serializer = new Serializer(os, "UTF-8");
    serializer.setIndent(3);
    serializer.write(document);
    os.close() ;
}

function createPageArray(pageNodes) {
    var pageArray = new Array() ;
    for (var k = 0; k < pageNodes.size(); k++) {
        var pageNode = pageNodes.get(k);
        pageArray.push(pageNode) ;
        var pagePn = pageNode.getAttributeValue("pn") ;
        if ( pagePn.contains(",") ) pageArray.push(pageNode) ;
    }
    return pageArray ;
}

function processXml(file) {
    _print("processXml: " + file);

    var XOM = ScriptUtils.createXomBuilder(false, false) ;
    var doc = XOM.build(file);
    var productNode = doc.getRootElement();
    var issueDate = productNode.getAttributeValue("issueDate") + ""  ;
 
    var parutionElement = new Element("parution");
    parutionElement.addAttribute(new Attribute("time", getTime())) ;
    parutionElement.addAttribute(new Attribute("publicationDate", issueDate)) ;
    parutionElement.addAttribute(new Attribute("name", "par")) ;

    var editionNodes = productNode.getChildElements()  ;
    for (var i = 0; i < editionNodes.size(); i++) {
        var editionNode = editionNodes.get(i);
        var editionName = editionNode.getAttributeValue("name") + "" ;
        
        var bookNodes = editionNode.getChildElements() ;
        for (var j = 0; j < bookNodes.size(); j++) {
            var bookNode = bookNodes.get(j) ;
            var bookName = bookNode.getAttributeValue("methodeName") + "";

            var pageNodes = bookNode.getChildElements() ;
            var pageArray = createPageArray(pageNodes) ;
            var pageMax = pageArray.length ;
            
            for (var k = 0; k < pageMax; k++) {
                var pageNode = pageArray[k];
                var plateElement = new Element("page") ;
                //plateElement.addAttribute(new Attribute("publicationDate", issueDate)) ;
                plateElement.addAttribute(new Attribute("edition", editionName)) ;
                plateElement.addAttribute(new Attribute("book", bookName)) ;
                plateElement.addAttribute(new Attribute("folio", (k+1))) ;
                plateElement.addAttribute(new Attribute("color", pageNode.getAttributeValue("color"))) ;
                plateElement.addAttribute(new Attribute("section", pageNode.getAttributeValue("section"))) ;
                plateElement.addAttribute(new Attribute("editionNumber", pageNode.getAttributeValue("pnEditionNumber") )) ;
                plateElement.addAttribute(new Attribute("double", pageNode.getAttributeValue("pn").contains(","))) ;
                parutionElement.appendChild(plateElement) ;
                //_print("editionid:" + editionName + " bookid:"+ bookName + " page:" + k + " => " + plate) ;
            }
        }
    }
    
    // LeParisien_2012-08-30.xml.ctde
    var filename = "LeParisien_" +  issueDate.substr(6,4) + "-" + issueDate.substr(3,2) + "-" + issueDate.substr(0,2) + ".xml.map" ;
    var document = new Document(parutionElement);

    for (i in OUTPUT_DIRS) {
        var dstFile = new File(OUTPUT_DIRS[i], filename) ;
        writeElement(document, dstFile);
    }
}

function main() {
    processXml(_srcFile.getFile()) ;
    return _OK ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
}
