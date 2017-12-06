/* test.js
 * Emmanuel Deviller
 *
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile)
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io) ;
importPackage(Packages.java.net) ;
importPackage(Packages.java.util) ;
importPackage(Packages.java.lang) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.apache.commons.lang) ;
importPackage(Packages.org.apache.commons.mail) ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.com.adlitteram.jspool) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

STAGING_DIR = "C:/temp/milibris" ;

MAIL_SERVER = "10.196.50.5" ;     // adresse du serveur smtp
MAIL_TO_USER = _getValue("MAIL_TO_USER") ;
MAIL_FROM_USER="milibris@leparisien.net" ;

MAX_SIZE = 1280 ;  // Pixels
REL_SIZE = 1280 ;
PREVIEW_SIZE=768;
THUMB_SIZE=192 ;
//
var ZIP_DIR ;  

var SEP_ARRAY = [' ', '-','.'] ;

function sendEmail(status, issue, version, cause, file) {
    _print("Sending email");
    
    var sujet = "Alerte Milibris" ;
 
    var corps = "<html><body>" ;
    // var value = trim(getValue(itemNode, "content/title")) ;
    corps += "<h3>Statut : " + status + "</h3>"  ;
    corps += "<h3>Daté : " + issue + "</h3>"  ;
    corps += "<h3>Edition : " + version + "</h3>"  ;
    corps += cause ;
    corps += "</body></html>" ;

    var email = new HtmlEmail();
    email.setHostName(MAIL_SERVER);
    email.setFrom(MAIL_FROM_USER);
    email.setCharset("UTF-8") ;
    var attachment = new EmailAttachment();
    attachment.setPath(file.getPath());
    attachment.setDisposition(EmailAttachment.ATTACHMENT);
    attachment.setName("mail_orig.xml");
    email.attach(attachment);

    var toUser = MAIL_TO_USER.split(";")
    for (var i in toUser) {
        email.addTo(toUser[i]);
    }
    email.setSubject(sujet);
    email.setHtmlMsg(corps);
    
    email.send();
}

// Unzip archive
function extractZip() {  
    _print("Extracting Zip file");
    ZIP_DIR = new File(STAGING_DIR, _srcFile.getName() + "_dir") ;
    _print("ZIP_DIR: " + ZIP_DIR);
    //if ( ZIP_DIR.exists() ) FileUtils.forceDelete(ZIP_DIR) ;
    if ( !ZIP_DIR.exists() )
        ScriptUtils.unzipFileToDir(_srcFile.getFile(), ZIP_DIR) ;

    _print("Extracting Zip file done");
}

// Delete ZIP_DIR
function deleteZipDir() {
    _print("Purging " + ZIP_DIR);
    if ( ZIP_DIR.exists() ) FileUtils.forceDelete(ZIP_DIR) ;
}

// Process zip and set global variables
function processZip() {
    _print("Processing Zip File");
         
    var files = ZIP_DIR.listFiles() ;
    
    for (var i in files ) {
        var file = files[i] ;
        if ( FilenameUtils.getExtension(file.getName()).toLowerCase() == "xml") {
	        var builder = new Builder();
	        var doc = builder.build(file);
	        var itemNode = doc.getRootElement() ;
	        var subject = getValue(itemNode,"subject") ;
	        var from = getValue(itemNode, "from") ;
			
	        if (subject.match("milibris")) {
		        var text = itemNode.query("texts/text").get(0).getValue() ;
			  
			   var status = text.substr(text.lastIndexOf("Publication ")+12, 7);
			   var cause = text.substring(text.lastIndexOf("Publication ")+19, text.lastIndexOf("====== Infos"));
			   var issue = text.substring(text.lastIndexOf("Issue : ")+8, text.lastIndexOf("Version : "));
			   issue = issue.match(/\d+-\d+-\d+/g) ;
			   var version = text.substring(text.lastIndexOf("Version : ")+10, text.lastIndexOf("Title : "));	
			   // var subject = "Status : " + status + " Issue : " + issue + " version : " + version ;
			   // _print("Status : " + status + " Issue : " + issue + " version : " + version) ;
			   // _print("Cause : " + cause) ;
			   
			   if (status == "FAILURE") {
			   	    _print("Envoi mail à " + MAIL_TO_USER) ; 
			   	    sendEmail(status, issue, version, cause, file) ;
			   }

	     	}
	    	}
    }
}

function nonNull(value) {
    return ( value == null ) ? "" : value ;
}

function capFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Trim string
function trim (str) {
    if ( str == null ) return null ;
    str += "" ;
    return str.replace(/^\s+/g,'').replace(/\s+$/g,'')
}

function setNodeName(node, newName) {
    for(var i=node.getAttributeCount()-1; i>=0; i--) {
        var attr = node.getAttribute(i) ;
        //_print("node :" + node.getQualifiedName() + " attribut: " + attr) ;
        node.removeAttribute(attr) ;
    }
    node.setLocalName(newName) ;
}

function insertNode(node, newTag, newName) {
    var newNode = new Element(newTag) ;
    node.getParent().replaceChild(node, newNode) ;
    newNode.appendChild(node) ;
    node.setLocalName(newName) ;
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    if ( nodes.size() > 1 ) _print("xpath: " + xpath + " - multiple values: " + nodes.get(0).getValue())
    return nodes.get(0).getValue() ;
}

// Create <tag> value </tag>
function createElement(tag, value) {
    var element = new Element(tag) ;
    element.appendChild(value);
    return element ;
}

// Main
function main() {
    _print("Starting Process");

    extractZip() ;
    processZip() ;
    deleteZipDir() ;
    
    _print("Process Done");
    
    return _OK ;
    //return _KEEP ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
}

