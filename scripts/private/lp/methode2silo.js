/* test.js
 * Emmanuel Deviller
 *
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile)
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
 *
 * Attention aux mots reserves : ex.  file.delete => file["delete"] )
 */

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

// TODO:
// Traiter les shapes pour chaque page et par boite
// traiter le cas d'une photo non rattachée à un article mais à une page						
// traiter les crédits multiples
// cropper les previews des PDF
// cropper les images des galleries
// Merger les story items des pages double

// ok - traiter les shapes des pages doubles
// ok - améliorer le traitement des auteurs
// ok - améliorer le traitement des signatures
// ok - correction link story vers page
// ok - threader les traitements GS et imagemagick
// ok - traiter le cas d'une seconde balise <texte> dans une story (que faire?) 
// ok - filtrer les dummy texte (par ex. <?EM-dummyText [relance]?> )
// ok - filtrer <span id="U1102386625440z9C" style="font-family:'EuropeanPi-Three';color:#bebebe;">L</span>
// ok - Photos anamorphosées
// ok - Traiter les pages doubles
// ok - Supprimer le traitement photos
// ok - Boites avec coordonnées négatives sont à 0,0 (a tester)
// ko - Ne pas separer la page double (impossible)

TEMP_DIR = "D:/METHODE/ARCHIVE/silo_tmp/";
OUTPUT_DIR = "D:/METHODE/ARCHIVE/silo_out/";
ERROR_DIR = "D:/METHODE/ARCHIVE/silo_error/";
SAV_DIR = "D:/METHODE/ARCHIVE/silo_sav/";

GS_EXE = "C:/Program Files/gs/gs9.16/bin/gswin64c.exe";
CONVERT_EXE = "ext/windows/imagemagick/convert.exe";

var MAX_SIZE = 3000;  // Pixels
var REL_SIZE = 3000;
var PREVIEW_SIZE = 768;
var THUMB_SIZE = 192;
//
var ZIP_DIR;
var DATE_PATH;
var DATE_DIR;
var DATE_NAME;
var PLAN_FILENAME;
var PLAN_NAME;
var STDDATE;   // 25062011
var INVDATE;   // 20110625
var EXECUTOR;

// Filter
var TO_REMOVE = ["&#0;", "&#1;", "&#2;", "&#3;", "&#4;", "&#5;", "&#6;", "&#7;", "&#8;", "&#9;", "&#10;", "&#27;", "&#28;", "&#29;", "&#30;", "&#31;"]; // par ""
var TO_SPACE = ["&#8239;", "&#8201;", "&#160;"]; // par " "

//var SEP_ARRAY = java.lang.reflect.Array.newInstance(java.lang.String, 2);
var SEP_ARRAY = [' ', '-', '.', '’'];
var TRANS_RE = new RegExp(".*translate\\((.*?)\\)", "");
var SCALE_RE = new RegExp(".*scale\\((.*?)\\)", "");
var ROTATE_RE = new RegExp(".*rotate\\((.*?)\\)", "");
var PAGE_ARRAY = ["left", "right"];
var XOM = ScriptUtils.createXomBuilder(false, false);

var PAGE_COUNT = 999;
var PAGEIDSET = {};
var STORYPAGESET = {};
var IMGSET = {};
var PDFSET = {};

function getUniqPageId(id) {
    if (!PAGEIDSET.hasOwnProperty(id)) {
        PAGE_COUNT++;
        PAGEIDSET[id] = PAGE_COUNT;
        return PAGE_COUNT;
    }
    return PAGEIDSET[id];
}

// Add a story to this pages to the global cache
function addStoryPage(storyId, page) {
    var pages = getStoryPage(storyId);
    for (var k = 0; k < pages.length; k++) {
        if (page == pages[k] || page.loid == pages[k].loid) {
            _print("addStoryPage: " + storyId + " - " + page.loid + " already added");
            return;
        }
    }
    pages.push(page);
}

// Return an array of pages linked with this story drom the global cache
function getStoryPage(storyId) {
    if (!STORYPAGESET.hasOwnProperty(storyId)) {
        STORYPAGESET[storyId] = [];
    }
    return STORYPAGESET[storyId];
}

// Return a story item from story loid from the global cache
function getStoryItem(storyId) {
    var pages = getStoryPage(storyId);
    for (var k = 0; k < pages.length; k++) {
        var page = pages[k];  // PhysPage
        var containers = page.containers;
        for (var i = 0; i < containers.length; i++) {
            var container = containers[i];
            for (var j = 0; j < container.length; j++) {
                var storyItem = container[j];
                if (storyItem.linkType == "story" && storyItem.loid == storyId) {
                    return storyItem;
                }
            }
        }
    }
    return null;
}

function getPageStoryItem(storyId, page) {
    if (page != null) {
        var containers = page.containers;
        for (var i = 0; i < containers.length; i++) {
            var container = containers[i];
            for (var j = 0; j < container.length; j++) {
                var storyItem = container[j];
                if (storyItem.linkType == "story" && storyItem.loid == storyId) {
                    return storyItem;
                }
            }
        }
    }
    return null;
}

function isImgFirstTime(key) {
    if (IMGSET.hasOwnProperty(key))
        return false;
    IMGSET[key] = true;
    return true;
}

function isPdfFirstTime(key) {
    if (PDFSET.hasOwnProperty(key))
        return false;
    PDFSET[key] = true;
    return true;
}


// workaround for a Methode bug : JavaException: nu.xom.ParsingException: White    
// space is required between the processing instruction target and data
function filterXml(file) {
    _print("Filtering file: " + file);

    var xmlcontent = FileUtils.readFileToString(file, "UTF-8");
    xmlcontent = xmlcontent.replaceAll("\\<\\?EM-dummyText.*?\\?\\>", "");

    var array = java.lang.reflect.Array.newInstance(java.lang.String, TO_REMOVE.length);
    Arrays.fill(array, "");
    xmlcontent = StringUtils.replaceEach(xmlcontent, TO_REMOVE, array);

    var array = java.lang.reflect.Array.newInstance(java.lang.String, TO_SPACE.length);
    Arrays.fill(array, " ");
    xmlcontent = StringUtils.replaceEach(xmlcontent, TO_SPACE, array);

    return xmlcontent;
}

// Unzip archive
//function extractZip() {  
//    _print("Extracting Zip file");
//    ZIP_DIR = new File(TEMP_DIR, _srcFile.getName() + "_dir");
//    _print("ZIP_DIR: " + ZIP_DIR);
//    //if ( ZIP_DIR.exists() ) FileUtils.forceDelete(ZIP_DIR);
//    if ( !ZIP_DIR.exists() )
//        ScriptUtils.unzipFileToDir(_srcFile.getFile(), ZIP_DIR);
//
//    _print("Extracting Zip file done");
//}

// Unzip archive
function extractTar() {
    _print("Extracting Tar file");
    var tarfile = new File(SAV_DIR, _srcFile.getFile().getName());
    if (!tarfile.exists())
        FileUtils.copyFileToDirectory(_srcFile.getFile(), new File(SAV_DIR));

    ZIP_DIR = new File(TEMP_DIR, _srcFile.getName() + "_dir");
    _print("TAR_DIR: " + ZIP_DIR);

    if (ZIP_DIR.exists()) {
        _print("Deleting existing Tar dir ");
        FileUtils.forceDelete(ZIP_DIR);
    }

    if (!ZIP_DIR.exists()) {
        ScriptUtils.untarFileToDir(_srcFile.getFile(), ZIP_DIR);
    }

    _print("Extracting Tar file done");
}

// Unzip archive
function buildZip() {
    _print("buildZip");
    if (DATE_DIR.exists()) {
        var tmpFile = new File(OUTPUT_DIR, INVDATE + ".zip_tmp");
        var dstFile = new File(OUTPUT_DIR, INVDATE + "_LEPARISIEN.zip");
        if (tmpFile.exists())
            FileUtils.forceDelete(tmpFile);
        if (dstFile.exists())
            FileUtils.forceDelete(dstFile);
        _print("Zip output dir");
        ScriptUtils.zipDirToFile(DATE_DIR, tmpFile);
        FileUtils.moveFile(tmpFile, dstFile);
    }
    else {
        _print("Zip output dir does not exist!");
    }

    _print("buildZip done");
}

// Delete ZIP_DIR
function cleanDir() {

    for (var i = 0; i < 3; i++) {
        Thread.sleep(2000);

        if (ZIP_DIR.exists()) {
            try {
                _print("Deleting: " + ZIP_DIR);
                FileUtils.forceDelete(ZIP_DIR);
            }
            catch (e) {
                _print("Error deleting: " + ZIP_DIR);
                _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
                Thread.sleep(10000);
            }
        }

        if (DATE_DIR.exists()) {
            try {
                _print("Deleting: " + DATE_DIR);
                FileUtils.forceDelete(DATE_DIR);
            }
            catch (e) {
                _print("Error deleting: " + DATE_DIR);
                _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
                Thread.sleep(10000);
            }
        }
    }
}

// Process zip and set global variables
function processArchive() {
    _print("Processing Archive File");

    // Date Directory 2010-14-02
    var filenames = ZIP_DIR.list();
    var rxp = new RegExp("\\d\\d\\d\\d-\\d\\d-\\d\\d", "");
    for (var i = 0; i < filenames.length; i++) {
        if (filenames[i].match(rxp)) {
            DATE_NAME = filenames[i];
            _print("DATE_NAME: " + DATE_NAME);
            break;
        }
    }

    if (DATE_NAME == null) {
        _print("The Date Directory was not found in the Zip File");
        return false;
    }

    // Planning: LeParisien_2010-10-14.xml
    rxp = new RegExp("LeParisien_\\d\\d\\d\\d-\\d\\d-\\d\\d\\.xml", "");
    filenames = new File(ZIP_DIR, DATE_NAME).list();
    for (var i = 0; i < filenames.length; i++) {
        if (filenames[i].match(rxp)) {
            PLAN_FILENAME = ZIP_DIR.getPath() + "/" + DATE_NAME + "/" + filenames[i];
            PLAN_NAME = "PLAN_" + DATE_NAME;

            var YEAR = filenames[i].substr(11, 4);
            var MONTH = filenames[i].substr(16, 2);
            var DAY = filenames[i].substr(19, 2);

            STDDATE = DAY + "" + MONTH + "" + YEAR;
            INVDATE = YEAR + "" + MONTH + "" + DAY;

            DATE_PATH = TEMP_DIR + INVDATE + "/" + INVDATE + "/";
            DATE_DIR = new File(TEMP_DIR + INVDATE + "/");
            if (DATE_DIR.exists())
                FileUtils.forceDelete(DATE_DIR);

            _print("PLAN_FILENAME: " + PLAN_FILENAME + " - " + DAY + "/" + MONTH + "/" + YEAR);
            break;
        }
    }

    if (PLAN_FILENAME == null) {
        _print("The Planning File was not found in the Zip File");
        return false;
    }

    return true;
}

function copyToError() {
    var srcFile = _srcFile.getFile();
    var errFile = new File(ERROR_DIR, _srcFile.getName());
    if (srcFile.exists())
        FileUtils.copyFile(srcFile, errFile);
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

// Write PagePlan
function writePagePlan(physPages) {

    var planElement = new Element("pageplan");
    var metaElement = new Element("metadata");
    planElement.appendChild(metaElement);

    // Base Meta
    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("extRef", PLAN_NAME));
    metaElement.appendChild(createElement("issueDate", INVDATE));
    metaElement.appendChild(createElement("permission", 0));
    metaElement.appendChild(createElement("code", 1));

    var editions = new Element("editions");
    metaElement.appendChild(editions);

    var categories = new Element("categories");
    metaElement.appendChild(categories);

    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    for (var i = 0; i < physPages.length; i++) {
        var physPage = physPages[i];

        var objectLink = new Element("objectLink");
        objectLink.addAttribute(new Attribute("linkType", "page"));
        objectLink.addAttribute(new Attribute("extRef", physPage.loid));
        objectLinks.appendChild(objectLink);

        writePage(physPage);
    }

    var contentElement = new Element("content");
    planElement.appendChild(contentElement);

    // Write PDF & JPEG
    var dstPath = DATE_PATH + "plan/" + PLAN_NAME;
    var dstFile = new File(dstPath + ".xml");
    contentElement.appendChild(createElement("uri", dstFile.getName()));

    // Write Plan
    writeElement(planElement, dstFile);
}

// Find all XML page files on filesystem
function createXmlPages() {
    _print("createXmlPages");

    // Mapping Array
    var xmlPages = new Object();

    var dirA = new File(ZIP_DIR, DATE_NAME + "/LeParisien/").listFiles();
    for (var i = 0; i < dirA.length; i++) {
        var p1 = DATE_NAME + "/LeParisien/" + dirA[i].getName() + "/Page/";
        var dirB = new File(dirA[i], "Page").listFiles();
        for (var j = 0; j < dirB.length; j++) {
            var path = p1 + dirB[j].getName();
            var filename = new File(dirB[j]).getPath();
            if (FilenameUtils.isExtension(filename, "xml")) {
                var xmlPage = createXmlPage(path);
                // Filter unusefull pages
                if (xmlPage.edition != "ROUGH") {
                    var key = xmlPage.edition + "_" + xmlPage.book + "_" + xmlPage.editnum;
                    _print("xmlPages[key]: " + key);
                    xmlPages[key] = xmlPage;
                }
            }
        }
    }
    return xmlPages;
}

// Create a XML page on FS
function createXmlPage(path) {
    _print("createXmlPage: " + path);

    // var doc = XOM.build(new File(ZIP_DIR, path));
    var doc = XOM.build(filterXml(new File(ZIP_DIR, path)), null);
    var pageNode = doc.getRootElement();
    var editionNode = doc.query("/page/pxpInfos/product/edition").get(0);
    var bookNodeNode = doc.query("/page/pxpInfos/product/edition/book").get(0);

    return {
        edition: editionNode.getAttributeValue("name") + "",
        book: bookNodeNode.getAttributeValue("name") + "",
        editnum: pageNode.getAttributeValue("pageNumberEdition") + "",
        path: path
    };
}

// Create all physical pages fron PagePlan
function createPhysPages(xmlPages) {
    _print("createPhysPages");

    var physPages = new Array();

    _print("opening: " + PLAN_FILENAME);
    var doc = XOM.build(new File(PLAN_FILENAME));
    var parutionNode = doc.getRootElement();
    var editionNodes = parutionNode.getChildElements();

    // On liste les pages physiques
    for (var i = 0; i < editionNodes.size(); i++) {
        var editionNode = editionNodes.get(i);
        var editionName = editionNode.getAttributeValue("name") + "";
        var bookNodes = editionNode.getChildElements();

        for (var j = 0; j < bookNodes.size(); j++) {
            var bookNode = bookNodes.get(j);
            var bookName = bookNode.getAttributeValue("methodeName");
            var pageNodes = bookNode.getChildElements();
            var pageMax = pageNodes.size() + "";

            for (var k = 0; k < pageNodes.size(); k++) {
                var pageNode = pageNodes.get(k);
                var pageMasterEdition = pageNode.getAttributeValue("masterEdition") + "";
                if (editionName == pageMasterEdition) {
                    var pagePn = pageNode.getAttributeValue("pn");
                    var pageEditionNum = pageNode.getAttributeValue("pnEditionNumber") + "";
                    var pageSection = pageNode.getAttributeValue("section");
                    var pageColor = pageNode.getAttributeValue("color");
                    var sequence = pageNode.getAttributeValue("sequenceNumber") + "";
                    var key = editionName + "_" + bookName + "_" + pageEditionNum;

                    if (xmlPages.hasOwnProperty(key)) {
                        var pagePath = xmlPages[key].path;
                        var doublePage = null;

                        // Page double
                        if (pagePn.contains(",")) {
                            var n2 = parseInt(pageEditionNum.substring(1), 10) + 1;
                            var pen2 = (n2 < 10) ? "00" + n2 : "0" + n2;
                            var key2 = editionName + "_" + bookName + "_" + pen2;
                            if (xmlPages.hasOwnProperty(key2)) {
                                doublePage = createPhysPage("LP", editionName, bookName, pagePn, pageEditionNum,
                                        pageSection, pageColor, pageMax, sequence, xmlPages[key2].path, null, true);
                                physPages.push(doublePage);
                            }
                            else {
                                _print("Le fichier xml de la page double " + key2 + " n'existe pas!");
                            }
                        }

                        var page = createPhysPage("LP", editionName, bookName, pagePn, pageEditionNum,
                                pageSection, pageColor, pageMax, sequence, pagePath, doublePage, false);
                        physPages.push(page);

                        if (doublePage != null)
                            doublePage.doublePage = page;
                    }
                    else {
                        _print("Le fichier xml de la page " + key + " n'existe pas!");
                    }
                }
            }
        }
    }

    // On liste les pages liees
    for (var i = 0; i < editionNodes.size(); i++) {
        editionNode = editionNodes.get(i);
        editionName = editionNode.getAttributeValue("name") + "";
        bookNodes = editionNode.getChildElements();

        for (var j = 0; j < bookNodes.size(); j++) {
            bookNode = bookNodes.get(j);
            bookName = bookNode.getAttributeValue("name");
            pageNodes = bookNode.getChildElements();
            pageMax = pageNodes.size() + "";

            for (var k = 0; k < pageNodes.size(); k++) {
                pageNode = pageNodes.get(k);
                pageMasterEdition = pageNode.getAttributeValue("masterEdition") + "";
                if (editionName != pageMasterEdition) {
                    var pageMasterNum = pageNode.getAttributeValue("masterPnEditionNumber") + "";
                    pagePn = pageNode.getAttributeValue("pn");
                    pageSection = pageNode.getAttributeValue("section");
                    pageColor = pageNode.getAttributeValue("color");
                    sequence = pageNode.getAttributeValue("sequenceNumber") + "";
                    addVirtualPage(physPages, pageMasterEdition, pageMasterNum, "LP", editionName, bookName, pagePn, pageColor, pageMax, sequence);
                }
            }
        }
    }
    return physPages;
}

// Create a physical page (page that really exists)
function createPhysPage(product, edition, book, pn, editnum, section, color, pageMax, sequence, path, doublePage, isSecondPage) {
    //_print("physPage: " + date + ", " + product + ", " + edition + ", " + book  + ", " + pn + ", " + editnum + ", " + section + ", " + path);
    if (section == null)
        section = "";
    if (color == null)
        color = "cmyk";

    return {
        //date : date,
        product: product,
        edition: edition,
        book: book,
        pn: pn,
        editnum: editnum,
        section: section,
        color: color,
        pageMax: pageMax,
        sequence: sequence,
        path: path,
        doublePage: doublePage,
        isSecondPage: isSecondPage,
        loid: -1,
        preview: null,
        thumb: null,
        links: new Array(),
        containers: new Array()  // array of array of items
    };
}

// Add a linked page to a physical page
function addVirtualPage(physPages, masterEdition, masterNum, product, edition, book, pn, color, pageMax, sequence) {

    var added = false;

    for (var i = 0; i < physPages.length; i++) {
        var physPage = physPages[i];
        if (physPage.edition == masterEdition && physPage.editnum == masterNum) {
            //_print("linkedPage: " + masterEdition + ", " + masterNum + ", " + product + ", " + edition + ", " + book + ", " + pn);
            if (color == null)
                color = physPage.color;

            var linkedPage = {
                product: product,
                edition: edition,
                book: book,
                pn: pn,
                color: color,
                pageMax: pageMax,
                sequence: sequence
            };

            //_print("Add virual page: " + edition + "_" + book + "_" + pn);
            physPage.links.push(linkedPage);
            added = true;
            //return;
        }
    }

    if (!added)
        _print("Unable to add virtual Page: " + masterEdition + ", " + masterNum + ", " + product + ", " + edition + ", " + book + ", " + pn);
}

// Process all pages /spool/20100927/pages dans ROOT/ANNEE/MOIS/JOUR/PRODUCT/EDITION/PAGE/BOOK
function processPages(physPages) {
    _print("processPages");
    for (var i = 0; i < physPages.length; i++) {
        var physPage = physPages[i];
        var xmlSrcFile = new File(ZIP_DIR, physPage.path);
        if (xmlSrcFile.exists()) {
            processPage(physPage);
        }
        else {
            _print("Page " + xmlSrcFile + " does not exist!");
        }
    }
}

// Create an ObjectLink
// TODO: ajouter les contents et les shape
function createItem(linkType, loid, uuid, cid, path, index) {
    //_print("createItem");
    var isValid = true;

    if (linkType == "image") {
        var file = new File(ZIP_DIR, path);
        if (!file.exists() || file.isDirectory()) {
            var p = path.replace(/_.*\./, "_original.");
            var f = new File(ZIP_DIR, p);
            if (f.exists() && !f.isDirectory()) {
                path = p;
            }
            else {
                isValid = false;
                _print(linkType + " - " + path + " does not exist!");
            }
        }
    }
    else if (linkType == "graphic") {
        file = new File(ZIP_DIR, path);
        if (!file.exists() || file.isDirectory()) {
            p = path.replace(/_.*$/, "_original.pdf");
            f = new File(ZIP_DIR, p);
            if (f.exists() && !f.isDirectory()) {
                path = p;
            }
            else {
                _print(linkType + " - " + path + " does not exist!");
                isValid = false;
            }
        }
    }

    return {
        linkType: linkType,
        loid: loid,
        uuid: uuid,
        cid: cid, // not valid for a page or a correlation!
        path: path, // not valid for story !
        index: index,
        isValid: isValid,
        shape: null,
        items: new Array() // Array of items        
    };
}

// Process the physical page
function processPage(physPage) {
    _print("processPage: " + physPage.path);

    // Lit le fichier de page
    var pageDoc = XOM.build(filterXml(new File(ZIP_DIR, physPage.path)), null);
    //var pageDoc = XOM.build(new File(ZIP_DIR, physPage.path));

    var pageNode = pageDoc.getRootElement();
    //physPage.loid = pageNode.getAttributeValue("pagePglLoid");
    physPage.loid = getUniqPageId(pageNode.getAttributeValue("pageId"));

    var pxpStoryNodes = pageDoc.query("/page/pxpStories/pxpStory");

    for (var i = 0; i < pxpStoryNodes.size(); i++) {
        var pxpStoryNode = pxpStoryNodes.get(i);
        var pxpContentNodes = pxpStoryNode.getChildElements("content");
        var linkType = null;
        var container = new Array();  // => Article (contient des story, images, etc.)

        var captionIndex = 1;
        for (var j = 0; j < pxpContentNodes.size(); j++) {
            var pxpContentNode = pxpContentNodes.get(j);
            var type = pxpContentNode.getAttributeValue("contentType");
            var loid = pxpContentNode.getAttributeValue("contentLoid");
            var cid = pxpContentNode.getAttributeValue("contentId");

            if (type == "picture")
                linkType = "image";
            else if (type == "graphic")
                linkType = "graphic";
            else if (type == "video")
                linkType = "video";
            else if (type == "audio")
                linkType = "audio";
            else if (type == "ad")
                linkType = "other";
            else if (type == "rule")
                linkType = "other";
            else if (type == "box")
                linkType = "other"; // encadre
            else
                linkType = "story";

            var sameLoid = false;
            for (var k = 0; k < container.length; k++) {
                if (container[k].loid == loid) {
                    sameLoid = true;
                    break;
                }
            }

            if (!sameLoid && linkType != "other") {
                var itemNodes = pageDoc.query("/page/items/item[@loid='" + loid + "']");
                if (itemNodes.size() > 0) {
                    var itemNode = itemNodes.get(0);
                    var uuid = itemNode.getAttributeValue("uuid");

                    if (linkType != "story") {
                        var formatNodes = itemNode.query("formats/format");
                        if (formatNodes.size() > 0) {
                            // var idx = formatNodes.size()-1;
                            var idx = 0;
                            //if ( linkType == "graphic" ) idx = 0;
                            var path = formatNodes.get(idx).getValue() + "";
                            container.push(createItem(linkType, loid, uuid, cid, path, captionIndex));
                            if (linkType == "image" || linkType == "graphic")
                                captionIndex++;
                        }
                        else {
                            _print("Impossible de trouver le path pour le loid : " + loid + " - type: " + type + " - page: " + physPage.path);
                        }
                    }
                    else {
                        container.push(createItem(linkType, loid, uuid, cid, "", 0));
                    }
                }
                else {
                    _print("L'item correspondant n'existe pas! loid : " + loid + " - type: " + type + " - page: " + physPage.path);
                }
            }
        }
        physPage.containers.push(container);

        // Process all stories first
        for (var k = 0; k < container.length; k++) {
            var item = container[k];
            if (item.isValid) {
                if (item.linkType == "story")
                    processStory(physPage, container, item, pageDoc);
            }
        }

        // Process reladed elements after 
        for (var k = 0; k < container.length; k++) {
            var item = container[k];
            if (item.isValid) {
                if (item.linkType == "image")
                    processImage(physPage, container, item, pageDoc);
                else if (item.linkType == "graphic")
                    processGraphic(physPage, container, item, pageDoc);
                //else if ( item.linkType == "video") processVideo(physPage, container, item, pageDoc);
            }
        }
    }

}

// Write Page
function writePage(physPage) {
    _print("writePage: " + physPage.path);

    if (physPage.isSecondPage) {
        _print("writePage: " + physPage.path + " is Second Page");
        return;
    }

    var pageDoc = XOM.build(filterXml(new File(ZIP_DIR, physPage.path)), null);

    var pageElement = new Element("page");
    var metaElement = new Element("metadata");
    pageElement.appendChild(metaElement);

    // Base Meta
    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("extRef", physPage.loid));
    metaElement.appendChild(createElement("issueDate", INVDATE));
    metaElement.appendChild(createElement("permission", 0));

    // Extra meta
    metaElement.appendChild(createElement("product", physPage.product));
    metaElement.appendChild(createElement("book", physPage.book));
    metaElement.appendChild(createElement("pn", physPage.pn));
    metaElement.appendChild(createElement("sequence", physPage.sequence));
    metaElement.appendChild(createElement("color", physPage.color));

    var editions = new Element("editions");
    editions.appendChild(createElement("edition", physPage.edition));
    metaElement.appendChild(editions);

    var categories = new Element("categories");
    categories.appendChild(createElement("category", physPage.section));
    metaElement.appendChild(categories);

    // On ajoute les items
    // TODO: ajouter les contents et les shape
    var objectLinks = new Element("objectLinks");
    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", "pageplan"));
    objectLink.addAttribute(new Attribute("extRef", PLAN_NAME));
    objectLinks.appendChild(objectLink);

    metaElement.appendChild(objectLinks);

    var links = physPage.links;
    if (links.length > 0) {
        var virtualPagesElement = new Element("virtualPages");
        for (var i = 0; i < links.length; i++) {
            var virtualPageElement = new Element("virtualPage");
            var linkedPage = links[i];
            editions.appendChild(createElement("edition", linkedPage.edition));

            virtualPageElement.addAttribute(new Attribute("product", linkedPage.product));
            virtualPageElement.addAttribute(new Attribute("edition", linkedPage.edition));
            virtualPageElement.addAttribute(new Attribute("book", linkedPage.book));
            virtualPageElement.addAttribute(new Attribute("pn", linkedPage.pn));
            virtualPageElement.addAttribute(new Attribute("sequence", linkedPage.sequence));
            virtualPageElement.addAttribute(new Attribute("color", linkedPage.color));
            virtualPagesElement.appendChild(virtualPageElement);
        }
        metaElement.appendChild(virtualPagesElement);
    }

    var contentElement = new Element("content");
    pageElement.appendChild(contentElement);

    var phys = [physPage];
    if (physPage.doublePage != null) {
        _print("Traitement page double: " + physPage.path + " - " + physPage.doublePage.path);
        phys.push(physPage.doublePage);
    }

    var lastPdfSrcFile = null;
    var items = new Array();
    for (var h = 0; h < phys.length; h++) {
        var phy = phys[h];
        var doc = (h == 0) ? pageDoc : XOM.build(filterXml(new File(ZIP_DIR, phy.path)), null);

        // Object Link
        var containers = phy.containers;
        for (var i = 0; i < containers.length; i++) {
            var container = containers[i];
            var item = null;
            for (var j = 0; j < container.length; j++) {
                item = container[j];
                if (item.linkType == "story")
                    if (item.isValid) {
                        break;
                    }
            }

            if (item != null && item.isValid) {
                // TODO: il faut merger le contenu des items avant d'exclure le second item
                // car il est possible que les 2 items avec le même loid ne comportent pas les
                // même contenu (image, texte) car ceux-ci sont sur 2 pages différentes
                if (phys.length == 1 || !contains(items, item.loid)) {
                    if (phys.length > 1)
                        items.push(item.loid);
                    objectLink = new Element("objectLink");
                    objectLink.addAttribute(new Attribute("linkType", item.linkType));
                    objectLink.addAttribute(new Attribute("extRef", item.loid));
                    objectLinks.appendChild(objectLink);
                }
            }
        }

        // Write PDF & JPEG
        var suffix = (phys.length == 1) ? "" : "_" + PAGE_ARRAY[h];
        var dPath = DATE_PATH + "page/" + phy.loid + suffix;
        var xmlSrcFile = new File(ZIP_DIR, phy.path);
        var pdfSrcName = FilenameUtils.getBaseName(phy.path) + ".pdf";
        var pdfSrcFile = new File(xmlSrcFile.getParentFile().getParent() + "/Media/", pdfSrcName);
        if (pdfSrcFile.exists()) {
            var pdfDstFile = new File(dPath + ".pdf");
            var previewFile = new File(dPath + "_preview.jpg");
            var thumbFile = new File(dPath + "_thumb.jpg");
            contentElement.appendChild(createElement("uri", pdfDstFile.getName()));
            contentElement.appendChild(createElement("uri", previewFile.getName()));
            contentElement.appendChild(createElement("uri", thumbFile.getName()));
            asyncConvertPdf(pdfSrcFile, pdfDstFile, previewFile, thumbFile, 20);
            //convertPdf(pdfSrcFile, pdfDstFile, previewFile, thumbFile, 20);
            if (h == 1) {
                createPdfPano(contentElement, phy.loid, lastPdfSrcFile, pdfSrcFile, DATE_PATH + "page/" + phy.loid);
            }
            lastPdfSrcFile = pdfSrcFile;
        }
        else {
            _print("Le fichier PDF " + pdfSrcFile + " n'existe pas!");
        }

        // Write Pages Containers
        var containers = phy.containers;
        for (var j = 0; j < containers.length; j++) {
            var container = containers[j];
            for (var k = 0; k < container.length; k++) {
                var item = container[k];
                if (item != null && item.isValid) {
                    // TODO : si secondPage, teste si story existe
                    // Si oui merge story, sinon writeStory
                    if (item.linkType == "story")
                        writeStory(phy, container, item, doc);
                    else if (item.linkType == "image")
                        writeImage(phy, container, item, doc);
                    else if (item.linkType == "graphic")
                        writeGraphic(phy, container, item, doc);
                }
            }
        }
    }

    // Write Page
    var dPath = DATE_PATH + "page/" + physPage.loid;
    var dstFile = new File(dPath + ".xml");
    writeElement(pageElement, dstFile);
}

function createPdfPano(contentElement, loid, file1, file2, oPath) {
    if (file1 == null) {
        _print("Le fichier PDF n'est pas defini!");
        return;
    }

    var pdfSrcFile = new File(file1.getParentFile(), loid + "_full.pdf");

    var MM = NumUtils.MMtoPT;
    var pdfTool = new PdfTool();
    pdfTool.addFilter(new Concat(pdfSrcFile.getPath()));
    pdfTool.addFilter(new Impose(null, 560 * MM, 380 * MM, Impose.SIMPLE, 0, 0, 280 * MM, 0));
    pdfTool.execute([file1, file2]);

    var pdfDstFile = new File(oPath + "_full.pdf");
    var previewFile = new File(oPath + "_full_preview.jpg");
    var thumbFile = new File(oPath + "_full_thumb.jpg");
    contentElement.appendChild(createElement("uri", pdfDstFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));
    asyncConvertPdf(pdfSrcFile, pdfDstFile, previewFile, thumbFile, 20);
}

// Create a affine transform
// contentTm="translate(-1.266015 17.14975) scale(1.210914 1.210914)">
function createAffine(contentNodes) {

    var tr = [0, 0];
    var sc = [1, 1];
    var rt = [0];

    if (contentNodes.size() > 0) {
        var str = contentNodes.get(0).getAttributeValue("contentTm") + "";

        if (TRANS_RE.test(str)) {
            tr = str.replace(TRANS_RE, "$1").split(" ");
        }
        if (SCALE_RE.test(str)) {
            sc = str.replace(SCALE_RE, "$1").split(" ");
        }
        if (ROTATE_RE.test(str)) {
            rt = str.replace(ROTATE_RE, "$1").split(" ");
        }
    }

    return {
        tx: tr[0],
        ty: tr[1],
        sx: sc[0],
        sy: sc[1],
        ro: rt[0]
    };
}

// Create a shape
function createShape(shapeNodes, shape) {
    var x1, y1, x2, y2;

    if (shape == null) {
        x1 = 99999999;
        y1 = 99999999;
        x2 = -99999999;
        y2 = -99999999;
    }
    else {
        x1 = shape.x1;
        y1 = shape.y1;
        x2 = shape.x2;
        y2 = shape.y2;
    }

    for (var i = 0; i < shapeNodes.size(); i++) {
        var shapeNode = shapeNodes.get(i);
        var x = shapeNode.getAttributeValue("shapeX");
        if (x != null)
            x = parseFloat(x);

        var y = shapeNode.getAttributeValue("shapeY");
        if (y != null)
            y = parseFloat(y);

        var xx = shapeNode.getAttributeValue("shapeWidth");
        if (xx != null)
            xx = x + parseFloat(xx);

        var yy = shapeNode.getAttributeValue("shapeHeight");
        if (yy != null)
            yy = y + parseFloat(yy);

        if (x != null && y != null && xx != null && yy != null) {
            if (x < x1)
                x1 = x;
            if (y < y1)
                y1 = y;
            if (xx > x2)
                x2 = xx;
            if (yy > y2)
                y2 = yy;
        }
    }

    if (x2 < x1)
        x2 = x1;

    if (y2 < y1)
        y2 = y1;

    return {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2
    };
}

// Process Story
function processStory(physPage, container, storyItem, pageDoc) {
    //_print("processStory " + storyFile);

    var doubleStoryItem = getPageStoryItem(storyItem.loid, physPage.doublePage);

    // Add page to story set
    addStoryPage(storyItem.loid, physPage);

    // Add Shape from a former shape (if second page)  
    var parentNodes = pageDoc.query("/page/pxpStories/pxpStory/content[@contentLoid='" + storyItem.loid + "']/..");
    if (parentNodes.size() > 0) {
        var shapeNodes = parentNodes.get(0).query("content/shape");
        if (doubleStoryItem != null) {
            doubleStoryItem.shape = storyItem.shape = createShape(shapeNodes, doubleStoryItem.shape);
            _print("Story: " + storyItem.loid + " - shapes are spread on both pages");
        }
        else {
            storyItem.shape = createShape(shapeNodes, null);
        }
    }
    else {
        _print("Story: " + storyItem.loid + " undefined parent!");
    }

    // Item node
    var itemNode = pageDoc.query("/page/items/item[@loid='" + storyItem.loid + "']").get(0);

    // Correlation et media Gallery
    var correlationNodes = itemNode.query("correlations/correlation");
    for (var i = 0; i < correlationNodes.size(); i++) {
        var correlationNode = correlationNodes.get(i);
        var type = correlationNode.getAttributeValue("type");
        var loid = correlationNode.getAttributeValue("loid");
        var uuid = correlationNode.getAttributeValue("uuid");
        if (type == "EOM::MediaGallery") {
            var galleryItem = createItem("gallery", loid, uuid, -1, "", 0);
            processGallery(physPage, storyItem, galleryItem, pageDoc);
            if (galleryItem.isValid)
                storyItem.items.push(galleryItem);
        }
        else if (type == "Video") {
            var url = correlationNode.getAttributeValue("url");
            if (loid == "external object")
                loid = UUID.randomUUID();
            var videoItem = createItem("video", loid, uuid, -1, url, 0);
            processVideo(physPage, storyItem, videoItem, pageDoc);
            if (videoItem.isValid)
                storyItem.items.push(videoItem);
        }
    }

    // Ours
    var nodes = itemNode.query("doc/article/texte");
    for (var i = 0; i < nodes.size(); i++) {
        var txt = nodes.get(i).getValue();
        if (txt.indexOf("les Editions Philippe AMAURY") > 0) {
            _print("Story: " + storyItem.loid + " filtered - ours!");
            storyItem.isValid = false;
            break;
        }
    }

    // Number of chars
    var mycharsCount = 0;
    var nodes = itemNode.query("doc/article/texte");
    for (var i = 0; i < nodes.size(); i++) {
        var txt = nodes.get(i).getValue();
        mycharsCount += txt.length();
    }

    var nodes = itemNode.query("doc/article/titraille");
    for (var i = 0; i < nodes.size(); i++) {
        var txt = nodes.get(i).getValue();
        mycharsCount += txt.length();
    }

    var charsCount = getValue(itemNode, "doc/dbMetadata/sys/props/charsCount");
    if (storyItem.items.length == 0 && charsCount < 100 && mycharsCount < 100) {
        _print("Story: " + storyItem.loid + " filtered - too small text! - Page: " + physPage.sequence + " -  charsCount: " + charsCount);
        storyItem.isValid = false;
    }

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
            else if (tag == "pbox") {
                node.getParent().removeChild(node);
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

    var nodes = itemNode.query("doc/article/titraille/surtitre/descendant-or-self::*");
    processTags(nodes);

    var headingNode = new Element("heading");

    nodes = itemNode.query("doc/article/titraille/heading/*");
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
    processTags(itemNode.query("doc/article/titraille/titre/descendant-or-self::*"));
    return addToElement(itemNode.query("doc/article/titraille/title/*"), new Element("title"));
}

function createSubTitleTag(itemNode) {
    processTags(itemNode.query("doc/article/titraille/soustitre/descendant-or-self::*"));
    return addToElement(itemNode.query("doc/article/titraille/subtitle/*"), new Element("subtitle"));
}

function createLeadTag(itemNode) {
    processTags(itemNode.query("doc/article/titraille/chapo/descendant-or-self::*"));
    return addToElement(itemNode.query("doc/article/titraille/lead/*"), new Element("lead"));
}

function createTexteTag(itemNode) {

    var nodes = itemNode.query("doc/article/texte/descendant-or-self::* | doc/article/tables/descendant-or-self::*");
    processTags(nodes);

    var textNode = new Element("text");

    nodes = itemNode.query("doc/article/text");
    var size = nodes.size();

    // Special processing for course performance tabs
    if (size > 4) {
        _print("createTexteTag - multi text nodes - size: " + size);
        nodes = itemNode.query("doc/article/text/*");
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
            nodes = itemNode.query("doc/article/text[" + (maxInd + 1) + "]/*");
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
function writeStory(physPage, container, storyItem, pageDoc) {
    _print("writeStory - processing : " + storyItem.loid);

    //var itemNode = pageDoc.query("/page/items/item[@loid='" + storyItem.loid + "']").get(0);
    var itemNodes = pageDoc.query("/page/items/item[@loid='" + storyItem.loid + "']");

    if (itemNodes.size() < 1) {
        _print("writeStory - error : " + physPage.path);
        _print("writeStory - error : " + physPage.path2);
        return;
    }

    var itemNode = itemNodes.get(0);

    var charsCountElt = createElement("charsCount", getValue(itemNode, "doc/dbMetadata/sys/props/charsCount"));
    var wordCountElt = createElement("wordCount", getValue(itemNode, "doc/dbMetadata/sys/props/wordCount"));

    // Create XML
    var storyElement = new Element("story");
    var metaElement = new Element("metadata");
    storyElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", INVDATE));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("product", physPage.product));
    metaElement.appendChild(createElement("extRef", storyItem.loid));
    metaElement.appendChild(charsCountElt);
    metaElement.appendChild(wordCountElt);
    var city = getValue(itemNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/City_Name");
    if (city != null) {
        var tmp = city.split("/");
        metaElement.appendChild(createElement("city", tmp[0]));
        metaElement.appendChild(createElement("zipcode", (tmp[1] == null) ? '' : tmp[1]));
    }
    else {
        metaElement.appendChild(createElement("city", ""));
        metaElement.appendChild(createElement("zipcode", ""));
    }
    metaElement.appendChild(createElement("province", getValue(itemNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Province_Name")));
    metaElement.appendChild(createElement("country", getValue(itemNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Country")));
    var address = getValue(itemNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Address");
    metaElement.appendChild(createElement("address", address.replace('_', ' ').replace('_', ' ')));


    var pages = getStoryPage(storyItem.loid);

    var editionsElement = new Element("editions");
    for (var k = 0; k < pages.length; k++) {
        var page = pages[k];  // PhysPage
        editionsElement.appendChild(createElement("edition", page.edition));
        for (var j = 0; j < page.links.length; j++) {
            editionsElement.appendChild(createElement("edition", page.links[j].edition));
        }
    }
    metaElement.appendChild(editionsElement);

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", (getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + "").replace("Rituel", physPage.section)));
    catElement.appendChild(createElement("pageCategory", physPage.section));
    metaElement.appendChild(catElement);

    var keyElement = new Element("keywords");
    keyElement.appendChild(createElement("keyword", getValue(itemNode, "doc/dbMetadata/Metadata/General/DocKeyword") + ""));
    metaElement.appendChild(keyElement);

    var txt = trim(getValue(itemNode, "doc/dbMetadata/Metadata/General/DocAuthor")) + "";
    var creatorElement = (txt.length > 0 && txt != "system") ? createElement("creator", txt) : new Element("creator");
    metaElement.appendChild(creatorElement);

    var authorsElement = new Element("authors");
    metaElement.appendChild(authorsElement);

    // Shape
    if (storyItem.shape != null) {
        var shape = storyItem.shape;
        var shapeElement = new Element("shape");
        metaElement.appendChild(shapeElement);
        shapeElement.addAttribute(new Attribute("x1", round1(shape.x1).toString()));
        shapeElement.addAttribute(new Attribute("y1", round1(shape.y1).toString()));
        shapeElement.addAttribute(new Attribute("x2", round1(shape.x2).toString()));
        shapeElement.addAttribute(new Attribute("y2", round1(shape.y2).toString()));
    }
    else {
        _print("writeStory: shape not defined");
    }

    // Publication channel
    var webElement = new Element("webChannel");
    metaElement.appendChild(webElement);

    webElement.appendChild(createElement("theme", getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Web/Theme") + ""));
    webElement.appendChild(createElement("status", getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Web/Status") + ""));
    webElement.appendChild(createElement("comment", getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Web/Comment") + ""));
    webElement.appendChild(createElement("profile", getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Web/Profile") + ""));
    webElement.appendChild(createElement("priority", getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Digital/Priority") + ""));

    var topicsList = getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Web/TopicsList") + "";
    var topics = topicsList.split('\*');
    var topicsElement = new Element("topics");
    for (var l = 0; l < topics.length - 1; l++) {
        topicsElement.appendChild(createElement("topic", topics[l] + ""));
    }
    webElement.appendChild(topicsElement);

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    // Add page link 
    for (var k = 0; k < pages.length; k++) {
        var objectLink = new Element("objectLink");
        objectLink.addAttribute(new Attribute("linkType", "page"));
        objectLink.addAttribute(new Attribute("extRef", pages[k].loid));
        objectLinks.appendChild(objectLink);
    }

    // Add non story link
    for (var k = 0; k < container.length; k++) {
        var item = container[k];
        if (item.isValid && item.linkType != "story") {
            objectLink = new Element("objectLink");
            objectLink.addAttribute(new Attribute("linkType", item.linkType));
            objectLink.addAttribute(new Attribute("extRef", item.loid));
            objectLinks.appendChild(objectLink);
        }
    }

    // Add story link
    for (var k = 0; k < storyItem.items.length; k++) {
        item = storyItem.items[k];
        objectLink = new Element("objectLink");
        objectLink.addAttribute(new Attribute("linkType", item.linkType));
        objectLink.addAttribute(new Attribute("extRef", item.loid));
        objectLinks.appendChild(objectLink);
        if (item.linkType == "gallery")
            writeGallery(physPage, storyItem, item, pageDoc);
        else if (item.linkType == "video")
            writeVideo(physPage, storyItem, item, pageDoc);
    }

    var contentElement = new Element("content");
    storyElement.appendChild(contentElement);
    contentElement.appendChild(createHeadingTag(itemNode));
    contentElement.appendChild(createTitleTag(itemNode));
    contentElement.appendChild(createSubTitleTag(itemNode));
    contentElement.appendChild(createLeadTag(itemNode));
    contentElement.appendChild(createTexteTag(itemNode));

    // Process CharCount & WordCount
    var cntValue = contentElement.getValue() + "";
    charsCountElt.getChild(0).setValue(cntValue.length);
    wordCountElt.getChild(0).setValue(cntValue.length == 0 ? 0 : cntValue.split(' ').length);

    // Process ByLine authors
    var authorList = [];
    var txt = trim(getValue(itemNode, "doc/dbMetadata/Metadata/General/Custom_by-line")) + "";
    var authors = cleanAuthor(txt);
    for (var j = 0; j < authors.length; j++) {
        if (!containsIgnoreCase(authorList, authors[j]))
            authorList.push(authors[j]);
    }

    // Process Signature authors
    var signNodes = contentElement.query("//signature");
    for (var i = 0; i < signNodes.size(); i++) {
        var authors = cleanAuthor(signNodes.get(i).getValue());
        for (var j = 0; j < authors.length; j++) {
            if (!containsIgnoreCase(authorList, authors[j]))
                authorList.push(authors[j]);
        }
    }

    // Add authors to XML
    for (var j = 0; j < authorList.length; j++) {
        authorsElement.appendChild(createElement("author", authorList[j]));
    }

    // Write Story
    var dstPath = DATE_PATH + "story/" + storyItem.loid + ".xml";
    var dstFile = new File(dstPath);
    writeElement(storyElement, dstFile);
}

// Return an array of author 
function cleanAuthor(str) {
    str = trim(str) + "";
    str = str.replace(/propos recueillis par/i, "");
    str = str.replace(/^pages .*/i, "");
    str = str.replace(/^page .*/i, "");
    str = str.replace(/^et /i, "");
    str = str.replace(/^avec /i, "");
    str = str.replace(/ et /i, ",");
    str = str.replace(/ avec /i, ",");
    str = str.replace(/(.*)\(.*\)(.*)/i, "$1$2");
    var authors = [];
    var array = str.split(",");
    for (var i = 0; i < array.length; i++) {
        var author = WordUtils.capitalizeFully(trim(array[i]), SEP_ARRAY) + "";
        if (author.length > 0)
            authors.push(author);
    }
    return authors;
}

// TODO:
// Les photos dans la media gallery ne sont pas identifiees par des loid
// il est par consequent difficile de les traiter coimme les autres photos !
// Voir avec EidosMedia pour refaire cette partie
function processGallery(physPage, storyItem, galleryItem, pageDoc) {
    _print("processGallery - processing : " + galleryItem.loid);

    var galleryNode = pageDoc.query("/page/items/item[@loid='" + galleryItem.loid + "']").get(0);
    var photoNodes = galleryNode.query("doc/article/galerie/photo-groupe");

    for (var i = 0; i < photoNodes.size(); i++) {
        var photoNode = photoNodes.get(i);
        var fgPhotoNodes = photoNode.query("fg-photo");
        if (fgPhotoNodes.size() > 0) {
            var path = fgPhotoNodes.get(0).getAttributeValue("fileref");
            // "/LP/Divers/aremond_1280930985644.jpg?uuid=f205cad6-9fd1-11df-a98a-00144f6f4ec8"
            var uuid = path.substring(path.lastIndexOf("=") + 1);
            path = FilenameUtils.getFullPath(physPage.path) + "../Media/";
            path = FilenameUtils.normalize(path) + uuid + "_original.jpg";
            var imageFile = new File(ZIP_DIR, path);
            if (imageFile.exists()) {
                // Filter Image
                var imageInfo = ScriptUtils.getImageInfo(imageFile);
                if (imageInfo == null || imageInfo.getWidth() < 1 || imageInfo.getHeight() < 1) {
                    _print("imagegal: " + imageFile.getPath() + " not a valid image!");
                }
                else {
                    galleryItem.items.push(createItem("imagegal", uuid, uuid, -1, path, i));
                }
            }
            else {
                _print("imagegal: " + imageFile + " does not exist!");
            }
        }
        else {
            _print("imagegal: aucune image prÃ©sente");
        }
    }

    if (galleryItem.items.length == 0) {
        galleryItem.isValid = false;
        _print("gallery: aucune image dans la galerie");
    }
}

// Buid XML & write gallery
function writeGallery(physPage, storyItem, galleryItem, pageDoc) {
    _print("writeGallery - processing : " + galleryItem.loid);

    var itemNode = pageDoc.query("/page/items/item[@loid='" + galleryItem.loid + "']").get(0);

    var charsCountElt = createElement("charsCount", getValue(itemNode, "doc/dbMetadata/sys/props/charsCount"));
    var wordCountElt = createElement("wordCount", getValue(itemNode, "doc/dbMetadata/sys/props/wordCount"));

    var galleryElement = new Element("gallery");
    var metaElement = new Element("metadata");
    galleryElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", INVDATE));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("product", physPage.product));
    metaElement.appendChild(createElement("extRef", galleryItem.loid));
    metaElement.appendChild(charsCountElt);
    metaElement.appendChild(wordCountElt);
    metaElement.appendChild(createElement("city", getValue(itemNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/City_Name")));
    metaElement.appendChild(createElement("country", getValue(itemNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Country")));
    metaElement.appendChild(createElement("address", getValue(itemNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Address")));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + ""));
    metaElement.appendChild(catElement);

    var keyElement = new Element("keywords");
    keyElement.appendChild(createElement("keyword", getValue(itemNode, "doc/dbMetadata/Metadata/General/DocKeyword") + ""));
    metaElement.appendChild(keyElement);

    var authorsElement = new Element("authors");
    metaElement.appendChild(authorsElement);

    // Publication channel
    var webElement = new Element("webChannel");
    metaElement.appendChild(webElement);

    webElement.appendChild(createElement("status", getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Web/Status") + ""));
    webElement.appendChild(createElement("comment", getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Web/Comment") + ""));
    webElement.appendChild(createElement("profile", getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Web/Profile") + ""));
    webElement.appendChild(createElement("priority", getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Digital/Priority") + ""));

    var topicsList = getValue(itemNode, "doc/dbMetadata/Metadata/PubData/Web/TopicsList") + "";
    var topics = topicsList.split('\*');
    var topicsElement = new Element("topics");
    for (l = 0; l < topics.length - 1; l++) {
        topicsElement.appendChild(createElement("topic", topics[l] + ""));
    }
    webElement.appendChild(topicsElement);

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", storyItem.linkType));
    objectLink.addAttribute(new Attribute("extRef", storyItem.loid));
    objectLinks.appendChild(objectLink);

    for (var k = 0; k < galleryItem.items.length; k++) {
        var item = galleryItem.items[k];
        if (item.isValid) {
            if (item.linkType == "imagegal") {
                objectLink = new Element("objectLink");
                objectLink.addAttribute(new Attribute("linkType", "image"));
                objectLink.addAttribute(new Attribute("extRef", item.loid));
                objectLinks.appendChild(objectLink);
                writeImageGal(physPage, galleryItem, item, pageDoc);
            }
        }
    }

    var contentElement = new Element("content");
    galleryElement.appendChild(contentElement);
    contentElement.appendChild(createHeadingTag(itemNode));
    contentElement.appendChild(createTitleTag(itemNode));
    contentElement.appendChild(createSubTitleTag(itemNode));
    contentElement.appendChild(createLeadTag(itemNode));
    contentElement.appendChild(createTexteTag(itemNode));

    // Process CharCount & WordCount
    var cntValue = contentElement.getValue() + "";
    charsCountElt.getChild(0).setValue(cntValue.length);
    wordCountElt.getChild(0).setValue(cntValue.length == 0 ? 0 : cntValue.split(' ').length);

    // Process ByLine authors
    var authorList = [];
    var txt = trim(getValue(itemNode, "doc/dbMetadata/Metadata/General/Custom_by-line")) + "";
    var authors = cleanAuthor(txt);
    for (var j = 0; j < authors.length; j++) {
        if (!containsIgnoreCase(authorList, authors[j]))
            authorList.push(authors[j]);
    }

    // Process Signature authors
    var signNodes = contentElement.query("//signature");
    for (var i = 0; i < signNodes.size(); i++) {
        var authors = cleanAuthor(signNodes.get(i).getValue());
        for (var j = 0; j < authors.length; j++) {
            if (!containsIgnoreCase(authorList, authors[j]))
                authorList.push(authors[j]);
        }
    }

    // Add authors to XML
    for (var j = 0; j < authorList.length; j++) {
        authorsElement.appendChild(createElement("author", authorList[j]));
    }

    // Write Gallery
    var dstPath = DATE_PATH + "gallery/" + galleryItem.loid + ".xml";
    var dstFile = new File(dstPath);
    writeElement(galleryElement, dstFile);
}

// Write Image (from gallery)
// TODO: complete attributes
function writeImageGal(physPage, galleryItem, imageItem, pageDoc) {
    //_print("writeImageGal: " + item.loid);                    

    var imageFile = new File(ZIP_DIR, imageItem.path);

    var imageElement = new Element("image");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", INVDATE));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("product", physPage.product));
    metaElement.appendChild(createElement("extRef", imageItem.loid));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", physPage.section));
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

    var dstPath = DATE_PATH + "image/" + imageItem.loid;
    var jpgDstFile = new File(dstPath + ".jpg");
    var previewFile = new File(dstPath + "_preview.jpg");
    var thumbFile = new File(dstPath + "_thumb.jpg");

    var contentElement = new Element("content");
    imageElement.appendChild(contentElement);

    contentElement.appendChild(createElement("uri", jpgDstFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));
    asyncConvertImage(imageFile, jpgDstFile, previewFile, thumbFile);
    //convertImage(imageFile, jpgDstFile, previewFile, thumbFile);

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", galleryItem.linkType));
    objectLink.addAttribute(new Attribute("extRef", galleryItem.loid));
    objectLinks.appendChild(objectLink);

    var itemNode = pageDoc.query("/page/items/item[@loid='" + galleryItem.loid + "']").get(0);
    var photoNodes = itemNode.query("doc/article/galerie/photo-groupe");
    var photoNode = photoNodes.get(imageItem.index);
    contentElement.appendChild(createElement("caption", trim(getValue(photoNode, "photo-legende"))));
    contentElement.appendChild(createElement("credit", trim(getValue(photoNode, "photo-credit"))));

    // TODO : extract image page and copy to destination

    // Write Image Element
    var dstFile = new File(dstPath + ".xml");
    writeElement(imageElement, dstFile);
}

// Process image
function processImage(physPage, container, imageItem, pageDoc) {
    var imageFile = new File(ZIP_DIR, imageItem.path);
    if (imageFile.exists()) {

        //var itemNode = pageDoc.query("/page/items/item[@loid='" + imageItem.loid + "']").get(0);

        // Add Affine
        var contentNodes = pageDoc.query("/page/pxpStories/pxpStory/content[@contentLoid='" + imageItem.loid + "']");
        imageItem.affine = createAffine(contentNodes);

        // Add Shape   
        var shapeNodes = pageDoc.query("/page/pxpStories/pxpStory/content[@contentLoid='" + imageItem.loid + "']/shape");
        imageItem.shape = createShape(shapeNodes);

        // TODO: test if shape does not belong to a story but is contained in a story shape
        // If so detach image from page and attach it to the story

        // Filter Image
        var imageInfo = ScriptUtils.getImageInfo(imageFile);
        if (imageInfo == null || imageInfo.getWidth() < 1 || imageInfo.getHeight() < 1) {
            _print("Image: " + imageItem.loid + " filtered - invalid image! Page: " + physPage.sequence + " - " + imageFile.getPath());
            imageItem.isValid = false;
        }

        else if (imageInfo.getWidth() < 150 || imageInfo.getHeight() < 150) {
            _print("Image: " + imageItem.loid + " filtered - too small (or invalid) image! Page: " + physPage.sequence + " - " + imageFile.getPath() + " - " + imageInfo.getWidth() + "x" + imageInfo.getHeight());
            imageItem.isValid = false;
        }

        else if (imageFile.length() < 40000) {
            _print("Image: " + imageItem.loid + " filtered - too slim image! Page: " + physPage.sequence + " - " + imageFile.getPath() + " - " + imageFile.length() + " bytes");
            imageItem.isValid = false;
        }

    }
    else {
        // TODO: supprimer l'image de la page'
        _print("Image: " + imageItem.loid + " - Page: " + physPage.sequence + " -  " + imageFile.getPath() + " does not exist!");
        imageItem.isValid = false;
    }
}

// Build XML & write Image
// TODO: complete attributes
function writeImage(physPage, container, imageItem, pageDoc) {
    _print("writeImage - processing : " + imageItem.loid);

    var imageFile = new File(ZIP_DIR, imageItem.path);
    var imageElement = new Element("image");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", INVDATE));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("product", physPage.product));
    metaElement.appendChild(createElement("extRef", imageItem.loid));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", physPage.section));
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

    // Shape
    if (imageItem.shape != null) {
        var shape = imageItem.shape;
        var shapeElement = new Element("shape");
        metaElement.appendChild(shapeElement);
        shapeElement.addAttribute(new Attribute("x1", round1(shape.x1).toString()));
        shapeElement.addAttribute(new Attribute("y1", round1(shape.y1).toString()));
        shapeElement.addAttribute(new Attribute("x2", round1(shape.x2).toString()));
        shapeElement.addAttribute(new Attribute("y2", round1(shape.y2).toString()));
    }
    else {
        _print("writeImage: shape not defined");
    }

    var dstPath = DATE_PATH + "image/" + imageItem.loid;
    var jpgDstFile = new File(dstPath + ".jpg");
    var previewFile = new File(dstPath + "_preview.jpg");
    var thumbFile = new File(dstPath + "_thumb.jpg");

    var contentElement = new Element("content");
    imageElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", jpgDstFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));

    // Convert and resize Image to Jpeg
    asyncConvertImage2(imageFile, jpgDstFile, previewFile, thumbFile, imageItem.shape, imageItem.affine);
    //convertImage2(imageFile, jpgDstFile, previewFile, thumbFile, imageItem.shape, imageItem.affine);

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var item = createItem("page", physPage.loid, 0, -1, "", 0);
    for (var k = 0; k < container.length; k++) {
        var itm2 = container[k];
        if (itm2.linkType == "story") {
            item = itm2;
            if (item.isValid) {
                // TODO: mettre en cap la 1ere lettre
                var storyNodes = pageDoc.query("/page/items/item[@loid='" + item.loid + "']");
                var storyNode = storyNodes.get(0);
                contentElement.appendChild(createElement("caption", trim(getValue(storyNode, "doc/article/photo-groupe/photo-legende[" + imageItem.index + "]"))));
                contentElement.appendChild(createElement("credit", trim(getValue(storyNode, "doc/article/photo-groupe/photo-legende[" + imageItem.index + "]//credit"))));

                var correlationsNodes = storyNode.query("correlations/correlation");
                for (var i = 0; i < correlationsNodes.size(); i++) {
                    var correlationsNode = correlationsNodes.get(i);
                    var correlationLoid = correlationsNode.getAttributeValue("loid");
                    if (correlationLoid.equals(imageItem.loid)) {
                        var legend = getValue(correlationsNode, "dbMetadata/Metadata/Web/Legend");
                        metaElement.appendChild(createElement("subject", legend + ""));
                    }
                }
                break;
            }
        }
    }

    if (item.isValid) {
        var objectLink = new Element("objectLink");
        objectLink.addAttribute(new Attribute("linkType", item.linkType));
        objectLink.addAttribute(new Attribute("extRef", item.loid));
        objectLinks.appendChild(objectLink);
    }

    // Write Image Element
    var dstFile = new File(dstPath + ".xml");
    writeElement(imageElement, dstFile);
}

// Process graphic
function processGraphic(physPage, container, graphicItem, pageDoc) {
    //_print("processGraphic: " + graphicItem.path);
    var graphicFile = new File(ZIP_DIR, graphicItem.path);
    if (graphicFile.exists()) {

        // Add Affine
        var contentNodes = pageDoc.query("/page/pxpStories/pxpStory/content[@contentLoid='" + graphicItem.loid + "']");
        graphicItem.affine = createAffine(contentNodes);

        // Add Shape   
        var shapeNodes = pageDoc.query("/page/pxpStories/pxpStory/content[@contentLoid='" + graphicItem.loid + "']/shape");
        graphicItem.shape = createShape(shapeNodes);
        if (graphicItem.shape == null) {
            _print("Image: " + graphicItem.loid + " unvalid shape!");
        }

        if (graphicFile.length() < 40000) {
            _print("Graphic: " + graphicItem.loid + " filtered - too slim graphic! Page: " + physPage.sequence + " - " + graphicFile.getPath() + " - " + graphicFile.length() + " bytes");
            graphicItem.isValid = false;
        }

        //var itemNode = pageDoc.query("/page/items/item[@loid='" + graphicItem.loid + "']").get(0);

        // Filter
    }
    else {
        // TODO: supprimer l'image de la page'
        _print("Graphic: " + graphicItem.loid + " - Page: " + physPage.sequence + " -  " + graphicFile.getPath() + " does not exist!");
        graphicItem.isValid = false;
    }
}

// Write graphic
// TODO: complete attributes
function writeGraphic(physPage, container, graphicItem, pageDoc) {
    _print("writeGraphic - processing : " + graphicItem.loid);

    var graphicFile = new File(ZIP_DIR, graphicItem.path);
    var graphicElement = new Element("graphic");
    var metaElement = new Element("metadata");
    graphicElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", INVDATE));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("product", physPage.product));
    metaElement.appendChild(createElement("extRef", graphicItem.loid));
    metaElement.appendChild(createElement("city", ""));
    metaElement.appendChild(createElement("country", ""));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", physPage.section));
    metaElement.appendChild(catElement);

    // Shape
    if (graphicItem.shape != null) {
        var shape = graphicItem.shape;
        var shapeElement = new Element("shape");
        metaElement.appendChild(shapeElement);
        shapeElement.addAttribute(new Attribute("x1", round1(shape.x1).toString()));
        shapeElement.addAttribute(new Attribute("y1", round1(shape.y1).toString()));
        shapeElement.addAttribute(new Attribute("x2", round1(shape.x2).toString()));
        shapeElement.addAttribute(new Attribute("y2", round1(shape.y2).toString()));
    }
    else {
        _print("writeImage: shape not defined");
    }

    var dstPath = DATE_PATH + "graphic/" + graphicItem.loid;
    var imageInfo = ScriptUtils.getImageInfo(graphicFile);
    var ext = (imageInfo == null) ? "pdf" : "jpg";

    var graphicDstFile = new File(dstPath + "." + ext);
    var previewFile = new File(dstPath + "_preview.jpg");
    var thumbFile = new File(dstPath + "_thumb.jpg");

    var contentElement = new Element("content");
    graphicElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", graphicDstFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));

    if (ext == "pdf") {
        asyncConvertPdf(graphicFile, graphicDstFile, previewFile, thumbFile, 40);
    }
    else {
        asyncConvertImage2(graphicFile, graphicDstFile, previewFile, thumbFile, graphicItem.shape, graphicItem.affine);
    }

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var item = createItem("page", physPage.loid, 0, -1, "", 0);
    for (var k = 0; k < container.length; k++) {
        var itm2 = container[k];
        if (itm2.linkType == "story") {
            item = itm2;
            if (item.isValid) {
                // TODO: tenir compte de l'ordre des lÃ©gendes dans le texte
                var storyNode = pageDoc.query("/page/items/item[@loid='" + item.loid + "']").get(0);
                contentElement.appendChild(createElement("caption", trim(getValue(storyNode, "doc/article/photo-groupe/photo-legende[" + graphicItem.index + "]"))));
                contentElement.appendChild(createElement("credit", trim(getValue(storyNode, "doc/article/photo-groupe/photo-legende[" + graphicItem.index + "]//credit"))));

                // Why not?
                var correlationsNodes = storyNode.query("correlations/correlation");
                for (var i = 0; i < correlationsNodes.size(); i++) {
                    var correlationsNode = correlationsNodes.get(i);
                    var correlationLoid = correlationsNode.getAttributeValue("loid");
                    if (correlationLoid.equals(graphicItem.loid)) {
                        var legend = getValue(correlationsNode, "dbMetadata/Metadata/Web/Legend");
                        metaElement.appendChild(createElement("subject", legend + ""));
                    }
                }

                break;
            }
        }
    }

    if (item.isValid) {
        var objectLink = new Element("objectLink");
        objectLink.addAttribute(new Attribute("linkType", item.linkType));
        objectLink.addAttribute(new Attribute("extRef", item.loid));
        objectLinks.appendChild(objectLink);
    }

    // Write Media
    var dstFile = new File(dstPath + ".xml");
    writeElement(graphicElement, dstFile);
}

// Process image
function processVideo(physPage, container, videoItem, pageDoc) {
    _print("processVideo: " + videoItem.path);
// TODO: We could test if the URL exists
}

// Build XML & write Image
function writeVideo(physPage, storyItem, videoItem, pageDoc) {
    _print("writeVideo: " + videoItem.path);

    var videoElement = new Element("video");
    var metaElement = new Element("metadata");
    videoElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", INVDATE));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("product", physPage.product));
    metaElement.appendChild(createElement("extRef", videoItem.loid));

    metaElement.appendChild(createElement("city", ""));
    metaElement.appendChild(createElement("country", ""));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", physPage.section));
    metaElement.appendChild(catElement);


    var contentElement = new Element("content");
    videoElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", videoItem.path));

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", storyItem.linkType));
    objectLink.addAttribute(new Attribute("extRef", storyItem.loid));
    objectLinks.appendChild(objectLink);

    // Write Image Element
    var dstPath = DATE_PATH + "video/" + videoItem.loid + ".xml";
    var dstFile = new File(dstPath);
    writeElement(videoElement, dstFile);
}

function asyncConvertPdf(srcFile, dstFile, previewFile, thumbFile, res) {

    if (isPdfFirstTime(srcFile.getName())) {
        var task = {
            run: function () {
                convertPdf(srcFile, dstFile, previewFile, thumbFile, res);
                printExecutor();
            }
        };
        EXECUTOR.execute(new java.lang.Runnable(task));
    }
    else {
        _print("asyncConvertPdf: traitement en cours");
    }
}

function asyncConvertImage2(srcFile, dstFile, previewFile, thumbFile, shape, affine) {
    //return;

    if (isImgFirstTime(srcFile.getName())) {
        var task = {
            run: function () {
                convertImage2(srcFile, dstFile, previewFile, thumbFile, shape, affine);
                printExecutor();
            }
        };
        EXECUTOR.execute(new java.lang.Runnable(task));
    }
    else {
        _print("asyncConvertImage2: traitement en cours");
    }
}

// Resize Image with Ghostscript
function convertPdf(srcFile, dstFile, previewFile, thumbFile, res) {

    if (dstFile.exists() || previewFile.exists() || thumbFile.exists()) {
        _print("convertPdf: traitement en cours");
        return;
    }

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
    FileUtils.copyFile(srcFile, dstFile);
}

// Resize Image with Image Magick depending on affine transform and shape
function convertPdf2(srcFile, dstFile, previewFile, thumbFile, res, shape, affine) {

    _print("srcFile: " + srcFile.getPath());
    _print("dstFile: " + dstFile.getPath());

    if (dstFile.exists() || previewFile.exists() || thumbFile.exists()) {
        _print("convertPdf2: traitement en cours");
        return;
    }

    // Transform and convert to jpeg image
    var pdfInfo = PdfExtractor.getPdfInfo(srcFile);
    var d = pdfInfo.getLastPageSize();
    _print("d.getWidth(): " + d.getWidth() + " d.getHeight(): " + d.getHeight());

    var w = (shape.x2 - shape.x1) / Math.abs(affine.sx);
    var h = (shape.y2 - shape.y1) / Math.abs(affine.sy);
    _print("shape.x1: " + shape.x1 + " shape.x2: " + shape.x2);
    _print("shape.y1: " + shape.y1 + " shape.y2: " + shape.y2);
    _print("w: " + w + " h: " + h);
    _print("affine.sx: " + affine.sx + " affine.sy: " + affine.sy);
    _print("affine.tx: " + affine.tx + " affine.ty: " + affine.ty);

    if (affine.ro == "0" && affine.sx > 0 && affine.sy > 0) {
        var x = -affine.tx / affine.sx;
        var y = -affine.ty / affine.sy;
        var xx = d.getWidth() - w - x;
        var yy = d.getHeight() - h - y;
        if (x < 0)
            x = 0;
        if (y < 0)
            y = 0;
        if (xx < 0)
            xx = 0;
        if (yy < 0)
            yy = 0;

        _print("x: " + x + " y: " + y + " xx: " + xx + " yy: " + yy);

        FileUtils.forceMkdir(dstFile.getParentFile());
        var pdfTool = new com.adlitteram.pdftool.filters.PdfTool();
        pdfTool.addFilter(new com.adlitteram.pdftool.filters.CropMargin(dstFile.getAbsolutePath(), x, y, yy, xx));
        pdfTool.addFilter(new com.adlitteram.pdftool.filters.Transform(affine.sx, affine.sy, 0));
        pdfTool.execute(srcFile);

        FileUtils.copyFile(srcFile, new File(dstFile.getParentFile(), dstFile.getName() + "_orig.pdf"));

    }
//    else {
//        var af = AffineTransform.getScaleInstance(affine.sx, affine.sy);
//        af.rotate(toRad(affine.ro));
//        var rec = new Rectangle2D.Double(0, 0, d.width, d.height);
//        var bbox = af.createTransformedShape(rec).getBounds2D();
//        
//        var x = sign(Math.round((-affine.tx * res - bbox.getX() ) / Math.abs(affine.sx)));
//        var y = sign(Math.round((-affine.ty * res - bbox.getY() ) / Math.abs(affine.sy)));
//        var flop = ( affine.sx < 0 ) ? "-flop" : "";
//        var flip = ( affine.sy < 0 ) ? "-flip" : "";        
//        var opt = [ srcFile.getPath(), flip, flop, "-rotate", affine.ro ,
//        "-crop",  w + "x" + h + x + y , "+repage",
//        "-resize", REL_SIZE + "x" + REL_SIZE + ">", dstFile.getPath()];
//    }

}

// Resize Image with Image Magick depending on affine transform and shape
function convertImage2(srcFile, dstFile, previewFile, thumbFile, shape, affine) {

    if (dstFile.exists() || previewFile.exists() || thumbFile.exists()) {
        _print("convertImage2: traitement en cours");
        return;
    }

    //    if ( dstFile.exists() ) return;
    //    if ( previewFile.exists() ) FileUtils.forceDelete(previewFile);
    //    if ( thumbFile.exists() ) FileUtils.forceDelete(thumbFile);

    // Transform and convert to jpeg image if necessary
//    var tmpFile = null;
    var imageInfo = ScriptUtils.getImageInfo(srcFile);

//    if (imageInfo == null || imageInfo.getWidth() < 1 || imageInfo.getHeight() < 1) {
//        _print("Converting image " + _srcFile.getName() + " to JPEG");
//        tmpFile = File.createTempFile("tmp_", ".jpg");
//        tmpFile.deleteOnExit();
//        var opt = [srcFile.getPath(), "-quality", "80", tmpFile.getPath()];
//        _exec(CONVERT_EXE, opt, tmpFile.getParent(), 300000); // creates also parent directory
//        srcFile = tmpFile;
//        imageInfo = ScriptUtils.getImageInfo(srcFile);
//    }

    var res = 360 / 72;
    var w = Math.round((shape.x2 - shape.x1) / Math.abs(affine.sx) * res);
    var h = Math.round((shape.y2 - shape.y1) / Math.abs(affine.sy) * res);

    if (imageInfo == null || affine.ro == "0" && affine.sx > 0 && affine.sy > 0) {
        var x = sign(Math.round(-affine.tx / affine.sx * res));
        var y = sign(Math.round(-affine.ty / affine.sy * res));
        var opt = [srcFile.getPath(), "-crop", w + "x" + h + x + y, "+repage",
            "-resize", REL_SIZE + "x" + REL_SIZE + ">", dstFile.getPath()];
    }
    else {
        var af = AffineTransform.getRotateInstance(toRad(affine.ro));
        af.scale(affine.sx, affine.sy);

//        var af = AffineTransform.getScaleInstance(affine.sx, affine.sy);
//        af.rotate(toRad(affine.ro));

        var rec = new Rectangle2D.Double(0, 0, imageInfo.getWidth(), imageInfo.getHeight());
        var bbox = af.createTransformedShape(rec).getBounds2D();

        var x = sign(Math.round((-affine.tx * res - bbox.getX()) / Math.abs(affine.sx)));
        var y = sign(Math.round((-affine.ty * res - bbox.getY()) / Math.abs(affine.sy)));
        var flop = (affine.sx < 0) ? "-flop" : "";
        var flip = (affine.sy < 0) ? "-flip" : "";
        var opt = [srcFile.getPath(), flip, flop, "-rotate", affine.ro,
            "-crop", w + "x" + h + x + y, "+repage",
            "-resize", REL_SIZE + "x" + REL_SIZE + ">", dstFile.getPath()];
    }

    _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent());
    _exec(CONVERT_EXE, opt, dstFile.getParent(), 300000); // creates also parent directory

    // PREVIEW
    if (dstFile.exists()) {
        var opt = [dstFile.getPath(), "-strip", "-resize", PREVIEW_SIZE + "x" + PREVIEW_SIZE + ">", previewFile.getPath()];
        _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent());
        _exec(CONVERT_EXE, opt, dstFile.getParent(), 300000); // creates also parent directory
    }

    // THUMB
    if (previewFile.exists()) {
        var opt = [previewFile.getPath(), "-strip", "-resize", THUMB_SIZE + "x" + THUMB_SIZE + ">", thumbFile.getPath()];
        _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent());
        _exec(CONVERT_EXE, opt, dstFile.getParent(), 300000); // creates also parent directory
    }

//    if (tmpFile != null && tmpFile.exists()) {
//        FileUtils.deleteQuietly(tmpFile);
//    }
}

// Resize Image with Image Magick
// TODO: check JPEG/PNG convert to JPG
function convertImage(srcFile, dstFile, previewFile, thumbFile) {
    //return;

    if (dstFile.exists() || previewFile.exists() || thumbFile.exists()) {
        _print("convertImage: traitement en cours");
        return;
    }

    // Convert non jpeg image
    var d = ScriptUtils.getImageDimension(srcFile);
    if (srcFile.getName().toLowerCase().endsWith(".jpg") && (d.width == 0 || d.height == 0))
        d.width = MAX_SIZE + 1;

    // Convert image if larger than MAX_SIZE
    if (d.width > MAX_SIZE || d.height > MAX_SIZE) {
        var opt = [srcFile.getPath(), "-resize", REL_SIZE + "x" + REL_SIZE + ">", dstFile.getPath()];
        _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent());
        _exec(CONVERT_EXE, opt, dstFile.getParent(), 300000); // creates also parent directory
    }
    else {
        //_print("Copying Image: " + srcFile.getName() + " to " + dstFile + " (" + d.width + "x" + d.height + ")");
        FileUtils.copyFile(srcFile, dstFile);
    }

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

function printExecutor() {
    var tc = EXECUTOR.getTaskCount();
    var ac = EXECUTOR.getActiveCount();
    var ctc = EXECUTOR.getCompletedTaskCount();
    _print("Executor - WaitingTaskCount: " + (tc - ac - ctc) + " - ActiveCount: " + ac + " - CompletedTaskCount: " + ctc);
}

// Convert from Adobe point to mm and round 1
// TODO: A vérifier 
function round1(n) {
    return Math.round(n / 72 * 2540) / 100;
}

function sign(n) {
    return (n >= 0) ? "+" + n : n;
}

function toRad(deg) {
    return deg * Math.PI / 180;
}

function contains(a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i] == obj) {
            return true;
        }
    }
    return false;
}

function containsIgnoreCase(a, str) {
    var i = a.length;
    while (i--) {
        if (a[i].toLowerCase() == str.toLowerCase()) {
            return true;
        }
    }
    return false;
}


// Main
function main() {
    _print("Starting Process");

    EXECUTOR = ScriptUtils.createFifoExecutor();

    extractTar();
    if (processArchive()) {
        var xmlPages = createXmlPages();
        var physPages = createPhysPages(xmlPages);
        processPages(physPages);
        writePagePlan(physPages);

        _print("Waiting for executor to complete");
        EXECUTOR.shutdown();
        var status = EXECUTOR.awaitTermination(60, TimeUnit.MINUTES);

        buildZip();
        cleanDir();

        if (status) {
            Thread.sleep(5000);
            _print("Process Done");
            return _OK;
        }
        else {
            _print("Executor time-out. Process Aborted");
            copyToError();
            return _OK;
        }
    }
    else {
        _print("General Error. Process Aborted");
        cleanDir();
        copyToError();
        return _OK;
    }
}

// start & exit
try {
    _exit = main();
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}
