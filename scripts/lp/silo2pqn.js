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
//STAGING_DIR = "C:/tmp/envoi_pqn/" ;
//OUTPUT_DIR = "C:/tmp/envoi_pqn/" ;
TEMP_DIR = "D:/METHODE/archive/pqn_tmp/" ;
OUTPUT_DIR = "D:/METHODE/archive/pqn_out/" ;

var ZIP_DIR ;
var OUT_DIR ;
var DATE_DIR ;
var DATE_NAME = null ;
var PLAN_XML = null ;
var PAGE_COUNT = 0 ;

function getToday() {

    var today = new Date() ;
    var year = today.getFullYear() + ""
    var day = today.getDate() ;
    if ( day < 10 ) day = "0" + day ;
    var month = today.getMonth() + 1  ;
    if ( month < 10 ) month = "0" + month ;
    var hour = today.getHours()  ;
    if ( hour < 10 ) hour = "0" + hour ;
    var min = today.getMinutes()  ;
    if ( min < 10 ) min = "0" + min ;
    var sec = today.getSeconds()  ;
    if ( sec < 10 ) sec = "0" + sec ;

    return year + "" + month + "" + day + "" + hour + "" + min + "" + sec ;
}
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
    var ZIP_FILE = new File(OUTPUT_DIR + "PQLP" + getToday() + "V2_0.zip") ;
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
    for (var i in filenames ) {
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
                if ( ! OUT_DIR.exists() ) OUT_DIR.mkdirs() ;
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
    
    // $ed160114
    // var queryStr = "/page/metadata[product='LP' and book='CNAT' and editions[edition='AUJ']]/.. | /page/metadata[product='LP' and book='CECO' and editions[edition='AUJ']]/.." ;
    var queryStr = "/page/metadata[product='LP' and book='CNAT' and editions[edition='AUJ']]/.." ;
    
    var pageNodes = doc.query(queryStr) ;
    if ( pageNodes.size() > 0 ) {
        //_print("Page found: " + pageFile.getName());
        PAGE_COUNT++ ;
        
        var page = new Object() ;
	   page.pn = getValue(doc, "/page/metadata/pn") + "" ;
	   var pagePn = ( page.pn.indexOf(",") < 0 ) ? page.pn  : page.pn.substring(0,page.pn.indexOf(",")) ;
	   var pagePn2 = ( page.pn.indexOf(",") < 0 ) ? page.pn  : page.pn.substr(page.pn.indexOf(",")+1,2) ;
	   var quadri = (getValue(doc, "/page/metadata/book") == "CNAT") ? "Q_PQLP_" : "Q_PQLE_" ; 
    	   var issue = (getValue(doc, "/page/metadata/book") == "CNAT") ? "00000" : "00001" ; 
    	   page.edition = getValue(doc, "/page/metadata/editions/edition") + "" ;
    	   page.issuedate = getValue(doc, "/page/metadata/issueDate") + "" ;
    	   page.sequence = getValue(doc, "/page/metadata/sequence") + "" ;
    	   page.name = "" ;
    
        var uriTextNodes = doc.query("/page/content/uri/text()") ;
        for(var i=0; i<uriTextNodes.size(); i++) {
        	  if (FilenameUtils.getExtension(uriTextNodes.get(i).getValue())=="pdf") {
            	//FileUtils.copyFileToDirectory(new File(DATE_DIR + "/page/" + uriTextNodes.get(i).getValue()), new File(OUT_DIR)) ;
            	if ((uriTextNodes.get(i).getValue().indexOf("_left") < 0)&&(uriTextNodes.get(i).getValue().indexOf("_right") < 0)){ 
            		page.name = quadri + page.issuedate + "_" + issue + "_N_" + pad(pagePn, "0", 3) + "_" + pad(pagePn2, "0", 3) + "N.pdf"
	            	srcFile = new File(DATE_DIR + "/page/" + uriTextNodes.get(i).getValue());
	            	dstFile = new File(OUT_DIR + "/" + page.name);
	            	convertPage(srcFile, dstFile) ;
            	}
        	  }
        }

        var storyNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='story']") ;
        for(var i=0; i<storyNodes.size(); i++) {
            processStoryXml(page, new File(DATE_DIR + "/story/" + storyNodes.get(i).getAttributeValue("extRef") + ".xml") ) ;
        }

        var imageNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='image']") ;
        for(var i=0; i<imageNodes.size(); i++) {
            processImageXml(new File(DATE_DIR + "/image/" + imageNodes.get(i).getAttributeValue("extRef") + ".xml") ) ;
        }

        var graphicNodes = doc.query("/page/metadata/objectLinks/objectLink [@linkType='graphic']") ;
        for(var i=0; i<graphicNodes.size(); i++) {
            processGraphicXml(new File(DATE_DIR + "/graphic/" + graphicNodes.get(i).getAttributeValue("extRef") + ".xml") ) ;
        }

    }
}

function processStoryXml(page, storyFile) {
    //_print("Process Text : " + storyFile.getName());
    var builder = new Builder();
    var doc = builder.build(storyFile);    

 //   var visuels = new Element("VISUELS");
 //   var imageNodes = doc.query("/story/metadata/objectLinks/objectLink [@linkType='image']") ;
 //   for(var i=0; i<imageNodes.size(); i++) {
 //       processImageXml(new File(DATE_DIR + "/image/" + imageNodes.get(i).getAttributeValue("extRef") + ".xml") ) ;
 //       visuels.appendChild(createTag("VISUEL", imageNodes.get(i).getAttributeValue("extRef") + ".jpg"));
 //   }

    var graphicNodes = doc.query("/story/metadata/objectLinks/objectLink [@linkType='graphic']") ;
    for(var i=0; i<graphicNodes.size(); i++) {
        processGraphicXml(new File(DATE_DIR + "/graphic/" + graphicNodes.get(i).getAttributeValue("extRef") + ".xml") ) ;
    }

    var text = getValue(doc, "/story/content") + "" ;
    
    if ( page.pn == "1" && text.length < 300 && text.indexOf("ANDORRE") >= 0 &&  text.indexOf("DOM-TOM") > 0 && 
        text.indexOf("BELGIQUE") > 0 && text.indexOf("SUISSE") > 0 && text.indexOf("ESPAGNE") > 0 &&
        text.indexOf("GRECE") > 0 && text.indexOf("MAROC") > 0 && text.indexOf("PORTUGAL") > 0 &&
        text.indexOf("ZONE CFA") > 0 && text.indexOf("TUNISIE") > 0 ) {

        return ;
    }

    var article = new Element("ARTICLE");
    article.appendChild(createTag("VERSION", "2.0" ));
    article.appendChild(createTag("ID", (getValue(doc, "/story/metadata/extRef") + "")));
    article.appendChild(createTag("SOURCE", "Le Parisien"));
    article.appendChild(createTag("PUBLICATION", page.edition));
    article.appendChild(createTag("NUM", "00000"));
    article.appendChild(createTag("DATE", (getValue(doc, "/story/metadata/issueDate") + "")));
    article.appendChild(createTag("PAGINATION", page.pn));
    article.appendChild(createTag("RUBRIQUE", (getValue(doc, "/story/metadata/categories/category") + "")));
    article.appendChild(createTag("SURTITRE", (getValue(doc, "/story/content/heading") + "")));
    article.appendChild(createTag("TITRE", (getValue(doc, "/story/content/title") + "")));
    article.appendChild(createTag("SOUSTITRE", (getValue(doc, "/story/content/subtitle") + "")));
    article.appendChild(createTag("CHAPO", (getValue(doc, "/story/content/lead") + "")));

    var auteurs = new Element("AUTEURS");
    auteurs.addAttribute(new Attribute("type", "VRAC"))

    var authorNodes = doc.query("/story/metadata/authors/author") ;
    if (authorNodes.size()>0) { 
    	   for (var i=0; i<authorNodes.size(); i++) {
            auteurs.appendChild(createTag("AUTEUR", (authorNodes.get(i).getValue() + "")));
        }
    } else auteurs.appendChild(createTag("AUTEUR", getValue(doc, "/story/metadata/creator") + ""));    
    article.appendChild(auteurs);

    article.appendChild(createTexteTag(doc));

    var annexes = new Element("ANNEXES");
    article.appendChild(annexes) ;
    var encadres = new Element("ENCADRES");
    article.appendChild(encadres) ;
    var visuels = new Element("VISUELS");
 //   var visuel = new Element("VISUEL");
 //   visuel.appendChild(createTag("TITVISUEL", "")) ;
 //   visuel.appendChild(createTag("NOMVISUEL", "")) ;
 //   visuel.appendChild(createTag("CREDVISUEL", "")) ;
 //   visuel.appendChild(createTag("LEGVISUEL", "")) ;
 //   visuels.appendChild(visuel) ;
    article.appendChild(visuels) ;
    var infographies = new Element("INFOGRAPHIES");
    article.appendChild(infographies) ;
    var pdfs = new Element("PDFS");
    pdfs.appendChild(createTag("PDF", page.name));
    
    article.appendChild(pdfs) ;

    var file = new File(OUT_DIR, storyFile.getName()) ;
    _print("Writing Story: " + file );
    var os = new FileOutputStream(file) ;
    var serializer = new Serializer(os, "UTF-8");
    //serializer.setIndent(3);
    //serializer.setMaxLength(80);
    serializer.write(new Document(article));
    os.close() ;
}

function createTexteTag(doc){

    var nodes = doc.query("/story/content/text/descendant-or-self::*") ;
    for(var i=0; i<nodes.size(); i++) {
        var node = nodes.get(i) ;
        if ( node.getChildCount() > 0 ) {
            var tag = node.getLocalName().toLowerCase() ;
            if ( tag == "table" ) node.setLocalName("TEXTE") ;
            else if ( tag == "text" ) node.setLocalName("TEXTE") ;
            else if ( tag == "subheading" ) node.setLocalName("INTERTITRE") ;
            else if ( tag == "question" ) {
                node.setLocalName("P") ;
                node.addAttribute(new Attribute("type", "QUESTION"))
            }
            else if ( tag == "signature" ) node.setLocalName("I") ;
            else if ( tag == "p" ) {
            	if (node.getAttributeValue("type") == "question") {
            		node.removeAttribute(node.getAttribute("type"));
            		node.addAttribute(new Attribute("type", "QUESTION"))
            	}
            	node.setLocalName("P") ;
            }
            else {
               var parent = node.getParent() ;
               var idx = parent.indexOf(node) ; 
               for(var j=node.getChildCount()-1; j>=0; j--) {
                   var child = node.getChild(j) ;
                   child.detach() ;
                   parent.insertChild(child, idx) ; 
               }
               node.detach() ;
           }
        }
        else {
            node.detach() ;
        }
    }

    //bug <INTERTITRE> dans <P>
    var nodes = doc.query("/story/content/TEXTE/descendant-or-self::*") ;
    for (var i=0; i<nodes.size(); i++) {
        var node = nodes.get(i) ;
        if (node.getLocalName() == "INTERTITRE") {
        	 var parent = node.getParent() ;
	      if (parent.getLocalName() == "P") {
	         var pparent = parent.getParent() ;
	         if ( pparent != null ) {
		         var idx = pparent.indexOf(parent) ; 
		         node.detach() ;
		         pparent.insertChild(node, idx) ; 
		         parent.detach() ;
	         }
	         // A faire si nécessaire
	         // else {
		    //     	node.detach() ;
	         //}
	      }
        }
    }
    
    var textNode = new Element("TEXTE") ;
    nodes = doc.query("/story/content/TEXTE/*") ;
    for(i=0; i<nodes.size(); i++) {
        node = nodes.get(i) ;
        if ( node.getChildCount() > 0 ) {       	  
            node.detach() ;
            textNode.appendChild(node) ;
        }
    }
    return textNode ;
}

function processGraphicXml(graphicFile) {
    var builder = new Builder();
    var doc = builder.build(graphicFile);    

    var uriTextNodes = doc.query("/graphic/content/uri/text()") ;
    for(var i=0; i<uriTextNodes.size(); i++) {
        if ( FilenameUtils.getExtension(uriTextNodes.get(i).getValue())=="jpg" && (uriTextNodes.get(i).getValue()+"").indexOf("_t")==-1 ) {
        	  if (new File(DATE_DIR + "/graphic/" + uriTextNodes.get(i).getValue()).exists()){
        	      FileUtils.copyFileToDirectory(new File(DATE_DIR + "/graphic/" + uriTextNodes.get(i).getValue()), new File(OUT_DIR)) ;
        	  }
        }
    }
}

function processImageXml(imageFile) {
    var builder = new Builder();
    var doc = builder.build(imageFile);    

    var uriTextNodes = doc.query("/image/content/uri/text()") ;
    for(var i=0; i<uriTextNodes.size(); i++) {
        if ( FilenameUtils.getExtension(uriTextNodes.get(i).getValue())=="jpg" && (uriTextNodes.get(i).getValue()+"").indexOf("_")==-1 ) {
        	  if (new File(DATE_DIR + "/image/" + uriTextNodes.get(i).getValue()).exists()){
        	  	FileUtils.copyFileToDirectory(new File(DATE_DIR + "/image/" + uriTextNodes.get(i).getValue()), new File(OUT_DIR)) ;
        	  }
        }
    }
}

// Exec GS interpreter
function convertPage(srcFile, dstFile)  {
    _print("Converting Page: " + srcFile.getName() + " to " + dstFile) ;
    var exe = "C:/Program Files/gs/gs9.04/bin/gswin32c.exe -q -dNOPROMPT -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -dPDFSETTINGS=/screen -dCompatibilityLevel=1.4 -dAutoRotatePages=/None -dGraphicsAlphaBits=4 -o " ;
    var pdf = dstFile.getName() + " " + srcFile.getPath() ;
// SH le 29/12/2011 suite blocage taritement fichier pdf (ancienne valeur 90000)
	_execFor(exe + pdf, dstFile.getParent(), 300000) ; // creates also parent directory
}

function copyToError(file, filename) {
    var dstFile = new File(ERROR_DIR, filename) ;
    _print("copie : " + filename + " vers " + dstFile.getPath()) ;
    FileUtils.copyFile(file, dstFile) ;
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    if ( nodes.size() > 1 ) _print("xpath: " + xpath + " - multiple values: " + nodes.get(0).getValue())
    return nodes.get(0).getValue() ;
}

// Create <tag> value </tag>
function createTag(tag, value) {
    var element = new Element(tag) ;
    element.appendChild(value);
    return element ;
}

// Trim string
function trim (str) {
    if ( str == null ) return null ;
    str += "" ;
    return str.replace(/^\s+/g,'').replace(/\s+$/g,'')
}

// Pad string
function pad(str , padString, length) {
    str += "" ;
    while (str.length < length)
        str = padString + str ;
    return str;
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
        _print("Process done") ;
        return _OK ;
    }
    else {
        FileUtils.forceDelete(ZIP_DIR) ;   
        return _FAIL ;
    }
}

// start & exit
_exit = main() ;

