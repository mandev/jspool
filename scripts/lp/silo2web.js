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

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Globals
var TMP_DIR = "D:/METHODE/archive/web_tmp/";
var OUT_DIR = "D:/METHODE/archive/web_ftp/";

var ZIP_DIR;
var DATE_DIR;
var PLAN_XML = null;
var PAGE_COUNT = 0;

// Unzip archive
function extractZip() {
    _print("Extracting Zip file");
    var dirname = FilenameUtils.getBaseName(_srcFile.getName());
    ZIP_DIR = new File(TMP_DIR, dirname);

    _print("ZIP_DIR: " + ZIP_DIR);
    cleanDir();

    ScriptUtils.unzipFileToDir(_srcFile.getFile(), ZIP_DIR);
    _print("Extracting Zip file done");
}

// Zip archive
function buildZip() {
    _print("Building Zip file");

    var dirname = FilenameUtils.getBaseName(_srcFile.getName());
    var tmpZipFile = File.createTempFile(dirname + "_", ".zip.tmp", new File(TMP_DIR));
    tmpZipFile.deleteOnExit();
    _print("tmpZipFile: " + tmpZipFile);
    ScriptUtils.zipDirToFile(ZIP_DIR, tmpZipFile);

    var zipFile = new File(OUT_DIR, _srcFile.getName());
    if (zipFile.exists())
        FileUtils.forceDelete(zipFile);

    FileUtils.moveFile(tmpZipFile, zipFile);
    _print("Building Zip file done");
}

function cleanDir() {

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

            var DATE_NAME = filenames[i];
            _print("DATE_NAME: " + DATE_NAME);

            DATE_DIR = new File(ZIP_DIR + "/" + DATE_NAME);
            _print("DATE_DIR: " + DATE_DIR);

            var planDir = new File(DATE_DIR + "/plan");
            var files = planDir.listFiles();
            if (files.length > 0) {
                PLAN_XML = files[0];
                _print("PLAN_XML: " + PLAN_XML);
                // OUT_DIR = new File(TMP_DIR + "/" + DATE_NAME);
                // _print("OUT_DIR: " + OUT_DIR);
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

function processPageXml(pageFile) {
    _print("processPageXml starting: " + pageFile);

    var builder = new Builder();
    var doc = builder.build(pageFile);

    //var queryStr = "/page/metadata[product='LP' and book='CJDE']/editions[edition='JDE']/../categories[category='Argent']/../.." ;
    var queryStr = "/page/metadata[product='LP' and book='E94' and editions[edition='PAR94'] and categories[category='Départementales']]/..";

    var pageNodes = doc.query(queryStr);
    if (pageNodes.size() > 0) {
        _print("Page found: " + pageFile.getName());
        PAGE_COUNT++;

        var storyNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='story']");
        for (var i = 0; i < storyNodes.size(); i++) {
            var storyFile = new File(DATE_DIR + "/story/" + storyNodes.get(i).getAttributeValue("extRef") + ".xml");
            _print("Deleting story: " + storyFile);
            FileUtils.deleteQuietly(storyFile);
        }
    }

    _print("processPageXml done");
}

// Main
function main() {

    extractZip();

    if (processZip()) {
        processPlanXml();
        buildZip();
        cleanDir();
        return _OK;
    }
    else {
        FileUtils.forceDelete(ZIP_DIR);
        return _FAIL;
    }
}

// start & exit
// start & exit
try {
    _exit = main();
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}


