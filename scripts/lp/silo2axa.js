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
importPackage(Packages.nu.xom) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.adlitteram.jspool) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Globals
var TEMP_DIR = "D:/METHODE/archive/axa_tmp/";
var OUTPUT_DIR = "D:/METHODE/archive/axa_ftp/";

var ZIP_DIR ;
var OUT_DIR ;
var DATE_DIR ;
var DATE_NAME = null ;
var PLAN_XML = null ;
var PAGE_COUNT = 0 ;

// Unzip archive
function extractZip() {  
    _print("Extracting Zip file");
    ZIP_DIR = new File(TEMP_DIR, _srcFile.getName() + "_dir") ;
    _print("ZIP_DIR: " + ZIP_DIR);
    //if ( ZIP_DIR.exists() ) FileUtils.forceDelete(ZIP_DIR) ;
    ScriptUtils.unzipFileToDir(_srcFile.getFile(), ZIP_DIR) ;
    _print("Extracting Zip file done");
}

// Zip archive
function buildZip() {  
    _print("Building Zip file");
    var ZIP_FILE = new File(OUTPUT_DIR + DATE_NAME + "_LP_JDE.zip") ;
    _print("OUT_DIR: " + OUT_DIR  + " - ZIP_FILE: " + ZIP_FILE);

    if ( ZIP_FILE.exists() ) FileUtils.forceDelete(ZIP_FILE) ;
    ScriptUtils.zipDirToFile(OUT_DIR, ZIP_FILE) ;
    
    _print("Building Zip file done");

}

function cleanDir() {
	if ( OUT_DIR.exists() ) {
        _print("Purging " + OUT_DIR);
        FileUtils.forceDelete(OUT_DIR) ;
  	}
    	
    if ( ZIP_DIR.exists() ) {
        _print("Purging " + ZIP_DIR);
        FileUtils.forceDelete(ZIP_DIR) ;  
    }
}


// Process zip and set global variables
function processZip() {
    _print("Processing Archive File");

    // Date Directory 20101402
    var filenames = ZIP_DIR.list() ;
    var rxp = new RegExp("\\d\\d\\d\\d\\d\\d\\d\\d", "") ;
    for(var i in filenames ) {
        if ( filenames[i].match(rxp) ) {
            
            DATE_NAME = filenames[i] ;
            _print("DATE_NAME: " + DATE_NAME);

            DATE_DIR = new File(ZIP_DIR + "/" + DATE_NAME) ;
            _print("DATE_DIR: " + DATE_DIR);
            
            var planDir = new File(DATE_DIR + "/plan") ;
            var files = planDir.listFiles() ;
            if ( files.length > 0 ) {
                PLAN_XML = files[0] ;
                _print("PLAN_XML: " + PLAN_XML);
                OUT_DIR = new File(TEMP_DIR + "/" + DATE_NAME) ;
                _print("OUT_DIR: " + OUT_DIR);
                return true ;
            }
        }
    }
    
    _print("PLAN_XML not found!");
    return false ;
}

function processPlanXml() {
    _print("processPlanXml starting");
	 
    var builder = new Builder();
    var doc = builder.build(PLAN_XML);

    // <pageplan><metadata><objectLinks><objectLink linkType="page" extRef="11.0.2427802849"/>
    var pageNodes = doc.query("/pageplan/metadata/objectLinks/objectLink [@linkType='page']") ;
    for(var i=0; i<pageNodes.size(); i++) {
        var pageNode = pageNodes.get(i) ;
        var file = new File(DATE_DIR + "/page/" + pageNode.getAttributeValue("extRef") + ".xml") ;
        processPageXml(file) ;
    }

    _print("Number of pages found: " + PAGE_COUNT);
    _print("processPlanXml done");
}

function processPageXml(pageFile) {
    //    _print("processPageXml starting: " + pageXml);

    var builder = new Builder();
    var doc = builder.build(pageFile);
    
    //var queryStr = "/page/metadata[product='LP' and book='CJDE']/editions[edition='JDE']/../categories[category='Argent']/../.." ;
    var queryStr = "/page/metadata[product='LP' and book='CJDE' and editions[edition='JDE'] and categories[category='Argent']]/.." ;
    
    var pageNodes = doc.query(queryStr) ;
    if ( pageNodes.size() > 0 ) {
        _print("Page found: " + pageFile.getName());
        PAGE_COUNT++ ;
        
        var storyNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='story']") ;
        for(var i=0; i<storyNodes.size(); i++) {
            processStoryXml(new File(DATE_DIR + "/story/" + storyNodes.get(i).getAttributeValue("extRef") + ".xml") ) ;
        }

        var imageNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='image']") ;
        for(var i=0; i<imageNodes.size(); i++) {
            processImageXml(new File(DATE_DIR + "/image/" + imageNodes.get(i).getAttributeValue("extRef") + ".xml") ) ;
        }

        var graphicNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='graphic']") ;
        for(var i=0; i<graphicNodes.size(); i++) {
            processGraphicXml(new File(DATE_DIR + "/graphic/" + graphicNodes.get(i).getAttributeValue("extRef") + ".xml") ) ;
        }

        var uriTextNodes = doc.query("/page/content/uri/text()") ;
        for(var i=0; i<uriTextNodes.size(); i++) {
            FileUtils.copyFileToDirectory(new File(DATE_DIR + "/page/" + uriTextNodes.get(i).getValue()), new File(OUT_DIR, "page")) ;
        }
        
        FileUtils.copyFileToDirectory(pageFile, new File(OUT_DIR, "page")) ;
    }

//    _print("processPageXml done");
}

function processStoryXml(storyFile) {
    var builder = new Builder();
    var doc = builder.build(storyFile);    

    var imageNodes = doc.query("/story/metadata/objectLinks/objectLink [@linkType='image']") ;
    for(var i=0; i<imageNodes.size(); i++) {
        processImageXml(new File(DATE_DIR + "/image/" + imageNodes.get(i).getAttributeValue("extRef") + ".xml") ) ;
    }

    var graphicNodes = doc.query("/story/metadata/objectLinks/objectLink [@linkType='graphic']") ;
    for(var i=0; i<graphicNodes.size(); i++) {
        processGraphicXml(new File(DATE_DIR + "/graphic/" + graphicNodes.get(i).getAttributeValue("extRef") + ".xml") ) ;
    }

    var uriTextNodes = doc.query("/story/content/uri/text()") ;
    for(var i=0; i<uriTextNodes.size(); i++) {
        FileUtils.copyFileToDirectory(new File(DATE_DIR + "/story/" + uriTextNodes.get(i).getValue()), new File(OUT_DIR, "story")) ;
    }

    FileUtils.copyFileToDirectory(storyFile, new File(OUT_DIR, "story")) ;    
}

function processGraphicXml(graphicFile) {
    var builder = new Builder();
    var doc = builder.build(graphicFile);    

    var uriTextNodes = doc.query("/graphic/content/uri/text()") ;
    for(var i=0; i<uriTextNodes.size(); i++) {
        FileUtils.copyFileToDirectory(new File(DATE_DIR + "/graphic/" + uriTextNodes.get(i).getValue()), new File(OUT_DIR, "graphic")) ;
    }

    FileUtils.copyFileToDirectory(graphicFile, new File(OUT_DIR, "graphic")) ;        
}

function processImageXml(imageFile) {
    var builder = new Builder();
    var doc = builder.build(imageFile);    

    var uriTextNodes = doc.query("/image/content/uri/text()") ;
    for(var i=0; i<uriTextNodes.size(); i++) {
        FileUtils.copyFileToDirectory(new File(DATE_DIR + "/image/" + uriTextNodes.get(i).getValue()), new File(OUT_DIR, "image")) ;
    }
    FileUtils.copyFileToDirectory(imageFile, new File(OUT_DIR, "image")) ;        
}

function copyToError(file, filename) {
    var dstFile = new File(ERROR_DIR, filename) ;
    _print("copie : " + filename + " vers " + dstFile.getPath()) ;
    FileUtils.copyFile(file, dstFile) ;
}

// Main
function main() {
 
    extractZip() ;
    
    if ( processZip() ) {
        processPlanXml() ;
        if ( PAGE_COUNT > 0 ) {
            buildZip() ;
        }
        cleanDir() ;   
        return _OK ;
    }
    else {
        FileUtils.forceDelete(ZIP_DIR) ;   
        return _FAIL ;
    }
}

// start & exit
_exit = main() ;

