/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io);
importPackage(Packages.java.util);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.lang);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.nu.xom);

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());
OUTPUT_DIRS = ["D:/LP/ArrMethode/plaques_config"];
EXCLUDE_EDITIONS = ["PAR", "JDE", "ROUGH", "VIT", "LYO", "NTE", "NCY", "TOU", "MIT"];
EXCLUDE_BOOKS = ["E60", "E75", "E77", "E7N", "E7S", "E78", "E91", "E92", "E93", "E94", "E95", "CECO"];

// 29/08/2012 17:31:19 
function getTime() {
    var d = new Date();
    return  pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
}

function formatTime(date) {
    return  date.substr(0, 2) + date.substr(3, 2) + date.substr(8, 2);
}

function pad(num) {
    return (num < 10) ? "0" + num : "" + num;
}

function excludeEdition(editionName) {
    for (var i = 0; i < EXCLUDE_EDITIONS.length; i++) {
        if (editionName == EXCLUDE_EDITIONS[i])
            return true;
    }
    return false;
}

function excludeBook(bookName) {
    for (var i = 0; i < EXCLUDE_BOOKS.length; i++) {
        if (bookName == EXCLUDE_BOOKS[i])
            return true;
    }
    return false;
}

// Test if it is Sunday 06/04/2014
function isSunday(parDate) {
    var da = new Date();
    da.setHours(6, 0, 0, 0);
    da.setFullYear("20" + parDate.substr(8, 2), parDate.substr(3, 2) - 1, parDate.substr(0, 2));
    return (da.getDay() == 0);
}

function writeElement(document, dstFile) {
    _print("writeElement: " + dstFile);
    if (dstFile.exists())
        FileUtils.forceDelete(dstFile);

    if (!dstFile.getParentFile().exists())
        FileUtils.forceMkdir(dstFile.getParentFile());

    var os = new BufferedOutputStream(new FileOutputStream(dstFile));
    var serializer = new Serializer(os, "UTF-8");
    serializer.setIndent(3);
    serializer.write(document);
    os.close();
}

function getPageMax(pageNodes) {
    var pageMax = 0;
    for (var k = 0; k < pageNodes.size(); k++) {
        var pageNode = pageNodes.get(k);
        pageMax++;
        var pagePn = pageNode.getAttributeValue("pn");
        if (pagePn.contains(","))
            pageMax++;
    }
    return pageMax;
}

function processXml(file) {
    _print("processXml: " + file);

    var XOM = ScriptUtils.createXomBuilder(false, false);
    var doc = XOM.build(file);
    var productNode = doc.getRootElement();
    var issueDate = productNode.getAttributeValue("issueDate") + "";
    var parDate = formatTime(issueDate);

    // We deals with sunday only
    var parutionElement = new Element("parution");
    parutionElement.addAttribute(new Attribute("time", getTime()));
    parutionElement.addAttribute(new Attribute("publicationDate", issueDate));
    parutionElement.addAttribute(new Attribute("name", "par"));

    var editionNodes = productNode.getChildElements();
    for (var i = 0; i < editionNodes.size(); i++) {
        var editionNode = editionNodes.get(i);
        var editionName = editionNode.getAttributeValue("name") + "";
        if (excludeEdition(editionName))
            continue;
        var bookNodes = editionNode.getChildElements();
        var newPageMax = 0;
        var newBookName = "";

        // Get the total max page for all books
        for (var j = 0; j < bookNodes.size(); j++) {
            var bookNode = bookNodes.get(j);
            var bookName = bookNode.getAttributeValue("methodeName") + "";
            if (excludeBook(bookName)) continue;
            if (newPageMax == 0) newBookName = bookName;
            newPageMax += getPageMax(bookNode.getChildElements());
        }

        // Rename Page for each book
        var m = 0;
        for (var j = 0; j < bookNodes.size(); j++) {
            var bookNode = bookNodes.get(j);
            var bookName = bookNode.getAttributeValue("methodeName") + "";
            if (excludeBook(bookName)) continue;
            var pageMax = getPageMax(bookNode.getChildElements());
            if ( bookName == newBookName && pageMax == newPageMax ) continue ;

            for (var k = 1; k <= pageMax; k++) {
                m++;
                var oldName = "PAGE_" + parDate + "_PAR_" + editionName + "_" + bookName + "_" + k + "_" + pageMax;
                var newName = "PAGE_" + parDate + "_PAR_" + editionName + "_" + newBookName + "_" + m + "_" + newPageMax;

                var plateElement = new Element("page");
                plateElement.addAttribute(new Attribute("oldName", oldName));
                plateElement.addAttribute(new Attribute("newName", newName));
                parutionElement.appendChild(plateElement);
            }
        }
    }

    var filename = parDate + "_pagin_map.xml";
    var document = new Document(parutionElement);
    for (var i in OUTPUT_DIRS) {
        writeElement(document, new File(OUTPUT_DIRS[i], filename));
    }
}

function main() {
    processXml(_srcFile.getFile());
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

