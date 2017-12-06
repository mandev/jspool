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
importPackage(Packages.nu.xom);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.drew.imaging.jpeg);
importPackage(Packages.com.drew.metadata.iptc);
importPackage(Packages.com.drew.metadata.exif);


// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Globals
// var TEMP_DIR = "D:/METHODE/archive/axa_tmp/";
// var OUTPUT_DIR = "D:/METHODE/archive/axa_ftp/";
var TEMP_DIR = "C:/Exports/Sinequa/tmp/";
var OUTPUT_DIR = "C:/Exports/Sinequa/out/";

var ZIP_DIR;
var OUT_DIR;
var DATE_DIR;
var DATE_NAME = null;
var PLAN_XML = null;
var PAGE_COUNT = 0;

function getToday() {

    var today = new Date();
    var year = today.getFullYear() + "";
    
    var day = today.getDate();
    if (day < 10)
        day = "0" + day;
    
    var month = today.getMonth() + 1;
    if (month < 10)
        month = "0" + month;
    
    var hour = today.getHours();
    if (hour < 10)
        hour = "0" + hour;
    
    var min = today.getMinutes();
    if (min < 10)
        min = "0" + min;
    
    var sec = today.getSeconds();
    if (sec < 10)
        sec = "0" + sec;

    return year + "" + month + "" + day + "" + hour + "" + min + "" + sec;
}
// Unzip archive
function extractZip() {
    _print("Extracting Zip file");
    ZIP_DIR = new File(TEMP_DIR, _srcFile.getName() + "_dir");
    _print("ZIP_DIR: " + ZIP_DIR);
    //if ( ZIP_DIR.exists() ) FileUtils.forceDelete(ZIP_DIR) ;
    ScriptUtils.unzipFileToDir(_srcFile.getFile(), ZIP_DIR);
    _print("Extracting Zip file done");
}


function cleanDir() {
//	if ( OUT_DIR.exists() ) {
//        _print("Purging " + OUT_DIR);
//        FileUtils.forceDelete(OUT_DIR) ;
//  	}

    if (ZIP_DIR.exists()) {
        _print("Purging " + ZIP_DIR);
        FileUtils.forceDelete(ZIP_DIR);
    }
}


// Process zip and set global variables
function processZip() {
    _print("Processing Archive File");

    // Date Directory 20101402
    var filenames = ZIP_DIR.list();
    var rxp = new RegExp("\\d\\d\\d\\d\\d\\d\\d\\d", "");
    for (var i in filenames) {
        if (filenames[i].match(rxp)) {

            DATE_NAME = filenames[i];
            _print("DATE_NAME: " + DATE_NAME);

            DATE_DIR = new File(ZIP_DIR + "/" + DATE_NAME);
            _print("DATE_DIR: " + DATE_DIR);

            var planDir = new File(DATE_DIR + "/plan");
            var files = planDir.listFiles();
            if (files.length > 0) {
                PLAN_XML = files[0];
                _print("PLAN_XML: " + PLAN_XML);
                return true;
            }
        }
    }

    _print("PLAN_XML not found!");
    return false;
}

function processPlanXml() {
    _print("processPlanXml starting");

    var builder = new Builder();
    var doc = builder.build(PLAN_XML);

    var pageNodes = doc.query("/pageplan/metadata/objectLinks/objectLink [@linkType='page']");
    for (var i = 0; i < pageNodes.size(); i++) {
        var pageNode = pageNodes.get(i);
        var file = new File(DATE_DIR + "/page/" + pageNode.getAttributeValue("extRef") + ".xml");
        processPageXml(file);
    }

    _print("Number of pages found: " + PAGE_COUNT);
    _print("processPlanXml done");
}

function processPageXml(pageFile) {
    //    _print("processPageXml starting: " + pageXml);

    var builder = new Builder();
    var doc = builder.build(pageFile);

    //_print("Page found: " + pageFile.getName());
    PAGE_COUNT++;

    var page = new Object();
    var invDate = getValue(doc, "/page/metadata/issueDate") + "";
    page.issueDate = getInvertedDate(invDate);
    page.product = getValue(doc, "/page/metadata/product") + "";
    page.edition = getValue(doc, "/page/metadata/editions/edition") + "";
    page.book = getValue(doc, "/page/metadata/book") + "";
    page.pn = getValue(doc, "/page/metadata/pn") + "";
    page.color = getValue(doc, "/page/metadata/color") + "";
    page.section = getValue(doc, "/page/metadata/categories/category") + "";
    page.sequence = getValue(doc, "/page/metadata/sequence") + "";
    page.name = "";
    page.thumb = "";
    page.preview = "";
    page.dstPath = OUTPUT_DIR + invDate.substr(0, 4) + "/" + invDate.substr(4, 2) + "/" + invDate.substr(6, 2) + "/" + page.product + "/" + page.edition + "/" + page.book + "/" + page.pn + "/";

    var inheritedEditions = new Array();
    var editionNodes = doc.query("/page/metadata/editions/edition/text()");
    if (editionNodes.size() > 2) {
        for (var i = 1; i < editionNodes.size(); i++) {
            inheritedEditions.push(editionNodes.get(i).getValue() + "");
        }
    }
    page.inheritedEditions = inheritedEditions;

    var uriTextNodes = doc.query("/page/content/uri/text()");
    for (var i = 0; i < uriTextNodes.size(); i++) {
        FileUtils.copyFile(new File(DATE_DIR + "/page/" + uriTextNodes.get(i).getValue()), new File(page.dstPath + "Page_" + uriTextNodes.get(i).getValue()));
        if (FilenameUtils.getExtension(uriTextNodes.get(i).getValue()) == "pdf") {
            page.name = "Page_" + uriTextNodes.get(i).getValue() + "";
        }
        if ((uriTextNodes.get(i).getValue() + "").indexOf("_t") == -1) {
            page.thumb = "Page_" + uriTextNodes.get(i).getValue() + "";
        }
        if ((uriTextNodes.get(i).getValue() + "").indexOf("_p") == -1) {
            page.preview = "Page_" + uriTextNodes.get(i).getValue() + "";
        }
    }

    var storyNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='story']");
    for (var i = 0; i < storyNodes.size(); i++) {
        processStoryXml(page, new File(DATE_DIR + "/story/" + storyNodes.get(i).getAttributeValue("extRef") + ".xml"));
    }

    var imageNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='image']");
    for (var i = 0; i < imageNodes.size(); i++) {
        processImageXml(page.dstPath, new File(DATE_DIR + "/image/" + imageNodes.get(i).getAttributeValue("extRef") + ".xml"));
    }

    var graphicNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='graphic']");
    for (var i = 0; i < graphicNodes.size(); i++) {
        processGraphicXml(page.dstPath, new File(DATE_DIR + "/graphic/" + graphicNodes.get(i).getAttributeValue("extRef") + ".xml"));
    }

    var pg = new Element("page");
    pg.addAttribute(new Attribute("date", page.issueDate));
    pg.addAttribute(new Attribute("product", page.product));
    pg.addAttribute(new Attribute("edition", page.edition));
    pg.addAttribute(new Attribute("book", page.book));
    pg.addAttribute(new Attribute("pn", page.pn));
    pg.addAttribute(new Attribute("color", page.color));
    pg.addAttribute(new Attribute("section", page.section));
    pg.addAttribute(new Attribute("sequence", page.sequence));
    pg.addAttribute(new Attribute("path", page.name));
    pg.addAttribute(new Attribute("preview", page.preview));
    pg.addAttribute(new Attribute("thumb", page.thumb));

    var links = page.inheritedEditions;
    if (links.length > 0) {
        var inheritedPages = new Element("inheritedPages");
        for (var i in links) {
            var edition = links[i];
            var inheritedPage = new Element("inheritedPage");
            inheritedPage.addAttribute(new Attribute("edition", edition));
            inheritedPage.addAttribute(new Attribute("book", edition.replace("PAR", "T")));
            inheritedPages.appendChild(inheritedPage);
        }
        pg.appendChild(inheritedPages);
    }

    var file = page.dstPath + page.name + ".xml";
    // Create the XML Page descriptor
    _print("Writing Page XML: " + file);
    var os = new BufferedOutputStream(new FileOutputStream(file));
    var serializer = new Serializer(os, "UTF-8");
    serializer.setIndent(3);
    serializer.write(new Document(pg));
    os.close();
}

function processStoryXml(page, storyFile) {
    //_print("Process Text : " + storyFile.getName());
    var builder = new Builder();
    var doc = builder.build(storyFile);

    var text = getValue(doc, "/story/content") + "";

    //  if ( page.pn == "1" && text.length < 300 && text.indexOf("ANDORRE") >= 0 &&  text.indexOf("DOM-TOM") > 0 && 
    //      text.indexOf("BELGIQUE") > 0 && text.indexOf("SUISSE") > 0 && text.indexOf("ESPAGNE") > 0 &&
    //      text.indexOf("GRECE") > 0 && text.indexOf("MAROC") > 0 && text.indexOf("PORTUGAL") > 0 &&
    //      text.indexOf("ZONE CFA") > 0 && text.indexOf("TUNISIE") > 0 ) {
    //
    //     return ;
    //  }

    var mg = new Element("media-groupe");
    var imageNodes = doc.query("/story/metadata/objectLinks/objectLink [@linkType='image']");
    for (var i = 0; i < imageNodes.size(); i++) {
        processImageXml(page.dstPath, new File(DATE_DIR + "/image/" + imageNodes.get(i).getAttributeValue("extRef") + ".xml"));
        mg.appendChild(createMedia(new File(DATE_DIR + "/image/" + imageNodes.get(i).getAttributeValue("extRef") + ".xml")));
    }

    var graphicNodes = doc.query("/story/metadata/objectLinks/objectLink [@linkType='graphic']");
    for (var i = 0; i < graphicNodes.size(); i++) {
        processGraphicXml(page.dstPath, new File(DATE_DIR + "/graphic/" + graphicNodes.get(i).getAttributeValue("extRef") + ".xml"));
    }

    var document = new Element("doc");
    var article = createTexteTag(doc);

    if (mg.getChildCount() > 0) {
        article.appendChild(mg);
    }
    document.appendChild(article);

    var dbMetadata = new Element("dbMetadata");
    var sys = new Element("sys");
    sys.appendChild(createTag("uuid", (getValue(doc, "/story/metadata/extRef") + "")));
    sys.appendChild(createTag("type", "EOM::Story"));
    var props = new Element("props");
    props.appendChild(createTag("templateName", "/SysConfig/LP/Templates/Standard.xml"));
    props.appendChild(createTag("summary", (getValue(doc, "/story/content/text/p") + "")));
    var productInfo = new Element("productInfo");
    productInfo.appendChild(createTag("name", "LeParisien"));
    props.appendChild(productInfo);
    dbMetadata.appendChild(sys);

    var Metadata = new Element("Metadata");
    var General = new Element("General");
    General.appendChild(createTag("DocTitle", (getValue(doc, "/doc/content/title") + "")));
    Metadata.appendChild(General);
    var PubData = new Element("PubData");
    var Paper = new Element("Paper");
    Paper.appendChild(createTag("date_publication", (getValue(doc, "/story/metadata/issueDate") + "")));
    Paper.appendChild(createTag("Product", page.product));
    Paper.appendChild(createTag("Section", page.section));
    Paper.appendChild(createTag("Edition", page.edition));
    Paper.appendChild(createTag("Book", page.book));
    Paper.appendChild(createTag("PageNumber", page.pn));
    Paper.appendChild(createTag("PageName", page.name));

    var links = page.inheritedEditions;
    if (links.length > 0) {
        var inheritedPages = new Element("inheritedPages");
        for (var i in links) {
            var edition = links[i];
            var inheritedPage = new Element("inheritedPage");
            inheritedPage.addAttribute(new Attribute("edition", edition));
            inheritedPage.addAttribute(new Attribute("book", edition.replace("PAR", "T")));
            inheritedPages.appendChild(inheritedPage);
        }
        Paper.appendChild(inheritedPages);
    }
    PubData.appendChild(Paper);
    Metadata.appendChild(PubData);
    dbMetadata.appendChild(Metadata);
    document.appendChild(dbMetadata);

    var file = page.dstPath + "Story_" + storyFile.getName();
    _print("Writing Story: " + file);
    var os = new BufferedOutputStream(new FileOutputStream(file));
    var serializer = new Serializer(os, "UTF-8");
    serializer.setIndent(3);
    serializer.setMaxLength(80);
    serializer.write(new Document(document));
    os.close();
}

function createTexteTag(doc) {

    var nodes = doc.query("/story/content/descendant-or-self::*");
    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        if (node.getChildCount() > 0) {
            var tag = node.getLocalName().toLowerCase();
            if (tag == "heading")
                node.setLocalName("surtitre");
            else if (tag == "title")
                node.setLocalName("titre");
            else if (tag == "subtitle")
                node.setLocalName("soustitre");
            else if (tag == "lead")
                node.setLocalName("chapo");
            else if (tag == "table")
                node.setLocalName("tables");
            else if (tag == "text")
                node.setLocalName("texte");
            else if (tag == "subheading")
                node.setLocalName("intertitre");
            else if (tag == "note")
                node.setLocalName("note");
            else if (tag == "b")
                node.setLocalName("b");
            else if (tag == "i")
                node.setLocalName("i");
            else if (tag == "u")
                node.setLocalName("u");
            else if (tag == "a")
                node.setLocalName("a");
            else if (tag == "p")
                node.setLocalName("p");
            else if (tag == "signature")
                node.setLocalName("signature");
            else if (tag == "sup")
                node.setLocalName("sup");
            else if (tag == "span")
                node.setLocalName("span");
            else
                node.setLocalName("p");
        }
        else {
            node.detach();
        }
    }

    var textNode = new Element("article");
    nodes = doc.query("/story/content/*");
    for (i = 0; i < nodes.size(); i++) {
        node = nodes.get(i);
        if (node.getChildCount() > 0) {
            node.detach();
            textNode.appendChild(node);
        }
    }
    return textNode;
}

function createMedia(imageFile) {
    var builder = new Builder();
    var doc = builder.build(imageFile);

    var media = new Element("media");

    var uriTextNodes = doc.query("/image/content/uri/text()");
    for (var i = 0; i < uriTextNodes.size(); i++) {


        if (uriTextNodes.get(i).getValue().indexOf("_") == -1) {
            media.appendChild(createTag("photo", "Image_" + uriTextNodes.get(i).getValue()));
        }
        if (uriTextNodes.get(i).getValue().indexOf("_p") > 0) {
            media.appendChild(createTag("preview", "Image_" + uriTextNodes.get(i).getValue()));
        }
        if (uriTextNodes.get(i).getValue().indexOf("_t") > 0) {
            media.appendChild(createTag("thumb", "Image_" + uriTextNodes.get(i).getValue()));
        }
    }
    media.appendChild(createTag("legende", (getValue(doc, "/image/content/caption") + "")));
    media.appendChild(doc.query("/image/metadata/iptc"));

    return media;

}

function processGraphicXml(dstPath, graphicFile) {
    var builder = new Builder();
    var doc = builder.build(graphicFile);

    var uriTextNodes = doc.query("/graphic/content/uri/text()");
    for (var i = 0; i < uriTextNodes.size(); i++) {
        FileUtils.copyFile(new File(DATE_DIR + "/graphic/" + uriTextNodes.get(i).getValue()), new File(dstPath + "Graphic_" + uriTextNodes.get(i).getValue()));
    }
}

function processImageXml(dstPath, imageFile) {
    var builder = new Builder();
    var doc = builder.build(imageFile);

    var uriTextNodes = doc.query("/image/content/uri/text()");
    for (var i = 0; i < uriTextNodes.size(); i++) {
        FileUtils.copyFile(new File(DATE_DIR + "/image/" + uriTextNodes.get(i).getValue()), new File(dstPath + "Image_" + uriTextNodes.get(i).getValue()));
    }

}

function copyToError(file, filename) {
    var dstFile = new File(ERROR_DIR, filename);
    _print("copie : " + filename + " vers " + dstFile.getPath());
    FileUtils.copyFile(file, dstFile);
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath);
    if (nodes == null || nodes.size() == 0)
        return "";
    if (nodes.size() > 1)
        _print("xpath: " + xpath + " - multiple values: " + nodes.get(0).getValue())
    return nodes.get(0).getValue();
}

// Create <tag> value </tag>
function createTag(tag, value) {
    var element = new Element(tag);
    element.appendChild(value);
    return element;
}

// 20100927=>27/09/2010 
function getInvertedDate(date) {
    return date.substr(6, 2) + "/" + date.substr(4, 2) + "/" + date.substr(0, 4);
}

// Main
function main() {

    extractZip();

    if (processZip()) {
        processPlanXml();
        cleanDir();
        _print("Process done");
        return _OK;
    }
    else {
        FileUtils.forceDelete(ZIP_DIR);
        return _FAIL;
    }
}

// start & exit
_exit = main();

