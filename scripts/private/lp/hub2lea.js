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
importPackage(Packages.java.util);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.lang);
importPackage(Packages.nu.xom);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.imageinfo);
importPackage(Packages.com.drew.imaging.jpeg);
importPackage(Packages.com.drew.metadata.iptc);
importPackage(Packages.com.drew.metadata.exif);
importPackage(Packages.org.apache.commons.mail);
importPackage(Packages.org.xml.sax);
importPackage(Packages.org.xml.sax.helpers);

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());
PRODUCT = _getValue("PRODUCT");
STAGING_DIR = "/home/maintenance/spool/staging/" + PRODUCT + "/";
OUTPUT_DIR = "/home/maintenance/spool/output/" + PRODUCT + "/";
ZIPOUT_DIR = "/home/maintenance/spool/zipoutweb/" + PRODUCT + "/";
ERROR_DIR = "/home/maintenance/spool/error/" + PRODUCT + "/";

GS_PATH = "/opt/ghostscript-9.05/bin/gs";
MAX_SIZE = 1280;  // Pixels
REL_SIZE = 1280;
PREVIEW_SIZE = 768;
THUMB_SIZE = 192;

var ZIP_DIR;
var OUTPUT_NAME;
var SEP_ARRAY = [' ', '-', '.'];
var TO_REPLACE = ["&#0;", "&#1;", "&#2;", "&#3;", "&#4;", "&#5;", "&#6;", "&#7;", "&#8;", "&#9;", "&#10;"]; // par ""
var TO_REPLACE2 = ["&#8239;", "&#8201;", "&#160;"]; // par " "

// Unzip archive
function extractZip() {
    _print("Extracting Zip file");
    ZIP_DIR = new File(STAGING_DIR, _srcFile.getName() + "_dir");
    _print("ZIP_DIR: " + ZIP_DIR);

    if (ZIP_DIR.exists())
        FileUtils.forceDelete(ZIP_DIR);

    if (!ZIP_DIR.exists())
        ScriptUtils.unzipFileToDir(_srcFile.getFile(), ZIP_DIR);

    _print("Extracting Zip file done");
}

// Zip archive
function buildZip() {
    _print("Building Zip file");
    var OUT_DIR = new File(OUTPUT_DIR);
    _print("OUT_DIR: " + OUT_DIR);
    if (OUT_DIR.exists()) {
        var ZIP_FILE = new File(ZIPOUT_DIR + OUTPUT_NAME + ".zip");
        _print("ZIP_FILE: " + ZIP_FILE);
        ScriptUtils.zipDirToFile(OUT_DIR, ZIP_FILE);
        FileUtils.forceDelete(OUT_DIR);
    }
    else {
        _print("Error: the directory " + OUT_DIR + " does not exist");
        var dstFile = new File(ERROR_DIR, _srcFile.getName());
        _print("Copy " + _srcFile.getName() + " to " + dstFile.getPath());
        FileUtils.copyFile(_srcFile.getFile(), dstFile);
    }
    FileUtils.forceDelete(new File(STAGING_DIR, _srcFile.getName() + "_dir"));
    _print("Building Zip file done");
}

// Delete ZIP_DIR
function deleteZipDir() {
    _print("Purging " + ZIP_DIR);
    if (ZIP_DIR.exists())
        FileUtils.forceDelete(ZIP_DIR);
}

// Process zip and set global variables
function processZip() {
    _print("Processing Zip File");

    // Process du contenu du zip avec le structure.cfg
    var file = new File(ZIP_DIR + "/structure.cfg");

    var builder = new Builder();
    var doc = builder.build(new InputStreamReader(new FileInputStream(file), "UTF-8"));
    var packageNode = doc.getRootElement();

    var type = '';
    var fileNodes = packageNode.query("file");
    var captionIndex = 1;
    var mainNode = null;
    var linkedItems = new Array();

    for (var i = 0; i < fileNodes.size(); i++) {
        var fileNode = fileNodes.get(i);
        var fileName = fileNode.getAttributeValue("name");

        // Si le fichier est un XML
        if (fileName.indexOf(".xml") >= 0) {
            OUTPUT_NAME = (new Date()).getTime();
            type = fileNode.getAttributeValue("type");
            mainNode = fileNode;
        }
        // Si le fichier est autre qu'un XML
        else if (fileName.indexOf(".jpg") >= 0) {
            var imageItem = createItem(fileNode.getAttributeValue("type"), fileName, fileNode, captionIndex++);
            linkedItems.push(imageItem);
        }
    }

    if ( type == null ) type = "story" ;

    writeStory(type, mainNode, linkedItems);
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

function createItem(linkType, path, fileNode, index) {
    //_print("createItem");
    var isValid = true;
    return {
        linkType: linkType,
        path: path, // not valid for story !
        fileNode: fileNode,
        index: index,
        isValid: isValid,
        items: new Array() // Array of items        
    };
}

// Build XML & write story
function writeStory(type, storyNode, linkedItems) {

    // Create XML
    var storyElement = new Element(type);
    var metaElement = new Element("metadata");
    storyElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/MAG"));
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "extMetadata/IssueDate")));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("extRef", ''));
    metaElement.appendChild(createElement("charsCount", ''));
    metaElement.appendChild(createElement("wordCount", ''));
    metaElement.appendChild(createElement("city", getValue(storyNode, "extMetadata/City")));
    metaElement.appendChild(createElement("country", getValue(storyNode, "extMetadata/Country")));
    metaElement.appendChild(createElement("address", getValue(storyNode, "extMetadata/Address")));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(storyNode, "extMetadata/DbPath") + ""));
    metaElement.appendChild(catElement);

    var keyElement = new Element("keywords");
    keyElement.appendChild(createElement("keyword", getValue(storyNode, "extMetadata/Keyword") + ""));
    metaElement.appendChild(keyElement);

    var authorsElement = new Element("authors");
    var txt = trim(getValue(storyNode, "extMetadata/Author")) + "";
    txt = txt.replace(/propos recueillis par/i, "");
    txt = WordUtils.capitalize(txt) + "";
    txt = txt.replace(/ et /i, " et ");
    txt = txt.replace(/ avec /i, " avec ");
    var authors = txt.split(" et ");
    for (var j in authors) {
        authorsElement.appendChild(createElement("author", authors[j]));
    }
    metaElement.appendChild(authorsElement);

    // Publication channel
    var webElement = new Element("webChannel");
    metaElement.appendChild(webElement);

    webElement.appendChild(createElement("status", getValue(storyNode, "extMetadata/Status") + ""));
    webElement.appendChild(createElement("comment", getValue(storyNode, "extMetadata/Comment") + ""));
    webElement.appendChild(createElement("profile", ""));
    webElement.appendChild(createElement("position", ""));
    webElement.appendChild(createElement("priority", ""));
    var topicsList = getValue(storyNode, "extMetadata/TopicsList") + "";
    var topics = topicsList.split('\*');
    var topicsElement = new Element("topics");
    for (var l = 0; l < topics.length - 1; l++) {
        topicsElement.appendChild(createElement("topic", topics[l] + ""));
    }
    webElement.appendChild(topicsElement);

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    for (var k in linkedItems) {
        var item = linkedItems[k];
        if (item.isValid) {
            var objectLink = new Element("objectLink");
            objectLink.addAttribute(new Attribute("linkType", item.linkType));
            objectLink.addAttribute(new Attribute("extRef", item.path));
            objectLinks.appendChild(objectLink);
            if (item.linkType == "image")
                writeImage(type, item, storyNode);
            else if (item.linkType == "graphic")
                writeGraphic(type, item, storyNode);
            else if (item.linkType == "video")
                writeVideo(type, item, storyNode);
        }
    }

    var file = new File(ZIP_DIR + "/" + storyNode.getAttributeValue("name"));
    _print("Cleaning File: " + file.getPath());
    var content = FileUtils.readFileToString(file, "UTF-8");
    for (var i in TO_REPLACE) {
        content = content.replace(TO_REPLACE[i], "");
    }
    for (var j in TO_REPLACE2) {
        content = content.replace(TO_REPLACE2[j], " ");
    }
    FileUtils.writeStringToFile(file, content, "UTF-8");

    try {
        var xmlreader = XMLReaderFactory.createXMLReader();
        xmlreader.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        var builder = new Builder(xmlreader, false);

        var doc = builder.build(file);
        var docNode = doc.getRootElement();
        var contentElement = new Element("content");
        storyElement.appendChild(contentElement);
        contentElement.appendChild(createHeadingTag(docNode));
        contentElement.appendChild(createTitleTag(docNode));
        contentElement.appendChild(createSubTitleTag(docNode));
        contentElement.appendChild(createLeadTag(docNode));
        contentElement.appendChild(createTexteTag(docNode));
        contentElement.appendChild(createLegPhotoTag(docNode));

        // Write Story
        var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/" + type + "/" + OUTPUT_NAME + ".xml";
        var dstFile = new File(dstPath);
        writeElement(storyElement, dstFile);
    }
    catch (e) {
        _print(file.getPath() + " is not a valid XML file");
        _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
        var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/" + type + "/" + OUTPUT_NAME + ".xml";
        var dstFile = new File(dstPath);
        if ( dstFile.exists()) FileUtils.forceDelete(dstFile);
        if ( ZIP_DIR.exists()) FileUtils.forceDelete(ZIP_DIR);
    }
}

// Process image
function processImage(imageItem) {
    _print("processImage: " + imageItem.path);

    var imageFile = new File(ZIP_DIR, imageItem.path);
    if (imageFile.exists()) {
        // Nothing to do
    }
    else {
        _print("Image: " + imageItem.loid + " -  " + imageFile.getPath() + " does not exist!");
        imageItem.isValid = false;
    }
}

// Build XML & write Image
function writeImage(type, imageItem, storyNode) {
    _print("writeImage: " + imageItem.path);

    var imageFile = new File(ZIP_DIR + "/" + imageItem.path);

    var imageElement = new Element("image");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/MAG"));
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "extMetadata/IssueDate")));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("extRef", ''));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(storyNode, "extMetadata/DbPath") + ""));
    metaElement.appendChild(catElement);

    var imageInfo = ScriptUtils.getImageInfo(imageFile);
    metaElement.appendChild(createElement("width", imageInfo.getWidth()));
    metaElement.appendChild(createElement("height", imageInfo.getHeight()));

    var creditPhoto = getValue(imageItem.fileNode, "extMetadata/Credit");
    metaElement.appendChild(createElement("creditWeb", creditPhoto + ""));
    var legend = getValue(imageItem.fileNode, "extMetadata/Caption");
    metaElement.appendChild(createElement("legendWeb", legend + ""));

    var iptcData = getIptcData(imageFile);

    if (iptcData != null) {
        var iptc = new Element("iptc");
        iptc.appendChild(createElement("caption", ScriptUtils.clean(iptcData.caption)));
        iptc.appendChild(createElement("headline", ScriptUtils.clean(iptcData.headline)));
        iptc.appendChild(createElement("credit", ScriptUtils.clean(iptcData.credit)));
        iptc.appendChild(createElement("byline", ScriptUtils.clean(iptcData.byline)));
        iptc.appendChild(createElement("objectname", ScriptUtils.clean(iptcData.objectname)));
        iptc.appendChild(createElement("datecreated", ScriptUtils.clean(iptcData.datecreated)));
        iptc.appendChild(createElement("country", ScriptUtils.clean(iptcData.country)));
        iptc.appendChild(createElement("city", ScriptUtils.clean(iptcData.city)));
        iptc.appendChild(createElement("special", ScriptUtils.clean(iptcData.special)));
        iptc.appendChild(createElement("source", ScriptUtils.clean(iptcData.source)));
        metaElement.appendChild(iptc);
    }

    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + imageItem.path.substr(0, imageItem.path.lastIndexOf(".jpg"));
    var jpgDstFile = new File(dstPath + ".jpg");
    var previewFile = new File(dstPath + "_preview.jpg");
    var thumbFile = new File(dstPath + "_thumb.jpg");

    var contentElement = new Element("content");
    imageElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", jpgDstFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));
    convertImage(imageFile, jpgDstFile, previewFile, thumbFile);

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    if (type == "story") {
        contentElement.appendChild(createElement("caption", ""));
    } else if (type == "gallery") {
        contentElement.appendChild(createElement("caption", legend + ""));
    }
    contentElement.appendChild(createElement("credit", creditPhoto));

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", type));
    objectLink.addAttribute(new Attribute("extRef", storyNode.getAttributeValue("name")));
    objectLinks.appendChild(objectLink);

    // Write Image Element
    var dstFile = new File(dstPath + ".xml");
    writeElement(imageElement, dstFile);
}

// Process graphic
function processGraphic(graphicItem) {
    _print("processGraphic: " + item.path);

    var graphicFile = new File(ZIP_DIR, graphicItem.path);
    if (graphicFile.exists()) {
        // Nothing to do
    }
    else {
        _print("Graphic: " + graphicItem.loid + " - " + graphicFile.getPath() + " does not exist!");
        graphicItem.isValid = false;
    }
}

// Write graphic
// TODO: complete attributes
function writeGraphic(type, graphicItem, storyNode) {
    _print("writeGraphic: " + graphicItem.path);

    var graphicFile = new File(ZIP_DIR, graphicItem.path);

    var graphicElement = new Element("graphic");
    var metaElement = new Element("metadata");
    graphicElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/MAG"));
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "extMetadata/IssueDate")));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("extRef", graphicItem.loid));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(storyNode, "extMetadata/Category") + ""));
    metaElement.appendChild(catElement);

    var ext = FilenameUtils.getExtension(graphicItem.path);
    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + graphicItem.path.substr(0, graphicItem.path.lastIndexOf(ext) + 1);
    var graphicDstFile = new File(dstPath + "." + ext);
    var previewFile = new File(dstPath + "_preview.jpg");
    var thumbFile = new File(dstPath + "_thumb.jpg");

    var contentElement = new Element("content");
    graphicElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", graphicDstFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));

    if (ext.toLowerCase() == "pdf")
        convertPdf(graphicFile, graphicDstFile, previewFile, thumbFile, 40);
    else
        convertImage(graphicFile, graphicDstFile, previewFile, thumbFile);

    var imageInfo = ScriptUtils.getImageInfo(previewFile);
    if (imageInfo != null) {
        metaElement.appendChild(createElement("width", imageInfo.getWidth()));
        metaElement.appendChild(createElement("height", imageInfo.getHeight()));
    }

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    contentElement.appendChild(createElement("caption", trim(getValue(graphicItem.fileNode, "extMetadata/CreditPhoto"))));
    contentElement.appendChild(createElement("credit", trim(getValue(graphicItem.fileNode, "extMetadata/Legend"))));

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", type));
    objectLink.addAttribute(new Attribute("extRef", storyNode.getAttributeValue("name")));
    objectLinks.appendChild(objectLink);

    // Write Media
    var dstFile = new File(dstPath + ".xml");
    writeElement(graphicElement, dstFile);
}

// Process image
function processVideo(videoItem) {
    _print("processVideo: " + videoItem.path);
// TODO: We could test if the URL exists
}

// Build XML & write Image
function writeVideo(type, videoItem, storyNode) {
    _print("writeVideo: " + videoItem.path);

    var imageElement = new Element("video");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "extMetadata/IssueDate")));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("extRef", videoItem.path));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(storyNode, "extMetadata/Category") + ""));
    metaElement.appendChild(catElement);

    var contentElement = new Element("content");
    imageElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", videoItem.path));

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", type));
    objectLink.addAttribute(new Attribute("extRef", storyNode.getAttributeValue("name")));
    objectLinks.appendChild(objectLink);

    // Write Image Element
    var ext = FilenameUtils.getExtension(videoItem.path);
    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + videoItem.path.substr(0, graphicItem.path.lastIndexOf(ext) + 1);
    var dstFile = new File(dstPath + ".xml");
    writeElement(imageElement, dstFile);
}

// Process Tags
function processTags(nodes) {

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
            else if (tag == "tables") {
                setNodeName(node, "table");
            }
            else if (tag == "texte") {
                setNodeName(node, "text");
            }
            else if (tag == "photo-legende") {
                setNodeName(node, "legend");
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
                //setNodeName(node, "u") ;
            }
            else if (tag == "question") {
                setNodeName(node, "p");
                node.addAttribute(new Attribute("type", "question"));
            }
            else if (tag == "signature") {
                var signNode = new Element("signature");
                var txt = WordUtils.capitalizeFully(trim(node.getValue()), SEP_ARRAY) + "";
                txt = txt.replace(/propos recueillis par/i, "Propos recueillis par");
                txt = txt.replace(/ et /i, " et ");
                txt = txt.replace(/ avec /i, " avec ");
                signNode.appendChild(txt);
                node.getParent().replaceChild(node, signNode);
            }
            else if (tag == "sup") {
                setNodeName(node, "sup");
            }
            else if (tag == "span") {
                var classAttr = node.getAttribute("class");
                var styleAttr = node.getAttribute("style");

                if (classAttr != null && (classAttr.getValue() + "") == "RESCOL") {
                    var t = new Text(WordUtils.capitalize(node.getValue(), SEP_ARRAY));
                    node.getParent().replaceChild(node, t);
                }
                else if (classAttr != null && (classAttr.getValue() + "") == "TMG_Puce_ronde") {
                    node.getParent().replaceChild(node, new Text("-"));
                }
                else if (styleAttr != null &&
                        (styleAttr.getValue() + "") == "font-family:'EuropeanPi-Three';" &&
                        node.getValue() == "L ") {
                    //node.getParent().replaceChild(node, new Text("?")) ;
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
                //_print("attr: " + attr) ;
                //setNodeName(node, "SPAN") ;
            }
            else {
                setNodeName(node, "p");
            }
        }
        else {
            var tag = node.getLocalName().toLowerCase();
            if (tag == "br") {
                var t = new Text(" ");
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
    node.appendChild(new Text(capFirst(trim(value))));
    return node;
}

function createHeadingTag(itemNode) {
    processTags(itemNode.query("article/titraille/surtitre/descendant-or-self::*"));
    return addToElement(itemNode.query("article/titraille/heading/*"), new Element("heading"));
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

function createLegPhotoTag(itemNode) {
    processTags(itemNode.query("article/photo-groupe/photo-legende/descendant-or-self::*"));
    return addToElement(itemNode.query("article/photo-groupe/legend/*"), new Element("legend"));
}

function createTexteTag(itemNode) {
    var nodes = itemNode.query("article/texte/descendant-or-self::* | doc/article/tables/descendant-or-self::*");
    processTags(nodes);

    var textNode = new Element("text");
    nodes = itemNode.query("article/text/*");
    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        if (node.getChildCount() > 0) {
            node.detach();
            textNode.appendChild(node);
        }
    }
    return textNode;
}

// Resize Image with Ghostscript
function convertPdf(srcFile, dstFile, previewFile, thumbFile, res) {
    return;

    if (dstFile.exists())
        FileUtils.forceDelete(dstFile);
    if (previewFile.exists())
        FileUtils.forceDelete(previewFile);
    if (thumbFile.exists())
        FileUtils.forceDelete(thumbFile);

    var tmpFile = File.createTempFile("page_", ".jpg");
    tmpFile.deleteOnExit();

    var exe = GS_PATH + " -q -dNOPROMPT -dBATCH -dNOPAUSE -dUseCIEColor -sDEVICE=jpeg -dJPEGQ=85 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r180 -o ";
    var pdf = tmpFile.getPath() + " \"" + srcFile.getPath() + "\"";

    // TMP JPEG
    _print("Converting PDF: " + srcFile.getName());
    _execFor(exe + pdf, dstFile.getParent(), 90000);

    // PREVIEW
    if (tmpFile.exists()) {
        exe = "ext/windows/imagemagick/convert.exe \"" + tmpFile.getPath() + "\" -resize " + PREVIEW_SIZE + "x" + PREVIEW_SIZE + "> " + previewFile.getPath();
        _execFor(exe, dstFile.getParent(), 30000);
    }

    // THUMB
    if (previewFile.exists()) {
        exe = "ext/windows/imagemagick/convert.exe \"" + previewFile.getPath() + "\" -resize " + THUMB_SIZE + "x" + THUMB_SIZE + "> " + thumbFile.getPath();
        _execFor(exe, dstFile.getParent(), 30000);
    }

    FileUtils.deleteQuietly(tmpFile);
    FileUtils.copyFile(srcFile, dstFile);
}

// Resize Image with Image Magick
function convertImage(srcFile, dstFile, previewFile, thumbFile) {
    //return ;

    if (dstFile.exists())
        FileUtils.forceDelete(dstFile);
    if (previewFile.exists())
        FileUtils.forceDelete(previewFile);
    if (thumbFile.exists())
        FileUtils.forceDelete(thumbFile);

    var d = ScriptUtils.getImageDimension(srcFile);
    if (srcFile.getName().toLowerCase().endsWith(".jpg") && (d.width == 0 || d.height == 0))
        d.width = MAX_SIZE + 1;

    // Convert image if larger than MAX_SIZE
    if (d.width > MAX_SIZE || d.height > MAX_SIZE) {
        //_print("Converting Image: " + srcFile.getName() + " to " + dstFile + " (" + d.width + "x" + d.height + ")");
        var exe = "ext/windows/imagemagick/convert.exe \"" + srcFile.getPath() + "\" -resize " + REL_SIZE + "x" + REL_SIZE + "> " + dstFile.getPath();
        _execFor(exe, dstFile.getParent(), 30000); // creates also parent directory
    }
    else {
        //_print("Copying Image: " + srcFile.getName() + " to " + dstFile + " (" + d.width + "x" + d.height + ")");
        FileUtils.copyFile(srcFile, dstFile);
    }

    // PREVIEW
    if (dstFile.exists()) {
        exe = "ext/windows/imagemagick/convert.exe " + dstFile.getPath() + " -resize " + PREVIEW_SIZE + "x" + PREVIEW_SIZE + "> " + previewFile.getPath();
        _execFor(exe, dstFile.getParent(), 30000);
    }

    // THUMB
    if (previewFile.exists()) {
        exe = "ext/windows/imagemagick/convert.exe " + previewFile.getPath() + " -resize " + THUMB_SIZE + "x" + THUMB_SIZE + "> " + thumbFile.getPath();
        _execFor(exe, dstFile.getParent(), 30000);
    }
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
        //_print("node :" + node.getQualifiedName() + " attribut: " + attr) ;
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

// Get all values depending on the xpath
function getMultipleValue(node, xpath) {
    var nodes = node.query(xpath);
    if (nodes == null || nodes.size() == 0)
        return "";
    var value = nodes.get(0).getValue();
    for (var i = 1; i < nodes.size(); i++) {
        value += nodes.get(i).getValue();
    }
    return value;
}

// Create <tag> value </tag>
function createElement(tag, value) {
    var element = new Element(tag);
    element.appendChild(value);
    return element;
}

function copyToError(file, filename) {
    var dstFile = new File(ERROR_DIR, filename);
    _print("copie : " + filename + " vers " + dstFile.getPath());
    FileUtils.copyFile(file, dstFile);
}

// Main
function main() {
    _print("Starting Process");

    extractZip();
    processZip();
    buildZip();

    _print("Process Done");
    return _OK;
//return _KEEP ;
}

// start & exit
try {
    _exit = main();
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}

