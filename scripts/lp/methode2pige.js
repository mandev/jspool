/* test.js
 * Emmanuel Deviller
 *
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile)
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
 *
 * Attention aux mots reserves : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.java.util)  ;
importPackage(Packages.java.util.concurrent)  ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.apache.commons.lang) ;
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.com.adlitteram.imageinfo) ;
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.adlitteram.pdftool.utils) ;
importPackage(Packages.com.drew.imaging.jpeg) ;
importPackage(Packages.com.drew.metadata.iptc) ;
importPackage(Packages.com.drew.metadata.exif) ;
importPackage(Packages.java.awt) ;
importPackage(Packages.java.lang) ;
importPackage(Packages.java.awt.geom) ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.org.apache.commons.mail) ;

// TODO:
// traiter le cas d'une photo non rattachée à un article mais à une page						
// traiter les crédits multiples
// cropper les previews des PDF
// cropper les images des galleries
// Merger les story items des pages double

// ok - threader les traitements
// ok - traiter le cas d'une seconde balise <texte> dans une story (que faire?) 
// ok - filter les dummy texte (par ex. <?EM-dummyText [relance]?> )
// ok - filtrer <span id="U1102386625440z9C" style="font-family:'EuropeanPi-Three';color:#bebebe;">L</span>
// ok - Photos anamorphosées
// ok - Pages doubles

// BUGS PH
// ok - Supprimer le traitement photos
// ok - Boites avec coordonnées négatives sont à 0,0 (a tester)
// ko - Ne pas separer la page double (impossible)

// TEMP_DIR = "D:/METHODE/archive/silo_tmp/" ;
// OUTPUT_DIR = "D:/METHODE/archive/silo/" ;
// ERROR_DIR = "D:/METHODE/archive/silo_error/" ;
// SAV_DIR = "D:/METHODE/archive/silo_sav/" ;
TEMP_DIR = "D:/METHODE/archive/pige_tmp/" ;
OUTPUT_DIR = "D:/METHODE/archive/pige_out/" ;

MAIL_SERVER = "10.196.50.5" ;     // adresse du serveur smtp
MAIL_TO_USER = _getValue("MAIL_TO_USER") ;
MAIL_FROM_USER="eidosmedia@leparisien.presse.fr" ;

var ZIP_DIR ;
var DATE_PATH ;
var DATE_DIR ;
var DATE_NAME ;
var PLAN_FILENAME ;
var PLAN_UUID ;
var STDDATE ;   // 25062011
var INVDATE ;   // 20110625
var EXECUTOR ;

//var SEP_ARRAY = java.lang.reflect.Array.newInstance(java.lang.String, 2);
var SEP_ARRAY = [' ', '-','.'] ;
var TRANS_RE = new RegExp(".*translate\\((.*?)\\)", "") ;
var SCALE_RE = new RegExp(".*scale\\((.*?)\\)", "") ;    
var ROTATE_RE = new RegExp(".*rotate\\((.*?)\\)", "") ;    
var PAGE_ARRAY = ["left", "right"] ;
var XOM = ScriptUtils.createXomBuilder(false, false) ;
var IMGSET = {} ;
var PDFSET = {} ;

var imagesProps = new Array();
var storiesProps = new Array();

function isImgFirstTime(key) {  
    if ( IMGSET.hasOwnProperty(key) ) return false ; 
    IMGSET[key] = true; 
    return true ;
}

function isPdfFirstTime(key) {  
    if ( PDFSET.hasOwnProperty(key) ) return false ; 
    PDFSET[key] = true; 
    return true ;
}

// workaround for a Methode bug : JavaException: nu.xom.ParsingException: White    
// space is required between the processing instruction target and data
function filterXml(file) {
    var xmlcontent = FileUtils.readFileToString(file, "UTF-8");
    xmlcontent = xmlcontent.replaceAll("\\<\\?EM-dummyText.*?\\?\\>", "");
    return xmlcontent;
}

// Create and send the email message
function sendEmail(file) {
    _print("Sending email");
    
    var sujet = "pige Photos - " + INVDATE ;

    var email = new HtmlEmail();
    email.setHostName(MAIL_SERVER);
    email.setFrom(MAIL_FROM_USER);
    email.setCharset("UTF-8") ;
    var toUser = MAIL_TO_USER.split(";")
    for (var i in toUser) {
        email.addTo(toUser[i]);
    }
    email.setSubject(sujet);

    for (var i in file) {
    	   var attachment = new EmailAttachment();
        attachment.setPath(file[i]);
        attachment.setDisposition(EmailAttachment.ATTACHMENT);
        attachment.setName(file[i].getName());
        email.attach(attachment);
    }
    
    email.send();
}

// Unzip archive
function extractTar() {  
    _print("Extracting Tar file");
    ZIP_DIR = new File(TEMP_DIR, _srcFile.getName() + "_dir") ;
    _print("TAR_DIR: " + ZIP_DIR);
    
    if ( ZIP_DIR.exists() ) {
        _print("Deleting existing Tar dir ");
        FileUtils.forceDelete(ZIP_DIR) ;
    }

    if ( !ZIP_DIR.exists() ) {
        ScriptUtils.untarFileToDir(_srcFile.getFile(), ZIP_DIR) ;
    }

    _print("Extracting Tar file done");
}

// Unzip archive
function buildZip() {  
    _print("buildZip");
    if ( DATE_DIR.exists() ) {
        var tmpFile = new File(OUTPUT_DIR, INVDATE + ".zip_tmp") ;
        var dstFile = new File(OUTPUT_DIR, INVDATE + "_LEPARISIEN.zip") ;
        if ( tmpFile.exists() ) FileUtils.forceDelete(tmpFile) ;
        if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
        _print("Zip output dir");
        ScriptUtils.zipDirToFile(DATE_DIR, tmpFile) ;
        FileUtils.moveFile(tmpFile, dstFile) ;
    }
    else {
        _print("Zip output dir does not exist!");
    }

    _print("buildZip done");
}

// Delete ZIP_DIR
function cleanDir() {
    
    for(var i=0; i<3; i++) {
        Thread.sleep(1000);
        
        if ( ZIP_DIR.exists() ) {
            try {
                _print("Deleting: " + ZIP_DIR);
                FileUtils.forceDelete(ZIP_DIR) ;
            }
            catch (e) {
                _print("Error deleting: " + ZIP_DIR) ;
                _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
                Thread.sleep(1000);
            }        
        }
    
        if ( DATE_DIR.exists() ) {
            try {
                _print("Deleting: " + DATE_DIR);
                FileUtils.forceDelete(DATE_DIR) ;
            }
            catch (e) {
                _print("Error deleting: " + DATE_DIR) ;
                Thread.sleep(1000);
            }        
        }
    }
}

// Process zip and set global variables
function processArchive() {
    _print("Processing Archive File");

    // Date Directory 2010-14-02
    var filenames = ZIP_DIR.list() ;
    var rxp = new RegExp("\\d\\d\\d\\d-\\d\\d-\\d\\d", "") ;
    for(var i in filenames ) {
        if ( filenames[i].match(rxp) ) {
            DATE_NAME = filenames[i] ;
            _print("DATE_NAME: " + DATE_NAME);
            break ;
        }
    }

    if ( DATE_NAME == null) {
        _print("The Date Directory was not found in the Zip File");
        return false ;
    }

    // Planning: LeParisien_2010-10-14.xml
    rxp = new RegExp("LeParisien_\\d\\d\\d\\d-\\d\\d-\\d\\d\\.xml", "") ;
    filenames = new File(ZIP_DIR, DATE_NAME).list() ;
    for(i in filenames ) {
        if ( filenames[i].match(rxp) ) {
            PLAN_FILENAME = ZIP_DIR.getPath() + "/" + DATE_NAME + "/" + filenames[i] ;
            PLAN_UUID = UUID.randomUUID() ;

            var YEAR = filenames[i].substr(11,4);
            var MONTH = filenames[i].substr(16,2);
            var DAY = filenames[i].substr(19,2);

            STDDATE = DAY + "" + MONTH + "" + YEAR ;
            INVDATE = YEAR + "" + MONTH + "" + DAY ;
            
            DATE_PATH = TEMP_DIR + INVDATE + "/" + INVDATE + "/" ;
            DATE_DIR = new File(TEMP_DIR + INVDATE + "/") ;
            if ( DATE_DIR.exists() ) FileUtils.forceDelete(DATE_DIR) ;
                
            _print("PLAN_FILENAME: " + PLAN_FILENAME + " - " + DAY + "/" + MONTH + "/" + YEAR);
            break ;
        }
    }

    if ( PLAN_FILENAME == null) {
        _print("The Planning File was not found in the Zip File");
        return false ;
    }

    return true ;
}

function copyToError() {
    var srcFile = _srcFile.getFile() ;
    var errFile = new File(ERROR_DIR, _srcFile.getName()) ;
    if ( srcFile.exists() ) FileUtils.copyFile(srcFile, errFile) ;
}

// Write Element
function writeElement(element, dstFile) {
    //_print("Writing Element to  XML: " + dstFile );
    if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
    if ( !dstFile.getParentFile().exists() ) FileUtils.forceMkdir(dstFile.getParentFile()) ;
    var os = new BufferedOutputStream(new FileOutputStream(dstFile)) ;
    var serializer = new Serializer(os, "UTF-8");
    serializer.setIndent(3);
    serializer.write(new Document(element));
    os.close() ;
}

// Find all XML page files on filesystem
function createXmlPages() {
    _print("createXmlPages");
    
    // Mapping Array
    var xmlPages = new Object() ;

    var dirA = new File(ZIP_DIR, DATE_NAME + "/LeParisien/").listFiles() ;
    for(var i in dirA ) {
        var p1 = DATE_NAME + "/LeParisien/" + dirA[i].getName() + "/Page/" ;
        var dirB = new File(dirA[i], "Page").listFiles() ;
        for(var j in dirB ) {
            var path = p1 + dirB[j].getName() ; 
            var filename = new File(dirB[j]).getPath() ;
            if ( FilenameUtils.isExtension(filename, "xml")) {
                var xmlPage = createXmlPage(path) ;
                // Filter unusefull pages
                if ( xmlPage.edition != "ROUGH" ) {
                    var key = xmlPage.edition + "_" + xmlPage.book + "_" + xmlPage.editnum ; 
                    //_print("key: " + key);
                    xmlPages[key] = xmlPage ;
                }
            }
        }
    }
    return xmlPages ;
}

// Create a XML page on FS
function createXmlPage(path) {
    _print("createXmlPage: " + path);

    var doc = XOM.build(filterXml(new File(ZIP_DIR, path)), null);
    var pageNode = doc.getRootElement();
    var editionNode = doc.query("/page/pxpInfos/product/edition").get(0) ;
    var bookNodeNode = doc.query("/page/pxpInfos/product/edition/book").get(0) ;

    return {
        edition : editionNode.getAttributeValue("name") + ""  ,
        book : bookNodeNode.getAttributeValue("name") + ""  ,
        editnum : pageNode.getAttributeValue("pageNumberEdition") + "" ,
        path : path
    }
}
// Create all physical pages fron PagePlan
function createPhysPages(xmlPages) {
    _print("createPhysPages");

    var physPages = new Array() ;

    _print("opening: " + PLAN_FILENAME);
    var doc = XOM.build(new File(PLAN_FILENAME));
    var parutionNode = doc.getRootElement();
    var editionNodes = parutionNode.getChildElements()  ;

    // On liste les pages physiques
    for (var i = 0; i < editionNodes.size(); i++) {
        var editionNode = editionNodes.get(i);
        var editionName = editionNode.getAttributeValue("name") + "" ;
        var bookNodes = editionNode.getChildElements() ;

        for (var j = 0; j < bookNodes.size(); j++) {
            var bookNode = bookNodes.get(j) ;
            var bookName = bookNode.getAttributeValue("methodeName") ;
            var pageNodes = bookNode.getChildElements() ;
            var pageMax = pageNodes.size() + "" ;

            for (var k = 0; k < pageNodes.size(); k++) {
                var pageNode = pageNodes.get(k);
                var pageMasterEdition = pageNode.getAttributeValue("masterEdition") + "" ;
                if ( editionName == pageMasterEdition) {
                    var pagePn = pageNode.getAttributeValue("pn") ;
                    var pageEditionNum = pageNode.getAttributeValue("pnEditionNumber") + "" ;
                    var pageSection = pageNode.getAttributeValue("section");
                    var pageColor = pageNode.getAttributeValue("color");
                    var sequence = pageNode.getAttributeValue("sequenceNumber") + "";
                    var key = editionName + "_" + bookName + "_" + pageEditionNum ;
                   
                    if ( xmlPages.hasOwnProperty(key) ) {
                        var pagePath = xmlPages[key].path ;
                        var doublePage = null ;
                        
                        // Page double
                        if ( pagePn.contains(",") ) {
                            var n2 = parseInt(pageEditionNum.substring(1), 10) + 1;
                            var pen2 = (n2 < 10) ? "00" + n2 : "0" + n2;
                            var key2 = editionName + "_" + bookName + "_" + pen2;
                            if (xmlPages.hasOwnProperty(key2)) {
                            	  doublePage = createPhysPage("LP", editionName, bookName, pagePn, pageEditionNum, 
                                    pageSection, pageColor, pageMax, sequence, xmlPages[key2].path, null, true) ;
                                physPages.push(doublePage) ;
                            }
                            else {
                                _print("Le fichier xml de la page double " + key2 + " n'existe pas!");
                            }
                        }
                        
                        physPages.push(createPhysPage("LP", editionName, bookName, pagePn, pageEditionNum, 
                            pageSection, pageColor, pageMax, sequence, pagePath, doublePage, false)) ;
                    }
                    else {
                        _print("Le fichier xml de la page " + key + " n'existe pas!");                       
                    }
                    
                }
            }
        }
    }

    // On liste les pages liees
    for (i = 0; i < editionNodes.size(); i++) {
        editionNode = editionNodes.get(i);
        editionName = editionNode.getAttributeValue("name") + "" ;
        bookNodes = editionNode.getChildElements() ;

        for (j = 0; j < bookNodes.size(); j++) {
            bookNode = bookNodes.get(j) ;
            bookName = bookNode.getAttributeValue("name") ;
            pageNodes = bookNode.getChildElements() ;
            pageMax = pageNodes.size() + "" ;

            for ( k = 0; k < pageNodes.size(); k++) {
                pageNode = pageNodes.get(k);
                pageMasterEdition = pageNode.getAttributeValue("masterEdition") + "" ;
                if ( editionName != pageMasterEdition) {
                    var pageMasterNum = pageNode.getAttributeValue("masterPnEditionNumber") + "" ;
                    pagePn = pageNode.getAttributeValue("pn") ;
                    pageSection = pageNode.getAttributeValue("section") ;
                    pageColor = pageNode.getAttributeValue("color");
                    sequence = pageNode.getAttributeValue("sequenceNumber") + "";
                    addVirtualPage(physPages, pageMasterEdition, pageMasterNum, "LP", editionName, bookName, pagePn, pageColor, pageMax, sequence) ;
                }
            }
        }
    }
    return physPages ;
}

// Create a physical page (page that really exists)
function createPhysPage(product, edition, book, pn, editnum, section, color, pageMax, sequence, path, doublePage, isSecondPage) {
    //_print("physPage: " + date + ", " + product + ", " + edition + ", " + book  + ", " + pn + ", " + editnum + ", " + section + ", " + path);
    if ( section == null ) section = "" ;
    if ( color == null ) color = "cmyk" ;

    return {
        //date : date,
        product : product ,
        edition : edition ,
        book : book ,
        pn : pn ,
        editnum : editnum ,
        section : section ,
        color : color ,
        pageMax : pageMax ,
        sequence : sequence ,
        path : path ,
        doublePage : doublePage ,
        isSecondPage : isSecondPage,
        loid : -1 ,
        preview : null ,
        thumb : null ,
        links : new Array() ,
        containers : new Array()  // array of array of items
    }
}

// Add a linked page to a physical page
function addVirtualPage(physPages, masterEdition, masterNum, product, edition, book, pn, color, pageMax, sequence) {
    for ( i in physPages ) {
        var physPage = physPages[i] ;
        if ( physPage.edition == masterEdition &&  physPage.editnum == masterNum ) {
            //_print("linkedPage: " + masterEdition + ", " + masterNum + ", " + product + ", " + edition + ", " + book + ", " + pn);
            if ( color == null ) color = physPage.color ;

            var linkedPage = {
                product : product ,
                edition : edition,
                book : book ,
                pn : pn ,
                color : color ,
                pageMax : pageMax ,
                sequence : sequence
            }

            //_print("Add virual page: " + edition + "_" + book + "_" + pn) ;
            physPage.links.push(linkedPage) ;
            return ;
        }
    }
    _print("Unable to add virtual Page: " + masterEdition + ", " + masterNum + ", " + product + ", " + edition + ", " + book + ", " + pn);
}

// Process all pages /spool/20100927/pages dans ROOT/ANNEE/MOIS/JOUR/PRODUCT/EDITION/PAGE/BOOK
function processPages(physPages) {
    _print("processPages");
    for (var i in physPages ) {
        var physPage = physPages[i] ;
        var xmlSrcFile = new File(ZIP_DIR, physPage.path) ;
        if ( xmlSrcFile.exists() ) {
            processPage(physPage) ;
        }
        else {
            _print("Page " + xmlSrcFile +  " does not exist!");
        }
    }
}

// Create an ObjectLink
// TODO: ajouter les contents et les shape
function createItem(linkType, loid, uuid, cid, path, index) {
    //_print("createItem");
    var isValid = true ;
    
    if ( linkType == "image" )  {
        var file = new File(ZIP_DIR, path) ;
        if ( ! file.exists() || file.isDirectory() ) {
            var p = path.replace(/_.*\./, "_original.") ;
            var f = new File(ZIP_DIR, p) ; 
            if ( f.exists() && !f.isDirectory()) {
                path = p
            }
            else {
                isValid = false ;
                _print(linkType + " - " + path + " does not exist!");
            }
        }
    }
    else if ( linkType == "graphic" )  {
        file = new File(ZIP_DIR, path) ;
        if ( ! file.exists() || file.isDirectory() ) {
            p = path.replace(/_.*$/, "_original.pdf") ;
            f = new File(ZIP_DIR, p) ;
            if ( f.exists() && !f.isDirectory() ) {
                path = p
            }
            else {
                _print(linkType + " - " + path + " does not exist!");
                isValid = false ;
            }
        }
    }   
    
    return {
        linkType : linkType , 
        loid : loid ,
        uuid : uuid , 
        cid : cid , // not valid for a page or a correlation!
        path : path , // not valid for story !
        index : index,
        isValid : isValid ,
        shape : null ,
        items : new Array() // Array of items        
    }
}

// Process the physical page
function processPage(physPage) {
    _print("processPage: " + physPage.path );

    // Lit le fichier de page
    var pageDoc = XOM.build(filterXml(new File(ZIP_DIR, physPage.path)), null);
    var pageNode = pageDoc.getRootElement();
    physPage.loid = pageNode.getAttributeValue("pagePglLoid") ;

    var pxpStoryNodes = pageDoc.query("/page/pxpStories/pxpStory") ;
  
    for (var i = 0; i < pxpStoryNodes.size(); i++) {
        var pxpStoryNode = pxpStoryNodes.get(i) ;
        var pxpContentNodes = pxpStoryNode.getChildElements("content") ;
        var linkType = null ;
        var container = new Array() ;  // => Article (contient des story, images, etc.)
        
        var captionIndex = 1 ;
        for (var j = 0; j < pxpContentNodes.size(); j++) {
            var pxpContentNode = pxpContentNodes.get(j) ;
            var type = pxpContentNode.getAttributeValue("contentType") ;
            var loid = pxpContentNode.getAttributeValue("contentLoid") ;
            var cid = pxpContentNode.getAttributeValue("contentId") ;
                 
            if ( type == "picture" )  linkType = "image"  ;                
            else if ( type == "graphic" )  linkType = "graphic"  ;                
            else if ( type == "video" )  linkType = "video"  ;                
            else if ( type == "audio" )  linkType = "audio"  ;
            else if ( type == "ad" )  linkType = "other"  ;
            else if ( type == "rule" )  linkType = "other"  ;
            else if ( type == "box" )  linkType = "other"  ; // encadre
            else linkType = "story" ;

            var sameLoid = false ;
            for(var k in container) {
                if ( container[k].loid == loid ) {
                    sameLoid = true ;
                    break ;
                }
            }
            
            if ( !sameLoid && linkType != "other" ) {
                var itemNodes = pageDoc.query("/page/items/item[@loid='" + loid + "']") ;
                if ( itemNodes.size() > 0 ) {
                    var itemNode = itemNodes.get(0) ;
                    var uuid = itemNode.getAttributeValue("uuid") ;

                    if ( linkType != "story") {
                        var formatNodes = itemNode.query("formats/format") ;
                        if ( formatNodes.size() > 0 ) {
                            // var idx = formatNodes.size()-1 ;
                            var idx = 0 ;
                            //if ( linkType == "graphic" ) idx = 0 ;
                            var path = formatNodes.get(idx).getValue() + "" ;
                            container.push(createItem(linkType, loid, uuid, cid, path, captionIndex)) ;
                            if ( linkType == "image" || linkType == "graphic" ) captionIndex++ ;
                        }
                        else {
                            _print("Impossible de trouver le path pour le loid : " + loid + " - type: " + type + " - page: " + physPage.path);
                        }
                    } 
                    else {
                        container.push(createItem(linkType, loid, uuid, cid, "", 0) ) ;
                    }
                }
                else {
                    _print("L'item correspondant n'existe pas! loid : " + loid + " - type: " + type + " - page: " + physPage.path);
                }
            }
        }
        physPage.containers.push(container) ;

        // Process all stories first
        for(var k in container) {
            var item = container[k] ;
            if ( item.isValid ) {
                if ( item.linkType == "story") processStory(physPage, container, item, pageDoc) ;
            }
        }
        
        // Process reladed elements after 
        for(var k in container) {
            var item = container[k] ;
            if ( item.isValid ) {
                if ( item.linkType == "image") processImage(physPage, container, item, pageDoc) ;
                else if ( item.linkType == "graphic") processGraphic(physPage, container, item, pageDoc) ;
            //else if ( item.linkType == "video") processVideo(physPage, container, item, pageDoc) ;
            }
        }
    }

}


// Create a affine transform
// contentTm="translate(-1.266015 17.14975) scale(1.210914 1.210914)">
function createAffine(contentNodes) {
    
    var tr = [ 0, 0 ] ;
    var sc = [ 1, 1 ] ;
    var rt = [ 0 ] ;

    if ( contentNodes.size() > 0 ) {
        var str = contentNodes.get(0).getAttributeValue("contentTm") + "" ;
        
        if ( TRANS_RE.test(str) ) {
            tr = str.replace(TRANS_RE, "$1").split(" ");
        }
        if ( SCALE_RE.test(str) ) {
            sc = str.replace(SCALE_RE, "$1").split(" ");
        }
        if ( ROTATE_RE.test(str) ) {
            rt = str.replace(ROTATE_RE, "$1").split(" ") ;
        }        
    }

    return {
        tx : tr[0] ,
        ty : tr[1] ,
        sx : sc[0] ,
        sy : sc[1] ,
        ro : rt[0]
    }
}

// Create a shape
function createShape(shapeNodes) {
    // Duh!
    var x1 = 99999999 ;
    var y1 = 99999999 ;
    var x2 = -99999999 ;
    var y2 = -99999999 ;

    for (var i=0; i < shapeNodes.size(); i++) {
        var shapeNode = shapeNodes.get(i) ;
        var x = shapeNode.getAttributeValue("shapeX") ;
        if ( x != null ) x = parseFloat(x) ;
            
        var y = shapeNode.getAttributeValue("shapeY") ;
        if ( y != null ) y = parseFloat(y) ;

        var xx = shapeNode.getAttributeValue("shapeWidth") ;
        if ( xx != null ) xx = x + parseFloat(xx) ;
        
        var yy = shapeNode.getAttributeValue("shapeHeight") ;
        if ( yy != null ) yy = y + parseFloat(yy) ;
    
        if ( x != null && y != null && xx != null && yy != null ) {
            if ( x < x1 ) x1 = x ;
            if ( y < y1 ) y1 = y ;
            if ( xx > x2 ) x2 = xx ;
            if ( yy > y2 ) y2 = yy ;
        }
    }

    if ( x2 < x1 ) x2 = x1 ;
    if ( y2 < y1 ) y2 = y1 ;

    return {
        x1 : x1 ,
        y1 : y1 ,
        x2 : x2 ,
        y2 : y2
    }
}

function beautifyDate2(date) {
	if (date!='') date2 = new Date(date*1000);
	return (date!='') ? date2.getFullYear()+"/"+(date2.getMonth()+1)+"/"+date2.getDate()+" "+date2.getHours()+":"+date2.getMinutes()+":"+date2.getSeconds() : '';
}

// Process Story
function processStory(physPage, container, storyItem, pageDoc) {
    //_print("processStory " + storyFile);
   
    var itemNode = pageDoc.query("/page/items/item[@loid='" + storyItem.loid + "']").get(0) ;
    var author = getValue(itemNode, "doc/dbMetadata/Metadata/General/DocAuthor") + "";
    var chars = getValue(itemNode, "doc/dbMetadata/Metadata/General/TextInfo/CharCount") + "";
    var workfolder = getValue(itemNode, "doc/dbMetadata/sys/props/workFolder") + "";
    var edition = physPage.edition ;
    var section = physPage.section ;
    var pn = physPage.pn ;
    var dateCreated = getValue(itemNode, "doc/dbMetadata/sys/timeCreated") + "";
    var title = getValue(itemNode, "doc/dbMetadata/Metadata/General/DocTitle") + "";
    storiesProps.push(createStoryProps(author, workfolder, edition, section, chars, pn, beautifyDate2(dateCreated), title));

    // Add Shape   
    var parentNodes = pageDoc.query("/page/pxpStories/pxpStory/content[@contentLoid='" + storyItem.loid + "']/..") ;
    if ( parentNodes.size() > 0 ) {
        var shapeNodes = parentNodes.get(0).query("content/shape") ;
        storyItem.shape = createShape(shapeNodes) ;
        if ( storyItem.shape == null ) {
            _print("Story: " + storyItem.loid + " unvalid shape!") ; 
        }
    }
    else {
        _print("Story: " + storyItem.loid + " undefined parent!") ; 
    }

    // Item node
    var itemNode = pageDoc.query("/page/items/item[@loid='" + storyItem.loid + "']").get(0) ;

    var charsCount = getValue(itemNode, "doc/dbMetadata/sys/props/charsCount")  ;
    //_print("Story charsCount: " + charsCount) ; 

    // Correlation et media Gallery
    var correlationNodes = itemNode.query("correlations/correlation");
    for(var i=0; i<correlationNodes.size(); i++) {
        var correlationNode = correlationNodes.get(i) ;
        var type = correlationNode.getAttributeValue("type") ;
        var loid = correlationNode.getAttributeValue("loid") ;
        var uuid = correlationNode.getAttributeValue("uuid") ;
        if ( type == "EOM::MediaGallery" ) {
            var galleryItem = createItem("gallery", loid, uuid, -1, "", 0) ;
            processGallery(physPage, storyItem, galleryItem, pageDoc) ;
            if ( galleryItem.isValid ) storyItem.items.push(galleryItem) ;
        }    
        else if ( type == "Video" ) {
            var url = correlationNode.getAttributeValue("url") ;
            if ( loid == "external object" ) loid = UUID.randomUUID() ;
            var videoItem = createItem("video", loid, uuid, -1, url, 0) ;
            processVideo(physPage, storyItem, videoItem, pageDoc) ;
            if ( videoItem.isValid ) storyItem.items.push(videoItem) ;
        }    
    }

    if ( storyItem.items.length == 0 && charsCount < 100 ) {
        _print("Story: " + storyItem.loid + " filtered - too small text! - Page: " + physPage.sequence + " -  charsCount: " +  charsCount);                    
        storyItem.isValid = false ;
//        var hRefNodes = itemNode.query('//a');
//        if (hRefNodes.size() > 0) {
//            for (var j=0; j<hRefNodes.size(); j++) {
//        	     if (hRefNodes.get(j).getAttributeValue('href') != "") storyItem.isValid = true;
//            }
//        }
    }    

// TODO: add other filters

// var builder = new Builder();
// var doc = builder.build(storyFile);

//var mediaNodes = doc.query("/doc/article/media-groupe") ;

//    if ( (mediaNodes == null || mediaNodes.size() == 0 || mediaNodes.get(0).getValue().length() < 25 ) && charsCount < 150 )  {
//        _print("Rejecting too short article: " + storyFile);
//        //FileUtils.moveFile(storyFile, new File("C:/tmp/reject", storyFile.getName())) ;
//        FileUtils.forceDelete(storyFile);
//        return ;
//    }

//    var pn = physPage.pn ;
//    if ( pn == "1" && text.length < 300 && text.indexOf("ANDORRE") >= 0 &&  text.indexOf("DOM-TOM") > 0 && 
//        text.indexOf("BELGIQUE") > 0 && text.indexOf("SUISSE") > 0 && text.indexOf("ESPAGNE") > 0 &&
//        text.indexOf("GRECE") > 0 && text.indexOf("MAROC") > 0 && text.indexOf("PORTUGAL") > 0 &&
//        text.indexOf("ZONE CFA") > 0 && text.indexOf("TUNISIE") > 0 ) {
//        FileUtils.forceDelete(storyFile);
//        return ;
//    }
   
}

function createStoryProps(author, workfolder, edition, section, chars, pn, dateCreated, title){
    return {
    	   author : author ,
        workfolder : workfolder ,
        edition : edition ,
        section : section ,
        pn : pn ,
        chars : chars ,
        dateCreated : dateCreated,
        title : title
    }
}

// Process Tags
function processTags(nodes) {

    var nodesArray = new Array() ;
    for(var i=0; i<nodes.size(); i++) {
        nodesArray[i] = nodes.get(i) ;
    }
    
    for(var i=0; i<nodesArray.length; i++) {
        var node = nodesArray[i] ;
        
        if ( node.getChildCount() > 0 ) {
            var tag = node.getLocalName().toLowerCase() ;
            if ( tag == "surtitre" ) {
                setNodeName(node, "heading") ;
            }
            else if ( tag == "titre" ) {
                setNodeName(node, "title") ;
            }
            else if ( tag == "soustitre" ) {
                setNodeName(node, "subtitle") ;
            }
            else if ( tag == "chapo" ) {
                setNodeName(node, "lead") ;
            }
            else if ( tag == "description" ) {
                setNodeName(node, "description") ;
            }
            else if ( tag == "tables" ) {
                setNodeName(node, "table") ;
            }
            else if ( tag == "texte" ) {
                setNodeName(node, "text") ;
            }
            else if ( tag == "intertitre" ) {
                setNodeName(node, "subheading") ;
            }
            else if ( tag == "note" ) {
                setNodeName(node, "note") ;
            }
            else if ( tag == "b" || tag == "correspondant" || tag == "graspuce" || tag == "mot-cle" ) {
                setNodeName(node, "b") ;
            }
            else if ( tag == "i" ) {
                setNodeName(node, "i") ;
            }
            else if ( tag == "u" ) {
                setNodeName(node, "u") ;
            }
            else if ( tag == "a" ) {
                var classAttr = node.getAttribute("class")  ;
                if ( classAttr != null ) node.removeAttribute(classAttr) ;
            //setNodeName(node, "u") ;
            }
            else if ( tag == "question" ) {
                setNodeName(node, "p") ;
                node.addAttribute(new Attribute("type", "question")) ;
            }
            else if ( tag == "signature" ) {
                var signNode = new Element("signature") ;
                var txt = WordUtils.capitalizeFully(trim(node.getValue()), SEP_ARRAY) + "" ;
                //var txt = trim(node.getValue()) + "" ;
                txt = txt.replace(/propos recueillis par/i, "Propos recueillis par") ;
                txt = txt.replace(/ et /i, " et ") ;
                txt = txt.replace(/ avec /i, " avec ") ;
                signNode.appendChild(txt);
                node.getParent().replaceChild(node, signNode) ;
            }
            else if ( tag == "sup" ) {
                setNodeName(node, "sup") ;
            }
            else if ( tag == "span" ) {
                var classAttr = node.getAttribute("class")  ;
                var styleAttr = node.getAttribute("style")  ;

                if ( classAttr != null && (classAttr.getValue() + "") == "RESCOL" ) {
                    var txt = new Text(WordUtils.capitalize(node.getValue(), SEP_ARRAY));
                    //var txt = trim(node.getValue()) + "" ;
                    node.getParent().replaceChild(node, txt) ;
                }
                else if ( classAttr != null && (classAttr.getValue() + "") == "TMG_Puce_ronde" ) {
                    node.getParent().replaceChild(node, new Text("-")) ;
                }
                else if ( styleAttr != null &&  styleAttr.getValue().contains("font-family:'EuropeanPi-Three';") 
                    && trim(node.getValue()) == "L" ) {
                    //node.getParent().replaceChild(node, new Text("?")) ;
                    node.getParent().removeChild(node) ;
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
            //_print("attr: " + attr) ;
            //setNodeName(node, "SPAN") ;
            }
            else {
                setNodeName(node, "p") ;
            }
        }
        else {
            var tag = node.getLocalName().toLowerCase() ;
            if ( tag == "br" ) {
                var t = new Text(" ");
                node.getParent().replaceChild(node, t) ;
            }
            else 
                node.detach() ;
        }
    }
}

function addToElement(nodes, node) {
    var value = "" ; 
    for(var i=0; i<nodes.size(); i++) {
        var n = nodes.get(i) ;
        n.detach() ;
        if ( n.getChildCount() > 0 ) {
            value += n.getValue() + " " ;
        }
    }
    var t = new Text(capFirst(trim(value))) ;
    node.appendChild(t);
    return node ;
}

function createHeadingTag(itemNode){
//    processTags(itemNode.query("doc/article/titraille/surtitre/descendant-or-self::*")) ;
//    return addToElement(itemNode.query("doc/article/titraille/heading/*"), new Element("heading"))

    var nodes = itemNode.query("doc/article/titraille/surtitre/descendant-or-self::*") ;
    processTags(nodes) ;
        
    var headingNode = new Element("heading") ;
    
    nodes = itemNode.query("doc/article/titraille/heading/*") ;
    for(var i=0; i<nodes.size(); i++) {
        var node = nodes.get(i) ;
        if ( node.getChildCount() > 0 ) {
            node.detach() ;
            headingNode.appendChild(node) ;
        } 
    }
    return headingNode ;
}

function createTitleTag(itemNode){
    processTags(itemNode.query("doc/article/titraille/titre/descendant-or-self::*")) ;
    return addToElement(itemNode.query("doc/article/titraille/title/*"), new Element("title"))
}

function createSubTitleTag(itemNode){
    processTags(itemNode.query("doc/article/titraille/soustitre/descendant-or-self::*")) ;
    return addToElement(itemNode.query("doc/article/titraille/subtitle/*"), new Element("subtitle"))
}

function createLeadTag(itemNode){
    processTags(itemNode.query("doc/article/titraille/chapo/descendant-or-self::*")) ;
    return addToElement(itemNode.query("doc/article/titraille/lead/*"), new Element("lead"))
}

function createTexteTag(itemNode){

    var nodes = itemNode.query("doc/article/texte/descendant-or-self::* | doc/article/tables/descendant-or-self::*") ;
    processTags(nodes) ;
        
    var textNode = new Element("text") ;
    
    nodes = itemNode.query("doc/article/text") ;
    var size = nodes.size() ;
    
    // Special processing for course performance tabs
    if ( size > 4 ) {
        _print("createTexteTag - multi text nodes - size: " + size);
        nodes = itemNode.query("doc/article/text/*") ;
        for(var i=0; i<nodes.size(); i++) {
            var node = nodes.get(i) ;
            if ( node.getChildCount() > 0 ) {
                node.detach() ;
                textNode.appendChild(node) ;
            }
        }
    }
    else {
        var maxLen = 0 ;
        var maxInd = 0 ;
        // delete relance by keeping the max text node length
        if ( size > 1 ) {
            _print("createTexteTag - multi text nodes - size: " + size);
            for(var i=0; i<size; i++) {
                var len = nodes.get(i).getValue().length() ;
                if ( len > maxLen ) {
                    maxLen = len ;
                    maxInd = i ;
                }
            }
            _print("createTexteTag - taking text node #" + (maxInd+1));
        }

        if ( maxInd < size ) {
            nodes = itemNode.query("doc/article/text[" + (maxInd+1) + "]/*") ;
            for(var i=0; i<nodes.size(); i++) {
                var node = nodes.get(i) ;
                if ( node.getChildCount() > 0 ) {
                    node.detach() ;
                    textNode.appendChild(node) ;
                }
            }
        }
    }
    return textNode ;
}

// TODO:
// Les photos dans la media gallery ne sont pas identifiees par des loid
// il est par consequent difficile de les traiter coimme les autres photos !
// Voir avec EidosMedia pour refaire cette partie
function processGallery(physPage, storyItem, galleryItem, pageDoc) {
    _print("processGallery - processing : " + galleryItem.loid);                    
    
    var galleryNode = pageDoc.query("/page/items/item[@loid='" + galleryItem.loid + "']").get(0) ;
    var photoNodes = galleryNode.query("doc/article/galerie/photo-groupe") ;
    
    for(var i=0; i<photoNodes.size(); i++) {
        var photoNode = photoNodes.get(i) ;
        var fgPhotoNodes = photoNode.query("fg-photo") ;
        if ( fgPhotoNodes.size() > 0 ) {
            var path = fgPhotoNodes.get(0).getAttributeValue("fileref");
            // "/LP/Divers/aremond_1280930985644.jpg?uuid=f205cad6-9fd1-11df-a98a-00144f6f4ec8"
            var uuid = path.substring(path.lastIndexOf("=") + 1) ;
            path = FilenameUtils.getFullPath(physPage.path) + "../Media/" ;
            path = FilenameUtils.normalize(path) + uuid + "_original.jpg" ;
            var imageFile = new File(ZIP_DIR, path) ;
            if ( imageFile.exists() ) {
                // Filter Image
                var imageInfo = ScriptUtils.getImageInfo(imageFile);
                if ( imageInfo == null || imageInfo.getWidth() <1 || imageInfo.getHeight() < 1 ) {
                    _print("imagegal: " +  imageFile.getPath() + " not a valid image!");                    
                }
                else {
                    galleryItem.items.push(createItem ("imagegal", uuid, uuid, -1, path, i)) ;
                }
            }
            else {
                _print("imagegal: "  + imageFile + " does not exist!");                    
            }
        }
        else {
            _print("imagegal: aucune image prÃ©sente");                    
        }
    }
    
    if ( galleryItem.items.length == 0 ) {
        galleryItem.isValid = false ;
        _print("gallery: aucune image dans la galerie");                    
    }
}

function beautifyDate(date) {
	return (date!='') ? date.substring(0,4)+"/"+date.substring(4,6)+"/"+date.substring(6,8)+" "+date.substring(8,10)+":"+date.substring(10,12)+":"+date.substring(12,14) : '';
}

// Process image
function processImage(physPage, container, imageItem, pageDoc) {
    var imageFile = new File(ZIP_DIR, imageItem.path) ;
	
    if ( imageFile.exists() ) {

        var itemNode = pageDoc.query("/page/items/item[@loid='" + imageItem.loid + "']").get(0) ;
	   var author = (getValue(itemNode, "dbMetadata/Metadata/General/Custom_by-line") + "").replace(/(\r\n|\n|\r)/gm," ");
        var caption = (getValue(itemNode, "dbMetadata/Metadata/General/Custom_Caption") + "").replace(/(\r\n|\n|\r)/gm," ");
        var caption_author = (getValue(itemNode, "dbMetadata/Metadata/General/Caption_Author") + "").replace(/(\r\n|\n|\r)/gm," ");
        var credit = (getValue(itemNode, "dbMetadata/Metadata/General/CreditPhoto") + "").replace(/(\r\n|\n|\r)/gm," ");
        var workfolder = getValue(itemNode, "dbMetadata/sys/props/workFolder") + "";
        var edition = physPage.edition ;
        var section = physPage.section ;
        var pn = physPage.pn ;
        var dateShoot = getValue(itemNode, "dbMetadata/Metadata/General/Custom_Source/date_Shoot") + "";
        if (dateShoot == "") dateShoot = getValue(itemNode, "dbMetadata/Metadata/General/Custom_Source/date_TimeTrasm") + "";
        var dateCreated = getValue(itemNode, "dbMetadata/Metadata/General/date_created") + "";
        var title = (getValue(itemNode, "dbMetadata/Metadata/General/DocTitle") + "").replace(/(\r\n|\n|\r)/gm," ");
        var city = getValue(itemNode, "dbMetadata/Metadata/General/GeographicalPlaces/City_Name");
        var place = '';
        if (city != "") place = city + " - " + getValue(itemNode, "dbMetadata/Metadata/General/GeographicalPlaces/Country");
        
        var shapeNode = pageDoc.query("/page/pxpStories/pxpStory/content[@contentLoid='" + imageItem.loid + "']/shape").get(0) ;
	   var width = Math.round(parseInt(shapeNode.getAttributeValue("shapeWidth") + "")*10/2.8346)/10;
        var height = Math.round(parseInt(shapeNode.getAttributeValue("shapeHeight") + "")*10/2.8346)/10;
        var x = Math.round(parseInt(shapeNode.getAttributeValue("shapeX") + "")*10/2.8346)/10;
        var y = Math.round(parseInt(shapeNode.getAttributeValue("shapeY") + "")*10/2.8346)/10;

        imagesProps.push(createImageProps(author, caption, caption_author, credit, workfolder, edition, section, pn, width, height, x, y, beautifyDate(dateShoot).replace(/(\r\n|\n|\r)/gm," "), beautifyDate(dateCreated).replace(/(\r\n|\n|\r)/gm," "), title, place));

       // Add Affine
        var contentNodes = pageDoc.query("/page/pxpStories/pxpStory/content[@contentLoid='" + imageItem.loid + "']") ;
        imageItem.affine = createAffine(contentNodes) ;

        // Add Shape   
        var shapeNodes = pageDoc.query("/page/pxpStories/pxpStory/content[@contentLoid='" + imageItem.loid + "']/shape") ;
        imageItem.shape = createShape(shapeNodes) ;
        
        // TODO: test if shape does not belong to a story but is contained in a story shape
        // If so detach image from page and attach it to the story

        // Filter Image
        var imageInfo = ScriptUtils.getImageInfo(imageFile);
        if ( imageInfo == null || imageInfo.getWidth() <1 || imageInfo.getHeight() < 1 ) {
            _print("Image: " + imageItem.loid + " filtered - invalid image! Page: " + physPage.sequence + " - " +  imageFile.getPath());                    
            imageItem.isValid = false ;
        }    
    
        else if ( imageInfo.getWidth() < 150 || imageInfo.getHeight() < 150 ) {
            _print("Image: " + imageItem.loid + " filtered - too small (or invalid) image! Page: " + physPage.sequence + " - " +  imageFile.getPath() + " - " + imageInfo.getWidth() + "x" +  imageInfo.getHeight() );                    
            imageItem.isValid = false ;
        }    

        else if ( imageFile.length() < 40000 ) {
            _print("Image: " + imageItem.loid + " filtered - too slim image! Page: " + physPage.sequence + " - " +  imageFile.getPath() + " - " + imageFile.length() + " bytes" );                    
            imageItem.isValid = false ;
        }
        
    }
    else {
        // TODO: supprimer l'image de la page'
        _print("Image: " + imageItem.loid + " - Page: " + physPage.sequence + " -  " +  imageFile.getPath() + " does not exist!");                    
        imageItem.isValid = false ;
    }
}

function createImageProps(author, caption, caption_author, credit, workfolder, edition, section, pn, width, height, x, y, dateShoot, dateCreated, title, place){
    return {
    	   author : author ,
        caption : caption , 
        caption_author : caption_author , 
        credit : credit , 
        workfolder : workfolder ,
        edition : edition ,
        section : section ,
        pn : pn ,
        width : width, 
        height : height, 
        x : x, 
        y : y, 
        dateShoot : dateShoot ,
        dateCreated : dateCreated,
        title : title,
        place : place 
    }
}

// Process graphic
function processGraphic(physPage, container, graphicItem, pageDoc) {
    //_print("processGraphic: " + graphicItem.path);
    var graphicFile = new File(ZIP_DIR, graphicItem.path) ;
    if ( graphicFile.exists() ) {

        // Add Affine
        var contentNodes = pageDoc.query("/page/pxpStories/pxpStory/content[@contentLoid='" + graphicItem.loid + "']") ;
        graphicItem.affine = createAffine(contentNodes) ;

        // Add Shape   
        var shapeNodes = pageDoc.query("/page/pxpStories/pxpStory/content[@contentLoid='" + graphicItem.loid + "']/shape") ;
        graphicItem.shape = createShape(shapeNodes) ;
        if ( graphicItem.shape == null ) {
            _print("Image: " + graphicItem.loid + " unvalid shape!") ; 
        }

        if ( graphicFile.length() < 40000 ) {
            _print("Graphic: " + graphicItem.loid + " filtered - too slim graphic! Page: " + physPage.sequence + " - " +  graphicFile.getPath() + " - " +  graphicFile.length() + " bytes");                    
            graphicItem.isValid = false ;
        }

    //var itemNode = pageDoc.query("/page/items/item[@loid='" + graphicItem.loid + "']").get(0) ;
        
    // Filter
    }
    else {
        // TODO: supprimer l'image de la page'
        _print("Graphic: " + graphicItem.loid + " - Page: " + physPage.sequence + " -  " +  graphicFile.getPath() + " does not exist!");                    
        graphicItem.isValid = false ;
    }
}

// Process image
function processVideo(physPage, container, videoItem, pageDoc) {
    _print("processVideo: " +  videoItem.path);
// TODO: We could test if the URL exists
}

// Get Some IPTC values
function getIptcData(file) {
    // Jpeg Only
    var iptcDir = null ;
    try {
        var metadata = JpegMetadataReader.readMetadata(file) ;
        iptcDir = ScriptUtils.getIptcDirectory(metadata);
        if ( iptcDir != null ) {
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
            return iptcData ;
        }
    }
    catch (e) {
        _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
        _print("Error parsing iptc: " + file) ;
    }
    return iptcDir ;
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

function printExecutor()    {
    var tc = EXECUTOR.getTaskCount() ;
    var ac = EXECUTOR.getActiveCount() ;
    var ctc = EXECUTOR.getCompletedTaskCount() ;
    _print("Executor - WaitingTaskCount: " + (tc-ac-ctc) + " - ActiveCount: " + ac + " - CompletedTaskCount: " + ctc);
}
 
// Convert from Adobe point to mm and round 1
// TODO: A vérifier 
function round1(n)    {
    return Math.round(n/72*2540) / 100;
}

function sign(n) {
    return (n >= 0) ? "+" + n : n ;
}

function toRad(deg) {
    return deg * Math.PI/180;
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

function writeProps() {
    var dstFile = new File(OUTPUT_DIR, INVDATE + "_imagesProps.csv") 
    var sb = new StringBuffer();
    sb.append("EDITION | SECTION | WORKFOLDER | CREDIT | AUTHOR | CAPTION_AUTHOR | PAGE | WIDTH | HEIGHT | X | Y | DATE_SHOOT | DATE_CREATION | TITLE | PLACE  | CAPTION\r\n");
 
    for (var i in imagesProps) {
    	sb.append(imagesProps[i].edition + "|" + imagesProps[i].section + "|" + imagesProps[i].workfolder + "|" + 
    		imagesProps[i].credit + "|" + imagesProps[i].author + "|" + imagesProps[i].caption_author + "|" + 
    		imagesProps[i].pn + "|" + imagesProps[i].width + "|" + imagesProps[i].height + "|" + 
    		imagesProps[i].x + "|" + imagesProps[i].y + "|" + imagesProps[i].dateShoot + "|" + 
        	imagesProps[i].dateCreated + "|" + imagesProps[i].title + "|" + imagesProps[i].place + "|" + 
        	imagesProps[i].caption + "\r\n");
    }
    var bw = new BufferedWriter(new FileWriter(dstFile)) ;
    bw.write(sb.toString());
    bw.flush() ;
    bw.close() ;

    var dstFile2 = new File(OUTPUT_DIR, INVDATE + "_storiesProps.csv") 
    var sb2 = new StringBuffer();
    sb2.append("EDITION | SECTION | WORKFOLDER | AUTHOR | PAGE | CHARS | DATE_CREATION | TITLE \r\n");
 
    for (var i in storiesProps) {
    	  sb2.append(storiesProps[i].edition + "|" + storiesProps[i].section + "|" + storiesProps[i].workfolder + "|" + 
    		storiesProps[i].author + "|" + storiesProps[i].pn + "|" + storiesProps[i].chars + "|" + 
        	storiesProps[i].dateCreated + "|" + storiesProps[i].title + "\r\n");
    }
    var bw2 = new BufferedWriter(new FileWriter(dstFile2)) ;
    bw2.write(sb2.toString());
    bw2.flush() ;
    bw2.close() ;

    sendEmail([dstFile, dstFile2]);
}

  
// Main
function main() {
    _print("Starting Process");

    EXECUTOR = ScriptUtils.createFifoExecutor() ;
    
    extractTar() ;
    if ( processArchive() ) {
        var xmlPages = createXmlPages() ;
        var physPages = createPhysPages(xmlPages) ;
        processPages(physPages) ;
        writeProps();
		
        _print("Waiting for executor to complete");
        EXECUTOR.shutdown() ;    
        var status = EXECUTOR.awaitTermination(60, TimeUnit.MINUTES);
		
        buildZip() ;
        cleanDir() ;
    
        if ( status ) {
            _print("Process Done");
            return _OK ;
        }   
        else {
            _print("Executor time-out. Process Aborted");
            copyToError() ;
            return _OK ;
        }
    }
    else {
        _print("General Error. Process Aborted");
        cleanDir() ;
        copyToError() ;
        return _OK ;
    }
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
}