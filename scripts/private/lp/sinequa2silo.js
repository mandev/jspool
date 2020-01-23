/* 
 * Emmanuel Deviller
 * 
 * test.js
 */

// importPackage(Packages.java.io)  ;

// _srcDir : the spooled directory (String)
// _srcFile : the file found (SourceFile) 
// Attention aux mots réservés : ex.  file.delete => file["delete"] )
// _exit :  _OK = 0 ; _FAIL = 1 ; _NOP = 2 ; _KEEP = 3 ;

importPackage(Packages.java.io);
importPackage(Packages.java.util);
importPackage(Packages.java.util.concurrent);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.lang);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.com.adlitteram.imageinfo);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.pdftool.utils);
importPackage(Packages.com.adlitteram.pdftool.filters);
importPackage(Packages.com.drew.imaging.jpeg);
importPackage(Packages.com.drew.metadata.iptc);
importPackage(Packages.com.drew.metadata.exif);
importPackage(Packages.java.awt);
importPackage(Packages.java.lang);
importPackage(Packages.java.awt.geom);
importPackage(Packages.nu.xom);

// TODO 

// OK
// conversion PDF => JPEG (graphic + page)
// zipper les dossiers dst
// couper en deux les pages doubles

// Init

var INPUT_DIR = _getValue("INPUT_DIR"); // "C:/tmp/sinequa1/"
var OUTPUT_DIR = "E:/sinequa/";

var GS_EXE = "C:/Program Files (x86)/gs/gs9.07/bin/gswin32c.exe"
//var GS_EXE = "C:/Program Files/gs/gs9.07/bin/gswin64c.exe";
//var GS_EXE = "C:/Program Files/gs/gs9.07/bin/gswin32c.exe";
var CONVERT_EXE = "ext/windows/imagemagick/convert.exe";

var MAX_SIZE = 3000;  // Pixels
var REL_SIZE = 3000;
var PREVIEW_SIZE = 768;
var THUMB_SIZE = 192;

var SEP_ARRAY = [' ', '-', '.'];
var XOM = ScriptUtils.createXomBuilder(false, false);
var DAY, MONTH, YEAR;
var INVDATE, INVDATE2;
var EDITION, BOOK, PAGE;
var IS_BEFORE;

function isBefore() {
    var dxaDate = new Date();
    dxaDate.setFullYear(2012, 10 - 1, 4);   // Date d'arrêt du traitement dxadm
    dxaDate.setHours(0, 0, 0, 0);

    var sinDate = new Date();
    sinDate.setFullYear(YEAR, MONTH - 1, DAY);   // Date de la page traitée 
    sinDate.setHours(0, 0, 0, 0);

    _print("dxaDate: " + dxaDate);
    _print("sinDate: " + sinDate);
    _print("isBefore: " + (sinDate < dxaDate));
    return (sinDate < dxaDate);
}

// Write Element
function writeElement(element, dstFile) {
    //_print("Writing Element to  XML: " + dstFile );
    if (dstFile.exists())
        FileUtils.forceDelete(dstFile);
    if (!dstFile.getParentFile().exists())
        FileUtils.forceMkdir(dstFile.getParentFile());
    var os = new BufferedOutputStream(new FileOutputStream(dstFile));
    var serializer = new Serializer(os, "UTF-8");
    serializer.setIndent(3);
    serializer.write(new Document(element));
    os.close();
}

// Write Graphic
function writeGraphic(graphicFile, storyFile, mediaNode, storyNode, pageNode) {
    _print("writeGraphic: " + graphicFile);

    if (graphicFile.length() < 50000 ||
            graphicFile.length() == 63508 ||
            graphicFile.length() == 106767
            ) {
        _print("writeGraphic: " + graphicFile + " too small - rejected");
        return;
    }

    var outpath = OUTPUT_DIR + INVDATE2;
    var loid = FilenameUtils.getBaseName(graphicFile.getName());

    var imageElement = new Element("graphic");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/SINEQUA"));
    metaElement.appendChild(createElement("issueDate", YEAR + "" + MONTH + "" + DAY));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("product", pageNode.getAttributeValue("product")));
    metaElement.appendChild(createElement("extRef", loid));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", (getValue(storyNode, "dbMetadata/Metadata/PubData/Paper/Section") + "").replace("Rituel", pageNode.getAttributeValue("section"))));
    metaElement.appendChild(catElement);

    var dstPath = outpath + "graphic/" + loid;
    var pdfDstFile = new File(dstPath + ".pdf");
    var previewFile = new File(dstPath + "_preview.jpg");
    var thumbFile = new File(dstPath + "_thumb.jpg");

    var contentElement = new Element("content");
    imageElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", pdfDstFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));
    contentElement.appendChild(createElement("caption", trim(getValue(mediaNode, "legende"))));
    contentElement.appendChild(createElement("credit", trim(getValue(mediaNode, "credit"))));

    convertPdf(graphicFile, pdfDstFile, previewFile, thumbFile, 20);

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", "story"));
    objectLink.addAttribute(new Attribute("extRef", FilenameUtils.getBaseName(storyFile.getName())));
    objectLinks.appendChild(objectLink);

    // Write Image Element
    var dstFile = new File(dstPath + ".xml");
    writeElement(imageElement, dstFile);
}

// Write Image
function writeImage(imageFile, storyFile, mediaNode, storyNode, pageNode) {
    _print("writeImage - write: " + imageFile);

    var outpath = OUTPUT_DIR + INVDATE2;
    var loid = FilenameUtils.getBaseName(imageFile.getName());

    var imageElement = new Element("image");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/SINEQUA"));
    metaElement.appendChild(createElement("issueDate", YEAR + "" + MONTH + "" + DAY));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("product", pageNode.getAttributeValue("product")));
    metaElement.appendChild(createElement("extRef", loid));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", (getValue(storyNode, "dbMetadata/Metadata/PubData/Paper/Section") + "").replace("Rituel", pageNode.getAttributeValue("section"))));
    metaElement.appendChild(catElement);

    var imageInfo = ScriptUtils.getImageInfo(imageFile);
    metaElement.appendChild(createElement("width", imageInfo.getWidth()));
    metaElement.appendChild(createElement("height", imageInfo.getHeight()));

    var iptcData = getIptcData(imageFile);
    var iptc = new Element("iptc");
    iptc.appendChild(createElement("caption", (iptcData != null) ? ScriptUtils.clean(iptcData.caption) : ""));
    iptc.appendChild(createElement("headline", (iptcData != null) ? ScriptUtils.clean(iptcData.headline) : ""));
    iptc.appendChild(createElement("credit", (iptcData != null) ? ScriptUtils.clean(iptcData.credit) : ""));
    iptc.appendChild(createElement("byline", (iptcData != null) ? ScriptUtils.clean(iptcData.byline) : ""));
    iptc.appendChild(createElement("objectname", (iptcData != null) ? ScriptUtils.clean(iptcData.objectname) : ""));
    iptc.appendChild(createElement("datecreated", (iptcData != null) ? ScriptUtils.clean(iptcData.datecreated) : ""));
    iptc.appendChild(createElement("country", (iptcData != null) ? ScriptUtils.clean(iptcData.country) : ""));
    iptc.appendChild(createElement("city", (iptcData != null) ? ScriptUtils.clean(iptcData.city) : ""));
    iptc.appendChild(createElement("special", (iptcData != null) ? ScriptUtils.clean(iptcData.special) : ""));
    iptc.appendChild(createElement("source", (iptcData != null) ? ScriptUtils.clean(iptcData.source) : ""));
    metaElement.appendChild(iptc);

    var dstPath = outpath + "image/" + loid;
    var jpgDstFile = new File(dstPath + ".jpg");
    var previewFile = new File(dstPath + "_preview.jpg");
    var thumbFile = new File(dstPath + "_thumb.jpg");

    var contentElement = new Element("content");
    imageElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", jpgDstFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));

    contentElement.appendChild(createElement("caption", trim(getValue(mediaNode, "legende"))));
    contentElement.appendChild(createElement("credit", trim(getValue(mediaNode, "credit"))));

    // Convert and resize Image to Jpeg
    convertImage(imageFile, jpgDstFile, previewFile, thumbFile);

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", "story"));
    objectLink.addAttribute(new Attribute("extRef", FilenameUtils.getBaseName(storyFile.getName())));
    objectLinks.appendChild(objectLink);

    // Write Image Element
    var dstFile = new File(dstPath + ".xml");
    writeElement(imageElement, dstFile);
}

// Process Tags
function processTags(nodes) {

    // Copy Nodes
    var nodesArray = new Array();
    for (var i = 0; i < nodes.size(); i++) {
        nodesArray[i] = nodes.get(i);
    }

    for (var i = 0; i < nodesArray.length; i++) {
        var node = nodesArray[i];

        if (node.getChildCount() > 0) {
            var tag = node.getLocalName().toLowerCase();
            if (tag == "surtitre") {
                setNodeName(node, "heading");
            }
            else if (tag == "titre") {
                setNodeName(node, "title");
            }
            else if (tag == "soustitre") {
                setNodeName(node, "subtitle");
            }
            else if (tag == "chapo") {
                setNodeName(node, "lead");
            }
            else if (tag == "description") {
                var txt = trim(node.getValue()) + "";
                if (txt.length == 0) {
                    node.getParent().removeChild(node);
                }
                else {
                    setNodeName(node, "description");
                }
            }
            else if (tag == "tables") {
                setNodeName(node, "table");
            }
            else if (tag == "texte") {
                setNodeName(node, "text");
            }
            else if (tag == "intertitre") {
                setNodeName(node, "subheading");
            }
            else if (tag == "note") {
                setNodeName(node, "note");
            }
            else if (tag == "b" || tag == "correspondant" || tag == "graspuce" || tag == "mot-cle") {
                setNodeName(node, "b");
            }
            else if (tag == "i") {
                setNodeName(node, "i");
            }
            else if (tag == "u") {
                setNodeName(node, "u");
            }
            else if (tag == "a") {
                var classAttr = node.getAttribute("class");
                if (classAttr != null)
                    node.removeAttribute(classAttr);
                //setNodeName(node, "u");
            }
            else if (tag == "question") {
                setNodeName(node, "p");
                node.addAttribute(new Attribute("type", "question"));
            }
            else if (tag == "signature") {
                var txt = WordUtils.capitalizeFully(trim(node.getValue()), SEP_ARRAY) + "";
                if (txt.length == 0) {
                    node.getParent().removeChild(node);
                }
                else {
                    var signNode = new Element("signature");
                    txt = txt.replace(/propos recueillis par/i, "Propos recueillis par");
                    txt = txt.replace(/ et /i, " et ");
                    txt = txt.replace(/ avec /i, " avec ");
                    signNode.appendChild(txt);
                    node.getParent().replaceChild(node, signNode);
                }
            }
            else if (tag == "sup") {
                setNodeName(node, "sup");
            }
            else if (tag == "ld") {
                node.getParent().removeChild(node);
            }
            else if (tag == "span") {
                var classAttr = node.getAttribute("class");
                var styleAttr = node.getAttribute("style");

                if (classAttr != null && (classAttr.getValue() + "") == "RESCOL") {
                    var txt = new Packages.nu.xom.Text(WordUtils.capitalize(node.getValue(), SEP_ARRAY));
                    //var txt = trim(node.getValue()) + "";
                    node.getParent().replaceChild(node, txt);
                }
                else if (classAttr != null && (classAttr.getValue() + "") == "TMG_Puce_ronde") {
                    node.getParent().replaceChild(node, new Packages.nu.xom.Text("-"));
                }
                else if (styleAttr != null && styleAttr.getValue().contains("font-family:'EuropeanPi-Three';")
                        && trim(node.getValue()) == "L") {
                    //node.getParent().replaceChild(node, new Text("?"));
                    node.getParent().removeChild(node);
                }
                else {
                    var parent = node.getParent();
                    var idx = parent.indexOf(node);
                    for (var j = node.getChildCount() - 1; j >= 0; j--) {
                        var child = node.getChild(j);
                        child.detach();
                        parent.insertChild(child, idx);
                    }
                    node.detach();
                }
                //_print("attr: " + attr);
                //setNodeName(node, "SPAN");
            }
            else {
                setNodeName(node, "p");
            }
        }
        else {
            var tag = node.getLocalName().toLowerCase();
            if (tag == "br") {
                var t = new Packages.nu.xom.Text(" ");
                node.getParent().replaceChild(node, t);
            }
            else
                node.detach();
        }
    }
}

function addToElement(nodes, node) {
    var value = "";
    for (var i = 0; i < nodes.size(); i++) {
        var n = nodes.get(i);
        n.detach();
        if (n.getChildCount() > 0) {
            value += n.getValue() + " ";
        }
    }
    var t = new Packages.nu.xom.Text(capFirst(trim(value)));
    node.appendChild(t);
    return node;
}

function createHeadingTag(itemNode) {
//    processTags(itemNode.query("doc/article/titraille/surtitre/descendant-or-self::*"));
//    return addToElement(itemNode.query("doc/article/titraille/heading/*"), new Element("heading"))

    var nodes = itemNode.query("article/titraille/surtitre/descendant-or-self::*");
    processTags(nodes);

    var headingNode = new Element("heading");

    nodes = itemNode.query("article/titraille/heading/*");
    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        if (node.getChildCount() > 0) {
            node.detach();
            headingNode.appendChild(node);
        }
    }
    return headingNode;
}

function createTitleTag(itemNode) {
    processTags(itemNode.query("article/titraille/titre/descendant-or-self::*"));
    return addToElement(itemNode.query("article/titraille/title/*"), new Element("title"));
}

function createSubTitleTag(itemNode) {
    processTags(itemNode.query("article/titraille/soustitre/descendant-or-self::*"));
    return addToElement(itemNode.query("article/titraille/subtitle/*"), new Element("subtitle"));
}

function createLeadTag(itemNode) {
    processTags(itemNode.query("article/titraille/chapo/descendant-or-self::*"));
    return addToElement(itemNode.query("article/titraille/lead/*"), new Element("lead"));
}

function createTexteTag(itemNode) {

    var nodes = itemNode.query("article/texte/descendant-or-self::* | article/tables/descendant-or-self::*");
    processTags(nodes);

    var textNode = new Element("text");

    nodes = itemNode.query("article/text");
    var size = nodes.size();

    // Special processing for course performance tabs
    if (size > 4) {
        _print("createTexteTag - multi text nodes - size: " + size);
        nodes = itemNode.query("article/text/*");
        for (var i = 0; i < nodes.size(); i++) {
            var node = nodes.get(i);
            if (node.getChildCount() > 0) {
                node.detach();
                textNode.appendChild(node);
            }
        }
    }
    else {
        var maxLen = 0;
        var maxInd = 0;
        // delete relance by keeping the max text node length
        if (size > 1) {
            _print("createTexteTag - multi text nodes - size: " + size);
            for (var i = 0; i < size; i++) {
                var len = nodes.get(i).getValue().length();
                if (len > maxLen) {
                    maxLen = len;
                    maxInd = i;
                }
            }
            _print("createTexteTag - taking text node #" + (maxInd + 1));
        }

        if (maxInd < size) {
            nodes = itemNode.query("article/text[" + (maxInd + 1) + "]/*");
            for (var i = 0; i < nodes.size(); i++) {
                var node = nodes.get(i);
                if (node.getChildCount() > 0) {
                    node.detach();
                    textNode.appendChild(node);
                }
            }
        }
    }
    return textNode;
}

// Build XML & write story
function writeStory(storyFile, pageNode, editions) {
    _print("writeStory - write: " + storyFile);

    var outpath = OUTPUT_DIR + INVDATE2;
    var loid = FilenameUtils.getBaseName(storyFile.getName());

    var storyDoc = XOM.build(storyFile);
    var storyNode = storyDoc.getRootElement();

    var charsCountElt = createElement("charsCount", getValue(storyNode, "dbMetadata/sys/props/charsCount"));
    var wordCountElt = createElement("wordCount", getValue(storyNode, "dbMetadata/sys/props/wordCount"));

    // Create XML
    var storyElement = new Element("story");
    var metaElement = new Element("metadata");
    storyElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/SINEQUA"));
    metaElement.appendChild(createElement("issueDate", YEAR + "" + MONTH + "" + DAY));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("product", pageNode.getAttributeValue("product")));
    metaElement.appendChild(createElement("extRef", loid));
    metaElement.appendChild(charsCountElt);
    metaElement.appendChild(wordCountElt);
    metaElement.appendChild(createElement("city", getValue(storyNode, "dbMetadata/Metadata/General/GeographicalPlaces/City_Name")));
    metaElement.appendChild(createElement("country", getValue(storyNode, "dbMetadata/Metadata/General/GeographicalPlaces/Country")));
    metaElement.appendChild(createElement("address", getValue(storyNode, "dbMetadata/Metadata/General/GeographicalPlaces/Address")));

//    var editionsElement = new Element("editions");
    metaElement.appendChild(editions.copy());

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", (getValue(storyNode, "dbMetadata/Metadata/PubData/Paper/Section") + "").replace("Rituel", pageNode.getAttributeValue("section"))));
    metaElement.appendChild(catElement);

    var keyElement = new Element("keywords");
    keyElement.appendChild(createElement("keyword", getValue(storyNode, "dbMetadata/Metadata/General/DocKeyword") + ""));
    metaElement.appendChild(keyElement);

    var txt = trim(getValue(storyNode, "dbMetadata/Metadata/General/DocAuthor")) + "";
    var creatorElement = (txt.length > 0 && txt != "system") ? createElement("creator", txt) : new Element("creator");
    metaElement.appendChild(creatorElement);

    var authorsElement = new Element("authors");
    metaElement.appendChild(authorsElement);

    // Publication channel
    var webElement = new Element("webChannel");
    metaElement.appendChild(webElement);
    webElement.appendChild(createElement("status", getValue(storyNode, "dbMetadata/Metadata/PubData/Web/Status") + ""));
    webElement.appendChild(createElement("comment", getValue(storyNode, "dbMetadata/Metadata/PubData/Web/Comment") + ""));
    webElement.appendChild(createElement("profile", getValue(storyNode, "dbMetadata/Metadata/PubData/Web/Profile") + ""));
    webElement.appendChild(createElement("priority", getValue(storyNode, "dbMetadata/Metadata/PubData/Digital/Priority") + ""));

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    // Add page link 
    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", "page"));
    objectLink.addAttribute(new Attribute("extRef", FilenameUtils.getBaseName(pageNode.getAttributeValue("path"))));
    objectLinks.appendChild(objectLink);

    // Add image link
    var mediaNodes = storyNode.query("article/media-groupe/media");
    for (var i = 0; i < mediaNodes.size(); i++) {
        var mediaNode = mediaNodes.get(i);
        var imageName = getValue(mediaNode, "photo");
        if (imageName.startsWith("IMAGE_") && imageName.endsWith(".jpg")) {
            var objectLink = new Element("objectLink");
            objectLink.addAttribute(new Attribute("linkType", "image"));
            objectLink.addAttribute(new Attribute("extRef", FilenameUtils.getBaseName(imageName)));
            objectLinks.appendChild(objectLink);
            writeImage(new File(storyFile.getParentFile(), imageName), storyFile, mediaNode, storyNode, pageNode);
        }
        else if (imageName.startsWith("IMAGE_") && imageName.endsWith(".pdf")) {
            var objectLink = new Element("objectLink");
            objectLink.addAttribute(new Attribute("linkType", "graphic"));
            objectLink.addAttribute(new Attribute("extRef", FilenameUtils.getBaseName(imageName)));
            objectLinks.appendChild(objectLink);
            writeGraphic(new File(storyFile.getParentFile(), imageName), storyFile, mediaNode, storyNode, pageNode);
        }
    }

    var contentElement = new Element("content");
    storyElement.appendChild(contentElement);
    contentElement.appendChild(createHeadingTag(storyNode));
    contentElement.appendChild(createTitleTag(storyNode));
    contentElement.appendChild(createSubTitleTag(storyNode));
    contentElement.appendChild(createLeadTag(storyNode));
    contentElement.appendChild(createTexteTag(storyNode));

    // Reprocess CharCount & WordCount
    var cntValue = contentElement.getValue() + "";
    charsCountElt.getChild(0).setValue(cntValue.length);
    wordCountElt.getChild(0).setValue(cntValue.length == 0 ? 0 : cntValue.split(' ').length);

    // Reprocess Signature
    var signNodes = contentElement.query("//signature");
    for (var i = 0; i < signNodes.size(); i++) {
        var signNode = signNodes.get(i);
        var txt = trim(signNode.getValue()) + "";
        txt = txt.replace(/propos recueillis par/i, "");
        txt = txt.replace(/(.*)\(.*\)(.*)/i, "$1$2");
        txt = txt.replace(/^et /i, "");
        txt = txt.replace(/^avec /i, "");
        txt = txt.replace(/ et /i, " et ");
        txt = txt.replace(/,/i, " et ");
        txt = txt.replace(/ avec /i, " et ");
        var authors = txt.split(" et ");
        for (var j in authors) {
            var txt = trim(authors[j]);
            if (txt.length > 0)
                authorsElement.appendChild(createElement("author", txt));
        }
    }

    if (authorsElement.getChildCount() == 0) {
        var txt = trim(getValue(storyNode, "dbMetadata/Metadata/General/Custom_by-line")) + "";
        txt = txt.replace(/propos recueillis par/i, "");
        txt = txt.replace(/(.*)\(.*\)(.*)/i, "$1$2");
        txt = txt.replace(/^et /i, "");
        txt = txt.replace(/^avec /i, "");
        txt = txt.replace(/ et /i, " et ");
        txt = txt.replace(/,/i, " et ");
        txt = txt.replace(/ avec /i, " et ");
        var authors = txt.split(" et ");
        for (var j in authors) {
            txt = trim(authors[j]);
            if (txt.length > 0)
                authorsElement.appendChild(createElement("author", txt));
        }
    }

    // Write Story
    var dstFile = new File(outpath + "story/" + loid + ".xml");
    writeElement(storyElement, dstFile);
}

function writePage(file, files) {
    _print("writePage: " + file);

    var pageDir = file.getParentFile();
    var outpath = OUTPUT_DIR + INVDATE2;

    var pageDoc = XOM.build(file);
    var pageNode = pageDoc.getRootElement();
    var path = pageNode.getAttributeValue("path");
    var loid = FilenameUtils.getBaseName(path);

    var pageElement = new Element("page");
    var metaElement = new Element("metadata");
    pageElement.appendChild(metaElement);

    // Base Meta
    metaElement.appendChild(createElement("source", "LEPARISIEN/SINEQUA"));
    metaElement.appendChild(createElement("extRef", loid));
    metaElement.appendChild(createElement("issueDate", YEAR + "" + MONTH + "" + DAY));
    metaElement.appendChild(createElement("permission", 0));

    // Extra meta
    metaElement.appendChild(createElement("product", pageNode.getAttributeValue("product")));
    metaElement.appendChild(createElement("book", pageNode.getAttributeValue("book")));
    metaElement.appendChild(createElement("pn", pageNode.getAttributeValue("pn")));
    metaElement.appendChild(createElement("sequence", pageNode.getAttributeValue("sequence")));
    metaElement.appendChild(createElement("color", pageNode.getAttributeValue("color")));

    var editions = new Element("editions");
    editions.appendChild(createElement("edition", pageNode.getAttributeValue("edition")));
    metaElement.appendChild(editions);

    var categories = new Element("categories");
    categories.appendChild(createElement("category", pageNode.getAttributeValue("section")));
    metaElement.appendChild(categories);

    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var inheritedNodes = pageDoc.query("/page/inheritedPages/inheritedPage");
    if (inheritedNodes.size() > 0) {
        var virtualPagesElement = new Element("virtualPages");
        for (var i = 0; i < inheritedNodes.size(); i++) {
            var virtualPageElement = new Element("virtualPage");
            var linkedPage = inheritedNodes.get(i);
            editions.appendChild(createElement("edition", linkedPage.getAttributeValue("edition")));

            virtualPageElement.addAttribute(new Attribute("product", linkedPage.getAttributeValue("product")));
            virtualPageElement.addAttribute(new Attribute("edition", linkedPage.getAttributeValue("edition")));
            virtualPageElement.addAttribute(new Attribute("book", linkedPage.getAttributeValue("book")));
            virtualPageElement.addAttribute(new Attribute("pn", linkedPage.getAttributeValue("pn")));
            virtualPageElement.addAttribute(new Attribute("sequence", linkedPage.getAttributeValue("sequence")));
            virtualPageElement.addAttribute(new Attribute("color", linkedPage.getAttributeValue("color")));
            virtualPagesElement.appendChild(virtualPageElement);
        }
        metaElement.appendChild(virtualPagesElement);
    }

    var contentElement = new Element("content");
    pageElement.appendChild(contentElement);

    var hasStory = false;
    for (var i = 0; i < files.length; i++) {
        var sfile = files[i];
        var sfilename = sfile.getName();

        if (sfilename.startsWith("STORY_") && sfilename.endsWith(".xml")) {
            var objectLink = new Element("objectLink");
            objectLink.addAttribute(new Attribute("linkType", "story"));
            objectLink.addAttribute(new Attribute("extRef", FilenameUtils.getBaseName(sfilename)));
            objectLinks.appendChild(objectLink);
            // Traiter story
            writeStory(sfile, pageNode, editions);
            hasStory = true;
        }
    }

    if (IS_BEFORE && !hasStory) {
        _print("writePage: " + file + " not processed - dxadm page");
        return;
    }

    // Write PDF & JPEG
    var suffix = (pageNode.getAttributeValue("pn").contains(",")) ? "_full" : "";
    var dPath = outpath + "page/" + loid;
    var pdfSrcFile = new File(pageDir, path);
    if (pdfSrcFile.exists()) {
        var pdfDstFile = new File(dPath + suffix + ".pdf");
        var previewFile = new File(dPath + suffix + "_preview.jpg");
        var thumbFile = new File(dPath + suffix + "_thumb.jpg");
        contentElement.appendChild(createElement("uri", pdfDstFile.getName()));
        contentElement.appendChild(createElement("uri", previewFile.getName()));
        contentElement.appendChild(createElement("uri", thumbFile.getName()));
        convertPdf(pdfSrcFile, pdfDstFile, previewFile, thumbFile, 20);
    }
    else {
        _print("Le fichier PDF " + pdfSrcFile + " n'existe pas!");
    }

    if (pageNode.getAttributeValue("pn").contains(",")) {
        splitPdfPlate(pdfSrcFile, dPath, contentElement);
    }

    // Write Page
    var dstFile = new File(outpath + "page/" + loid + ".xml");
    writeElement(pageElement, dstFile);
}

function parsePage(pageFile) {
    _print("parsePage() : " + pageFile + " - " + EDITION + " - " + BOOK + " - " + PAGE);

    var files = pageFile.listFiles();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var filename = file.getName();
        if (filename.startsWith("PAGE_") && filename.endsWith(".xml")) {
            writePage(file, files);
        }
    }
}

function parseProduct(prodFile) {
    _print("parseProduct() : " + prodFile + " - " + YEAR + "/" + MONTH + "/" + DAY);

    var files = prodFile.listFiles();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.isDirectory()) {
            EDITION = file.getName();
            var files1 = file.listFiles();
            for (var j = 0; j < files1.length; j++) {
                var file1 = files1[j];
                if (file1.isDirectory()) {
                    BOOK = file1.getName();
                    var files2 = file1.listFiles();
                    for (var k = 0; k < files2.length; k++) {
                        var file2 = files2[k];
                        if (file2.isDirectory()) {
                            PAGE = file2.getName();
                            parsePage(file2);
                        }
                    }
                }
            }
        }
    }

    // Zip the ouput dir
//    var outFile = new File(OUTPUT_DIR + INVDATE);
//    var zipFile = new File(OUTPUT_DIR + INVDATE + "_LEPARISIEN.zip");
//    _print("parseProduct() : zipping " + outFile);
//    ScriptUtils.zipDirToFile(outFile, zipFile);
//    FileUtils.forceDelete(outFile);
}

function parseDir() {
    _print("Starting...");
    var files = new File(INPUT_DIR).listFiles();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.isDirectory()) {
            YEAR = file.getName();
            var files1 = file.listFiles();
            for (var j = 0; j < files1.length; j++) {
                var file1 = files1[j];
                if (file1.isDirectory()) {
                    MONTH = file1.getName();
                    var files2 = file1.listFiles();
                    for (var k = 0; k < files2.length; k++) {
                        var file2 = files2[k];
                        if (file2.isDirectory()) {
                            DAY = file2.getName();

                            INVDATE = YEAR + "" + MONTH + "" + DAY;
                            INVDATE2 = INVDATE + "/" + INVDATE + "/";
                            IS_BEFORE = isBefore();

                            var files3 = file2.listFiles();
                            for (var m = 0; m < files3.length; m++) {
                                var file3 = files3[m];
                                if (file3.getName() == "LP") {
                                    parseProduct(file3);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    _print("Done.");
}

// Get Some IPTC values
function getIptcData(file) {
    // Jpeg Only
    var iptcDir = null;
    try {
        var metadata = JpegMetadataReader.readMetadata(file);
        iptcDir = ScriptUtils.getIptcDirectory(metadata);
        if (iptcDir != null) {
            var iptcData = new Object();
            iptcData.caption = nonNull(iptcDir.getString(IptcDirectory.TAG_CAPTION));
            iptcData.headline = nonNull(iptcDir.getString(IptcDirectory.TAG_HEADLINE));
            iptcData.credit = nonNull(iptcDir.getString(IptcDirectory.TAG_CREDIT));
            iptcData.byline = nonNull(iptcDir.getString(IptcDirectory.TAG_BY_LINE));
            iptcData.objectname = nonNull(iptcDir.getString(IptcDirectory.TAG_OBJECT_NAME));
            iptcData.datecreated = nonNull(iptcDir.getString(IptcDirectory.TAG_DATE_CREATED));
            iptcData.country = nonNull(iptcDir.getString(IptcDirectory.TAG_COUNTRY_OR_PRIMARY_LOCATION_NAME));
            iptcData.city = nonNull(iptcDir.getString(IptcDirectory.TAG_CITY));
            iptcData.special = nonNull(iptcDir.getString(IptcDirectory.TAG_SPECIAL_INSTRUCTIONS));
            iptcData.source = nonNull(iptcDir.getString(IptcDirectory.TAG_SOURCE));
            return iptcData;
        }
    }
    catch (e) {
        _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
        _print("Error parsing iptc: " + file);
    }
    return iptcDir;
}

function nonNull(value) {
    return (value == null) ? "" : value;
}

function capFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Trim string
function trim(str) {
    if (str == null)
        return null;
    str += "";
    return str.replace(/^\s+/g, '').replace(/\s+$/g, '');
}

function setNodeName(node, newName) {
    for (var i = node.getAttributeCount() - 1; i >= 0; i--) {
        var attr = node.getAttribute(i);
        //_print("node :" + node.getQualifiedName() + " attribut: " + attr);
        node.removeAttribute(attr);
    }
    node.setLocalName(newName);
}

function insertNode(node, newTag, newName) {
    var newNode = new Element(newTag);
    node.getParent().replaceChild(node, newNode);
    newNode.appendChild(node);
    node.setLocalName(newName);
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath);
    if (nodes == null || nodes.size() == 0)
        return "";
    if (nodes.size() > 1)
        _print("xpath: " + xpath + " - multiple values: " + nodes.get(0).getValue());
    return nodes.get(0).getValue();
}

// Create <tag> value </tag>
function createElement(tag, value) {
    var element = new Element(tag);
    element.appendChild(value);
    return element;
}

function convertImage(srcFile, dstFile, previewFile, thumbFile) {
    // return;

    if (dstFile.exists() || previewFile.exists() || thumbFile.exists()) {
        _print("convertImage: traitement en cours");
        return;
    }

    // Convert non jpeg image
    var opt = [srcFile.getPath(), "-resize", REL_SIZE + "x" + REL_SIZE + ">", dstFile.getPath()];
    _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent());
    _exec(CONVERT_EXE, opt, dstFile.getParent(), 300000); // creates also parent directory

    // PREVIEW
    if (dstFile.exists()) {
        var opt = [dstFile.getPath(), "-resize", PREVIEW_SIZE + "x" + PREVIEW_SIZE + ">", previewFile.getPath()];
        _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent());
        _exec(CONVERT_EXE, opt, dstFile.getParent(), 300000); // creates also parent directory
    }

    // THUMB
    if (previewFile.exists()) {
        var opt = [previewFile.getPath(), "-resize", THUMB_SIZE + "x" + THUMB_SIZE + ">", thumbFile.getPath()];
        _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent());
        _exec(CONVERT_EXE, opt, dstFile.getParent(), 300000); // creates also parent directory
    }
}

function convertPdf(srcFile, dstFile, previewFile, thumbFile, res) {
    // return;

//    if (dstFile.exists() || previewFile.exists() || thumbFile.exists()) {
//        _print("convertPdf: traitement en cours");
//        return;
//    }

    var tmpFile = File.createTempFile("page_", ".jpg");
    tmpFile.deleteOnExit();

    // TMP JPEG
    var opt = ["-q", "-dNOPROMPT", "-dBATCH", "-dNOPAUSE", "-dUseCIEColor", "-sDEVICE=jpeg",
        "-dJPEGQ=85", "-dTextAlphaBits=4", "-dGraphicsAlphaBits=4", "-r180", "-o",
        tmpFile.getPath(), srcFile.getPath()];
    _print("Launching " + GS_EXE + " " + opt + " dir: " + dstFile.getParent());
    _exec(GS_EXE, opt, dstFile.getParent(), 300000); // creates also parent directory

    // PREVIEW
    if (tmpFile.exists()) {
        opt = [tmpFile.getPath(), "-resize", PREVIEW_SIZE + "x" + PREVIEW_SIZE + ">", previewFile.getPath()];
        _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent());
        _exec(CONVERT_EXE, opt, dstFile.getParent(), 300000); // creates also parent directory
    }

    // THUMB
    if (previewFile.exists()) {
        opt = [previewFile.getPath(), "-resize", THUMB_SIZE + "x" + THUMB_SIZE + ">", thumbFile.getPath()];
        _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent());
        _exec(CONVERT_EXE, opt, dstFile.getParent(), 300000); // creates also parent directory
    }

    FileUtils.deleteQuietly(tmpFile);
    if (srcFile.getPath() != dstFile.getPath())
        FileUtils.copyFile(srcFile, dstFile);
}

function convertToPdf(file) {
    var tmpFile = File.createTempFile("tmp_", ".pdf", file.getParentFile());
    tmpFile.deleteOnExit();

    //var opt = "-q -dNOPROMPT -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dAutoRotatePages=/None -dDownsampleColorImages=false -o " ;
    //var opt = "-q -dNOPROMPT -dCompatibilityLevel=1.4 -d -dUseCIEColor -dColorConversionStrategy=/sRGB -dProcessColorModel=/DeviceRGB -sDEVICE=pdfwrite -o " ;
    var opt = ["-q", "-dNOPROMPT", "-dBATCH", "-dNOPAUSE", "-dCompatibilityLevel=1.4",
        "-dAutoRotatePages=/None", "-sDEVICE=pdfwrite", "-o", tmpFile.getPath(), file.getPath()];

    _print("Launching " + GS_EXE + " " + opt + " dir: " + file.getParent());
    _exec(GS_EXE, opt, file.getParent(), 300000); // creates also parent directory

    FileUtils.deleteQuietly(file);
    FileUtils.moveFile(tmpFile, file);
}

// Split the plate into 2 pages
function splitPdfPlate(file, dPath, contentElement) {
    _print("splitPdfPlate(): " + file);

    var leftPdfFile = new File(dPath + "_left.pdf");
    var previewFile = new File(dPath + "_left_preview.jpg");
    var thumbFile = new File(dPath + "_left_thumb.jpg");

    contentElement.appendChild(createElement("uri", leftPdfFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));

    FileUtils.copyFile(file, leftPdfFile);
    var pdfTool = new PdfTool();
    pdfTool.addFilter(new CropMargin(leftPdfFile.getPath(), 0 * NumUtils.MMtoPT, 0 * NumUtils.MMtoPT, 0 * NumUtils.MMtoPT, 280 * NumUtils.MMtoPT));
    pdfTool.execute(leftPdfFile);
    convertToPdf(leftPdfFile);
    convertPdf(leftPdfFile, leftPdfFile, previewFile, thumbFile, 20);

    var rightPdfFile = new File(dPath + "_right.pdf");
    var previewFile = new File(dPath + "_right_preview.jpg");
    var thumbFile = new File(dPath + "_right_thumb.jpg");

    contentElement.appendChild(createElement("uri", rightPdfFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));

    FileUtils.copyFile(file, rightPdfFile);
    pdfTool = new PdfTool();
    pdfTool.addFilter(new CropMargin(rightPdfFile.getPath(), 280 * NumUtils.MMtoPT, 0 * NumUtils.MMtoPT, 0 * NumUtils.MMtoPT, 0 * NumUtils.MMtoPT));
    pdfTool.execute(rightPdfFile);
    convertToPdf(rightPdfFile);
    convertPdf(rightPdfFile, rightPdfFile, previewFile, thumbFile, 20);
}

// Main
function main() {
    parseDir();
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



