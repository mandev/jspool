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
var DEP_RUB = ["Guide dimanche"];


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

function createPageArray(pageNodes) {
    var pageArray = new Array();
    for (var k = 0; k < pageNodes.size(); k++) {
        var pageNode = pageNodes.get(k);
        pageArray.push(pageNode);
        var pagePn = pageNode.getAttributeValue("pn");
        if (pagePn.contains(","))
            pageArray.push(pageNode);
    }
    return pageArray;
}

function processXml(file) {
    _print("processXml: " + file);

    var XOM = ScriptUtils.createXomBuilder(false, false);
    var doc = XOM.build(file);
    var productNode = doc.getRootElement();
    var issueDate = productNode.getAttributeValue("issueDate") + "";

    // We deals with sunday only
    if (isSunday(issueDate)) {
        var parutionElement = new Element("parution");
        parutionElement.addAttribute(new Attribute("time", getTime()));
        parutionElement.addAttribute(new Attribute("publicationDate", issueDate));
        parutionElement.addAttribute(new Attribute("name", "par"));

        var editionNodes = productNode.getChildElements();
        for (var i = 0; i < editionNodes.size(); i++) {
            var editionNode = editionNodes.get(i);
            var editionName = editionNode.getAttributeValue("name") + "";
            var pageMaxVirt = 0;
            var pageMaxCent = 0;

            // We deals with AUJ edition only
            if (editionName.equals("AUJ")) {
                var bookNodes = editionNode.getChildElements();
                                
                // get max Page for each book
                for (var j = 0; j < bookNodes.size(); j++) {
                    var bookNode = bookNodes.get(j);
                    var bookName = bookNode.getAttributeValue("methodeName") + "";
                    var pageNodes = bookNode.getChildElements();
                    var pageArray = createPageArray(pageNodes);

                    // We deals with CAUJ & CNAT books only
                    if (bookName.equals("CNAT")) {
                        pageMaxCent = pageArray.length;
                        pageMaxVirt += pageArray.length;
                    }
                    else if (bookName.equals("CAUJ")) {
                        pageMaxVirt += pageArray.length;
                    }
                }

                // Rename Page for each book
                for (var j = 0; j < bookNodes.size(); j++) {
                    var bookNode = bookNodes.get(j);
                    var bookName = bookNode.getAttributeValue("methodeName") + "";

                    var pageNodes = bookNode.getChildElements();
                    var pageArray = createPageArray(pageNodes);
                    var m = pageMaxCent;

                    for (var k = 0; k < pageArray.length; k++) {
                        var pageNode = pageArray[k];
                        var newBookName = bookName.replace("CAUJ", "CNAT");

                        var section = ((pageNode.getAttributeValue("section") == null) ? "" : pageNode.getAttributeValue("section"));
                        var oldName = "PAGE_" + formatTime(issueDate) + "_PAR_" + editionName + "_" + bookName + "_" + (k + 1) + "_" + pageArray.length;
                        for (var n=0; DEP_RUB.length; n++) {
                            if (section.equals(DEP_RUB[n])) {
                                m++;
                                newName = "PAGE_" + formatTime(issueDate) + "_PAR_" + editionName + "_" + newBookName + "_" + m + "_" + pageMaxVirt;
                            } else {
                                newName = "PAGE_" + formatTime(issueDate) + "_PAR_" + editionName + "_" + newBookName + "_" + (k + 1) + "_" + pageMaxVirt;
                            }
                        }

                        var plateElement = new Element("page");
                        plateElement.addAttribute(new Attribute("oldName", oldName));
                        plateElement.addAttribute(new Attribute("newName", newName));
                        parutionElement.appendChild(plateElement);
                    }
                }
            }
        }

        // LeParisien_2012-08-30.xml.ctde
        // var filename = "LeParisien_" +  issueDate.substr(6,4) + "-" + issueDate.substr(3,2) + "-" + issueDate.substr(0,2) + ".xml.map" ;
        var filename = issueDate.substr(0, 2) + issueDate.substr(3, 2) + issueDate.substr(8, 2) + "_pagin_map.xml";
        var document = new Document(parutionElement);

        for (i in OUTPUT_DIRS) {
            var dstFile = new File(OUTPUT_DIRS[i], filename);
            writeElement(document, dstFile);
        }
    }
    else
        _print("pas de pagine du dimanche");


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

