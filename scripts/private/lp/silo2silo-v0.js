/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.util);
importPackage(Packages.java.lang);
importPackage(Packages.java.io);
importPackage(Packages.nu.xom);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.com.adlitteram.jspool);

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Globals
var SILOV6_DIR = "D:/METHODE/archive/silov6_in/";
var TEMP_DIR = "D:/ed1/silo_tmp/";
var OUTPUT_DIR = "D:/ed1/silo_out/";

// ZIP_DIR, OUT_DIR, DATE_DIR are under TEMP_DIR
var ZIP_DIR;  // The unzipped of the source file
var OUT_DIR;  // The new directory to be zipped
var DATE_DIR;

var DATE_NAME = null;
var PLAN_XML = null;
var PAGE_COUNT = 0;
var PAGESET = {};
var PLAN_UUID;

// Create <tag> value </tag>
function createElement(tag, value) {
    var element = new Element(tag);
    element.appendChild(value);
    return element;
}

// utility function
function getValue(node, xpath) {
    var nodes = node.query(xpath);
    if (nodes == null || nodes.size() == 0)
        return "";
    if (nodes.size() > 1)
        _print("xpath: " + xpath + " - multiple values: " + nodes.get(0).getValue());
    return nodes.get(0).getValue();
}

// Return if this page was already processed
function isPageProcessed(pageID, extRef) {
    if (!PAGESET.hasOwnProperty(pageID)) {
        PAGESET[pageID] = extRef;
        return false;
    }
    return true;
}

// Write Element
function writeElement(element, dstFile) {
    _print("Writing XML Element: " + dstFile);
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

function writePagePlan() {
    _print("writePagePlan");

    var planElement = new Element("pageplan");
    var metaElement = new Element("metadata");
    planElement.appendChild(metaElement);
    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("extRef", PLAN_UUID));
    metaElement.appendChild(createElement("issueDate", DATE_NAME));
    metaElement.appendChild(createElement("permission", 0));
    metaElement.appendChild(createElement("code", 1));
    metaElement.appendChild(new Element("editions"));
    metaElement.appendChild(new Element("categories"));

    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var pageArray = Object.keys(PAGESET);
    for (var i = 0; i < pageArray.length; i++) {
        var pageID = pageArray[i];
        var objectLink = new Element("objectLink");
        objectLink.addAttribute(new Attribute("linkType", "page"));
        objectLink.addAttribute(new Attribute("extRef", PAGESET[pageID]));
        objectLinks.appendChild(objectLink);
    }

    var contentElement = new Element("content");
    planElement.appendChild(contentElement);

    // Write PDF & JPEG
    var dstPath = OUT_DIR + "/plan/" + PLAN_UUID;
    var dstFile = new File(dstPath);
    contentElement.appendChild(createElement("uri", dstFile.getName()));

    // Write Plan
    writeElement(planElement, dstFile);
}

// Build a new Zip archive
function buildZip() {
    _print("Building Zip file");

    var ZIP_FILE = new File(OUTPUT_DIR, _srcFile.getName());
    _print("OUT_DIR: " + OUT_DIR + " - ZIP_FILE: " + ZIP_FILE);

    if (ZIP_FILE.exists())
        FileUtils.forceDelete(ZIP_FILE);

    ScriptUtils.zipDirToFile(OUT_DIR.getParentFile(), ZIP_FILE);
    _print("Building Zip file done");

}

// Purge Tmp directory
function cleanDir() {
    _print("cleanDir");
    try {
        _print("Waiting 60s");
        Thread.sleep(60000); // Windows Bug!
    } catch (e) {
    }

    if (OUT_DIR.exists()) {
        _print("Purging " + OUT_DIR);
        FileUtils.forceDelete(OUT_DIR.getParentFile());
    }

    if (ZIP_DIR.exists()) {
        _print("Purging " + ZIP_DIR);
        FileUtils.forceDelete(ZIP_DIR);
    }
}

function processPageXml(pageFile) {
    //    _print("processPageXml starting: " + pageXml);

    var builder = new Builder();
    var doc = builder.build(pageFile);

    var edition = getValue(doc, "page/metadata/editions/edition");
    var book = getValue(doc, "page/metadata/book");
    var pn = getValue(doc, "page/metadata/pn");
    var extRef = getValue(doc, "page/metadata/extRef");

    var pageID = edition + "_" + book + "_" + pn;
    _print("Page ID: " + pageID);

    if (!isPageProcessed(pageID, extRef)) {
        PAGE_COUNT++;

        var storyNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='story']");
        for (var i = 0; i < storyNodes.size(); i++) {
            processStoryXml(new File(DATE_DIR + "/story/" + storyNodes.get(i).getAttributeValue("extRef") + ".xml"));
        }

        var imageNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='image']");
        for (var i = 0; i < imageNodes.size(); i++) {
            processImageXml(new File(DATE_DIR + "/image/" + imageNodes.get(i).getAttributeValue("extRef") + ".xml"));
        }

        var graphicNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='graphic']");
        for (var i = 0; i < graphicNodes.size(); i++) {
            processGraphicXml(new File(DATE_DIR + "/graphic/" + graphicNodes.get(i).getAttributeValue("extRef") + ".xml"));
        }

        var uriTextNodes = doc.query("/page/content/uri/text()");
        for (var i = 0; i < uriTextNodes.size(); i++) {
            FileUtils.copyFileToDirectory(new File(DATE_DIR + "/page/" + uriTextNodes.get(i).getValue()), new File(OUT_DIR, "page"));
        }

        FileUtils.copyFileToDirectory(pageFile, new File(OUT_DIR, "page"));
    } else {
        _print("Page ID: " + pageID + " was already processed");
    }

}

function processStoryXml(storyFile) {
    var builder = new Builder();
    var doc = builder.build(storyFile);

    var imageNodes = doc.query("/story/metadata/objectLinks/objectLink [@linkType='image']");
    for (var i = 0; i < imageNodes.size(); i++) {
        processImageXml(new File(DATE_DIR + "/image/" + imageNodes.get(i).getAttributeValue("extRef") + ".xml"));
    }

    var graphicNodes = doc.query("/story/metadata/objectLinks/objectLink [@linkType='graphic']");
    for (var i = 0; i < graphicNodes.size(); i++) {
        processGraphicXml(new File(DATE_DIR + "/graphic/" + graphicNodes.get(i).getAttributeValue("extRef") + ".xml"));
    }

    var uriTextNodes = doc.query("/story/content/uri/text()");
    for (var i = 0; i < uriTextNodes.size(); i++) {
        FileUtils.copyFileToDirectory(new File(DATE_DIR + "/story/" + uriTextNodes.get(i).getValue()), new File(OUT_DIR, "story"));
    }

    FileUtils.copyFileToDirectory(storyFile, new File(OUT_DIR, "story"));
}

function processGraphicXml(graphicFile) {
    var builder = new Builder();
    var doc = builder.build(graphicFile);

    var uriTextNodes = doc.query("/graphic/content/uri/text()");
    for (var i = 0; i < uriTextNodes.size(); i++) {
        FileUtils.copyFileToDirectory(new File(DATE_DIR + "/graphic/" + uriTextNodes.get(i).getValue()), new File(OUT_DIR, "graphic"));
    }

    FileUtils.copyFileToDirectory(graphicFile, new File(OUT_DIR, "graphic"));
}

function processImageXml(imageFile) {
    var builder = new Builder();
    var doc = builder.build(imageFile);

    var uriTextNodes = doc.query("/image/content/uri/text()");
    for (var i = 0; i < uriTextNodes.size(); i++) {
        FileUtils.copyFileToDirectory(new File(DATE_DIR + "/image/" + uriTextNodes.get(i).getValue()), new File(OUT_DIR, "image"));
    }
    FileUtils.copyFileToDirectory(imageFile, new File(OUT_DIR, "image"));
}

function processPlanXml() {
    _print("processPlanXml starting");

    var builder = new Builder();
    var doc = builder.build(PLAN_XML);

    // <pageplan><metadata><objectLinks><objectLink linkType="page" extRef="11.0.2427802849"/>
    var pageNodes = doc.query("/pageplan/metadata/objectLinks/objectLink [@linkType='page']");
    for (var i = 0; i < pageNodes.size(); i++) {
        var pageNode = pageNodes.get(i);
        var file = new File(DATE_DIR + "/page/" + pageNode.getAttributeValue("extRef") + ".xml");
        processPageXml(file);
    }

    _print("Number of pages found: " + PAGE_COUNT);
    _print("processPlanXml done");
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
            PLAN_UUID = "plan_" + DATE_NAME + ".xml";

            var planDir = new File(DATE_DIR + "/plan");
            var files = planDir.listFiles();
            if (files.length > 0) {
                PLAN_XML = files[0];
                _print("PLAN_XML: " + PLAN_XML);
                OUT_DIR = new File(TEMP_DIR + "/" + DATE_NAME + "/" + DATE_NAME);
                _print("OUT_DIR: " + OUT_DIR);
                return true;
            }
        }
    }

    _print("PLAN_XML not found!");
    return false;
}

// Unzip archive
function extractZip(zipFile) {
    _print("Extracting Zip file: " + zipFile);
    ZIP_DIR = new File(TEMP_DIR, zipFile.getName() + "_dir");

    _print("ZIP_DIR: " + ZIP_DIR);
    if (ZIP_DIR.exists()) {
        try {
            _print("Waiting 30s");
            Thread.sleep(30000); // Windows Bug!
            FileUtils.forceDelete(ZIP_DIR);
        } catch (e) {
            _print("Error deleting: " + ZIP_DIR);
        }
    }

    ScriptUtils.unzipFileToDir(zipFile, ZIP_DIR);
    _print("Extracting Zip file done");
}

// Main
function main() {

    // V4 : extractZip defines Global Variable
    extractZip(_srcFile.getFile());
    if (processZip()) {
        processPlanXml();
    }

    // V6 : extractZip defines Global Variable
    var file = new File(SILOV6_DIR, _srcFile.getName());
    if (file.exists()) {
        extractZip(file);
        if (processZip()) {
            processPlanXml();
        }
    } else {
        _print("Warning: " + file + " not found!");
    }

    if (PAGE_COUNT > 0) {
        writePagePlan();
        buildZip();
    } else {
        _print("Warning: PAGE_COUNT = 0 !");
    }

    cleanDir();
    return _OK;
}

// start & exit
try {
    _exit = main();
} catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}


