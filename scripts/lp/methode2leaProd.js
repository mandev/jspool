/* test.js
 * Emmanuel Deviller
 *
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile)
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.java.util)  ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.apache.commons.lang) ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.adlitteram.imageinfo) ;
importPackage(Packages.com.drew.imaging.jpeg) ;
importPackage(Packages.com.drew.metadata.iptc) ;
importPackage(Packages.com.drew.metadata.exif) ;
importPackage(Packages.org.apache.commons.mail) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

MAIL_SERVER="193.16.201.5" ;     // adresse du serveur smtp
MAIL_TO_USER= ["edeviller@leparisien.fr" ] ;
MAIL_FROM_USER="eidosmedia@leparisien.presse.fr" ;

STAGING_DIR = "C:/tmp/web/contrib/staging/" ;
OUTPUT_DIR = "C:/tmp/web/contrib/output/" ;
ZIPOUT_DIR = "C:/tmp/web/contrib/zipout/" ;
ERROR_DIR = "C:/tmp/web/contrib/error/"
    
GS_PATH = "C:/Program Files/gs/gs9.04/bin/gswin32c.exe" ;

MAX_SIZE = 1280 ;  // Pixels
REL_SIZE = 1280 ;
PREVIEW_SIZE=768;
THUMB_SIZE=192 ;
//
var ZIP_DIR ;
var OUTPUT_NAME ;  

var SEP_ARRAY = [' ', '-','.'] ;
var TO_REMOVE = [ "&#0;", "&#1;", "&#2;", "&#3;", "&#4;", "&#5;", "&#6;", "&#7;", "&#8;", "&#9;", "&#10;" ] ; // par ""
var TO_REPLACE = [ "&#8239;", "&#8201;", "&#160;" ] ; // par " "

var XOM = ScriptUtils.createXomBuilder(false, false) ;

function cleanStoryFile(file) {
    var content = FileUtils.readFileToString(file);
    for (var i in TO_REMOVE) {
        content = content.replace(TO_REMOVE[i], "");
    }
    for (var j in TO_REPLACE) {
        content = content.replace(TO_REPLACE[j], " ");
    }
    FileUtils.writeStringToFile(file, content);
    return file ;
}

// Create and send the email message
function sendMail(toUser, sujet, corps) {
    _print("Sending message") ;
    
    var email = new HtmlEmail();
    email.setHostName(MAIL_SERVER);
    email.setFrom(MAIL_FROM_USER);
    email.setCharset("UTF-8") ;
    for (i in toUser) email.addTo(toUser[i]);
    email.setSubject(sujet);
    email.setHtmlMsg(corps);

    email.send();
}

// Unzip archive
function extractZip() {  
    _print("Extracting Zip file");
    ZIP_DIR = new File(STAGING_DIR, _srcFile.getName() + "_dir") ;
    _print("ZIP_DIR: " + ZIP_DIR);
    if ( ZIP_DIR.exists() ) FileUtils.forceDelete(ZIP_DIR) ;
    if ( !ZIP_DIR.exists() )
        ScriptUtils.unzipFileToDir(_srcFile.getFile(), ZIP_DIR) ;

    _print("Extracting Zip file done");
}

// Zip archive
function buildZip() {  
    _print("Building Zip file");
    ZIP_DIR = new File(OUTPUT_DIR) ;
    if ( ZIP_DIR.exists() ) {
        var ZIP_FILE = new File(ZIPOUT_DIR + OUTPUT_NAME + ".zip") ;
        _print("ZIP_FILE: " + ZIP_FILE);
        ScriptUtils.zipDirToFile(ZIP_DIR, ZIP_FILE) ;
        _print("Building Zip file done");
        FileUtils.forceDelete(ZIP_DIR) ;
    }
    else {
        _print("Error: the directory " + ZIP_DIR + " does not exist");
        var dstFile = new File(ERROR_DIR, _srcFile.getName()) ; 
        _print("Copy " + _srcFile.getName() + " to " + dstFile.getPath());
        FileUtils.copyFile(_srcFile.getFile(), dstFile) ;
    }
    FileUtils.forceDelete(new File(STAGING_DIR, _srcFile.getName() + "_dir")) ;
}

// Delete ZIP_DIR
function deleteZipDir() {
    _print("Purging " + ZIP_DIR);
    if ( ZIP_DIR.exists() ) FileUtils.forceDelete(ZIP_DIR) ;
}



// Process zip and set global variables
function processZip() {
    _print("Processing Zip File");
    
    var files = new File(ZIP_DIR, "Story").listFiles() ;
    for(var i in files ) {

        var file = cleanStoryFile(files[i]) ;
        var doc = XOM.build(file);
        var itemNode = doc.getRootElement() ;
        var loid = itemNode.getAttributeValue("loid") ;
        OUTPUT_NAME = loid ;

        var type = itemNode.getAttributeValue("type") ;

        var linkedItems = new Array() ;       
        if ( type == "EOM::Story") {
            processStory(file, itemNode, linkedItems) ;
            var storyElement = writeStory(itemNode, linkedItems) ;
            sendEmail(storyElement);
        }
        else if ( type == "EOM::MediaGallery") {
            processGallery(file, itemNode, linkedItems) ;
            var galleryElement = writeGallery(itemNode, linkedItems) ;
            sendEmail(galleryElement);
        }        
    }
}

function sendEmail(itemNode) {
    _print("Sending email");
    
    var sujet = "Contribution WEB" ;
    value = trim(getValue(itemNode, "metadata/authors/author")) ;
    if ( value != null && value.length > 0 ) sujet += " - " + value ;
    value = trim(getValue(itemNode, "metadata/categories/category")) ;
    if ( value != null && value.length > 0 ) sujet += " - " + value ;
    value = trim(getValue(itemNode, "content/title")) ;
    if ( value != null && value.length > 0 ) sujet += " - " + value ;

    var corps = "<html><body>" ;
    // var value = trim(getValue(itemNode, "content/title")) ;
    if ( value != null && value.length > 0) corps += "<h2>" + value + "</h2>"  ;
    value = trim(getValue(itemNode, "content/text")) ;    
    if ( value != null && value.length > 0) corps += value ;
    value = trim(getValue(itemNode, "story/content/legend")) ;
    if ( value != null && value.length > 0) corps += "<h3>" + value + "</h3>" ;
    corps += "</body></html>" ;

    // Envoi du mail
    //sendMail(MAIL_TO_USER, sujet, corps) ;
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

function createItem(linkType, loid, uuid, path, index) {
    //_print("createItem");
    var isValid = true ;
    
    //    if ( linkType == "image" )  {
    //        var file = new File(ZIP_DIR, path) ;
    //        if ( ! file.exists() || file.isDirectory() ) {
    //            var p = path.replace(/_.*\./, "_original.") ;
    //            var f = new File(ZIP_DIR, p) ; 
    //            if ( f.exists() && !f.isDirectory()) {
    //                path = p
    //            }
    //            else {
    //                isValid = false ;
    //                _print(linkType + " - " + path + " does not exist!");
    //            }
    //        }
    //    }
    //    else if ( linkType == "graphic" )  {
    //        file = new File(ZIP_DIR, path) ;
    //        if ( ! file.exists() || file.isDirectory() ) {
    //            p = path.replace(/_.*$/, "_original.pdf") ;
    //            f = new File(ZIP_DIR, p) ;
    //            if ( f.exists() && !f.isDirectory() ) {
    //                path = p
    //            }
    //            else {
    //                _print(linkType + " - " + path + " does not exist!");
    //                isValid = false ;
    //            }
    //        }
    //    }   
    
    return {
        linkType : linkType , 
        loid : loid ,
        uuid : uuid , 
        path : path , // not valid for story !
        index : index,
        isValid : isValid ,
        items : new Array() // Array of items        
    }
}

// Process Story
function processStory(storyFile, itemNode, linkedItems) {
    _print("processStory " + storyFile);
   
    //var charsCount = getValue(itemNode, "doc/dbMetadata/sys/props/charsCount")  ;
    //_print("Story charsCount: " + charsCount) ;   
    
    var captionIndex = 1 ;
    // Correlation et media Gallery
    var correlationNodes = itemNode.query("correlations/correlation");
    for(var i=0; i<correlationNodes.size(); i++) {
        var correlationNode = correlationNodes.get(i) ;
        var type = correlationNode.getAttributeValue("type") ;
        var loid = correlationNode.getAttributeValue("loid") ;
        var uuid = correlationNode.getAttributeValue("uuid") ;
        var path ;
        if ( (type == "Image" )||(type == "WireImage" ) ) {
            path = "Media/" + uuid + "_original.jpg" ;
            var imageItem = createItem("image", loid, uuid, path, captionIndex++) ;
            processImage(imageItem) ;
            linkedItems.push(imageItem) ;
        }
        else if ( type == "Graphic" ) {
            path = "Media/" + uuid + "_original.pdf" ;
            var graphicItem = createItem("graphic", loid, uuid, path, captionIndex++) ;
            processGraphic(graphicItem) ;
            linkedItems.push(graphicItem) ;
        }
        else if ( type == "Video" ) {
            var url = correlationNode.getAttributeValue("url") ;
            if ( loid == "external object" ) loid = UUID.randomUUID() ;
            var videoItem = createItem("video", loid, uuid, url, 0) ;
            processVideo(videoItem) ;
            linkedItems.push(videoItem) ;
        }
    //        else if ( type == "EOM::MediaGallery" ) {
    //            var galleryItem = createItem("gallery", loid, uuid, "", 0) ;
    //            //processGallery(physPage, storyItem, galleryItem, pageDoc) ;
    //            if ( galleryItem.isValid ) linkedItems.items.push(galleryItem) ;
    //        }            
    }

}

// Build XML & write story
function writeStory(storyNode, linkedItems) {
    
    var charsCountElt = createElement("charsCount", getValue(storyNode, "doc/dbMetadata/sys/props/charsCount")) ;
    var wordCountElt = createElement("wordCount", getValue(storyNode, "doc/dbMetadata/sys/props/wordCount"))
 
    var loid = storyNode.getAttributeValue("loid") ;
    
    // Create XML
    var storyElement = new Element("story");
    var metaElement = new Element("metadata");
    storyElement.appendChild(metaElement) ;

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE")) ;
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication"))) ;
    metaElement.appendChild(createElement("permission", 0)) ;

    metaElement.appendChild(createElement("extRef", loid)) ;
    metaElement.appendChild(charsCountElt) ;
    metaElement.appendChild(wordCountElt) ;
    metaElement.appendChild(createElement("city", getValue(storyNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/City_Name"))) ;
    metaElement.appendChild(createElement("country", getValue(storyNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Country"))) ;
    metaElement.appendChild(createElement("address", getValue(storyNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Address"))) ;
 
    var catElement = new Element("categories") ;
    catElement.appendChild(createElement("category", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + "")) ;
    metaElement.appendChild(catElement) ;

    var keyElement = new Element("keywords") ;
    keyElement.appendChild(createElement("keyword", getValue(storyNode, "doc/dbMetadata/Metadata/General/DocKeyword") + "")) ;
    metaElement.appendChild(keyElement) ;

    var authorsElement = new Element("authors");
    var txt = trim(getValue(storyNode, "doc/dbMetadata/Metadata/General/Custom_by-line")) + "" ;
    txt = txt.replace(/propos recueillis par/i, "") ;
    txt = WordUtils.capitalize(txt) + "" ;
    txt = txt.replace(/ et /i, " et ") ;
    txt = txt.replace(/ avec /i, " avec ") ;
    var authors = txt.split(" et ") ;
    for(var j in authors){
        authorsElement.appendChild(createElement("author", authors[j]));
    }
    metaElement.appendChild(authorsElement);

    // Publication channel
    var webElement = new Element("webChannel") ;
    metaElement.appendChild(webElement) ;
    
    webElement.appendChild(createElement("status", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Web/Status") + "")) ;
    webElement.appendChild(createElement("comment", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Web/Comment") + "")) ;
    webElement.appendChild(createElement("profile", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Web/Profile") + "")) ;
    webElement.appendChild(createElement("priority", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Digital/Priority") + "")) ;
    var topicsList = getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Web/TopicsList") + "";
    var topics = topicsList.split('\*');
    var topicsElement = new Element("topics") ;
    for (l=0; l< topics.length-1; l++) {
        topicsElement.appendChild(createElement("topic", topics[l] + ""));
    }
    webElement.appendChild(topicsElement) ;

    // Links
    var objectLinks = new Element("objectLinks") ;
    metaElement.appendChild(objectLinks) ;

    for(var k in linkedItems) {
        var item = linkedItems[k] ;
        if ( item.isValid ) {
            var objectLink = new Element("objectLink") ;
            objectLink.addAttribute(new Attribute("linkType", item.linkType)) ;
            objectLink.addAttribute(new Attribute("extRef", item.loid)) ;
            objectLinks.appendChild(objectLink) ;
            if ( item.linkType == "image" ) writeImage(item, storyNode) 
            else if ( item.linkType == "graphic" ) writeGraphic(item, storyNode) 
            else if ( item.linkType == "video" ) writeVideo(item, storyNode) 
        //if ( item.linkType == "gallery" ) writeGallery(storyItem, item, pageDoc) 
        }        
    }

    var contentElement = new Element("content");
    storyElement.appendChild(contentElement) ;
    contentElement.appendChild(createHeadingTag(storyNode));
    contentElement.appendChild(createTitleTag(storyNode));
    contentElement.appendChild(createSubTitleTag(storyNode));
    contentElement.appendChild(createLeadTag(storyNode));
    contentElement.appendChild(createTexteTag(storyNode));
    contentElement.appendChild(createLegPhotoTag(storyNode));

    // Reprocess CharCount & WordCount
    var cntValue = contentElement.getValue()+ "" ;
    charsCountElt.getChild(0).setValue(cntValue.length) ;
    wordCountElt.getChild(0).setValue( cntValue.length == 0 ? 0 : cntValue.split(' ').length) ;
    
    // Write Story
    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/story/" + loid + ".xml" ;
    var dstFile = new File(dstPath) ;
    writeElement(storyElement, dstFile)
    
    return storyElement ;
}

// Process Gallery
function processGallery(galleryFile, itemNode, linkedItems) {
    _print("processGallery " + galleryFile);
    
    var photoNodes = itemNode.query("doc/article/galerie/photo-groupe") ;
    
    for(var i=0; i<photoNodes.size(); i++) {
        var photoNode = photoNodes.get(i) ;
        var fgPhotoNodes = photoNode.query("fg-photo") ;
        if ( fgPhotoNodes.size() > 0 ) {
            var path = fgPhotoNodes.get(0).getAttributeValue("fileref");
            // "/LP/Divers/aremond_1280930985644.jpg?uuid=f205cad6-9fd1-11df-a98a-00144f6f4ec8"
            var uuid = path.substring(path.lastIndexOf("=") + 1) ;
            path = "Media/" + uuid + "_original.jpg" ;
            var imageFile = new File(ZIP_DIR, path) ;
            if ( imageFile.exists() ) {
                // Filter Image
                var imageInfo = ScriptUtils.getImageInfo(imageFile);
                if ( imageInfo == null || imageInfo.getWidth() <1 || imageInfo.getHeight() < 1 ) {
                    _print("imagegal: " +  imageFile.getPath() + " not a valid image!");                    
                }
                else {
                    linkedItems.push(createItem ("imagegal", uuid, uuid, path, i)) ;
                }
            }
            else {
                _print("imagegal: "  + imageFile + " does not exist!");                    
            }
        }
        else {
            _print("imagegal: aucune image présente");                    
        }
    }
    
    if ( linkedItems.length == 0 ) {
        _print("gallery: aucune image dans la galerie");                    
    }
}

// Buid XML & write gallery
function writeGallery(galleryNode, linkedItems) {
    //_print("writeGallery: " + item.loid);                    
    var loid = galleryNode.getAttributeValue("loid") ;
    
    var charsCountElt = createElement("charsCount", getValue(galleryNode, "doc/dbMetadata/sys/props/charsCount")) ;
    var wordCountElt = createElement("wordCount", getValue(galleryNode, "doc/dbMetadata/sys/props/wordCount"))

    var galleryElement = new Element("gallery");
    var metaElement = new Element("metadata");
    galleryElement.appendChild(metaElement) ;

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE")) ;
    metaElement.appendChild(createElement("issueDate", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication"))) ;
    metaElement.appendChild(createElement("permission", 0)) ;

    metaElement.appendChild(createElement("extRef", loid)) ;
    metaElement.appendChild(charsCountElt) ;
    metaElement.appendChild(wordCountElt) ;
    metaElement.appendChild(createElement("city", getValue(galleryNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/City_Name"))) ;
    metaElement.appendChild(createElement("country", getValue(galleryNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Country"))) ;
    metaElement.appendChild(createElement("address", getValue(galleryNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Address"))) ;

    var catElement = new Element("categories") ;
    catElement.appendChild(createElement("category", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + "")) ;
    metaElement.appendChild(catElement) ;

    var keyElement = new Element("keywords") ;
    keyElement.appendChild(createElement("keyword", getValue(galleryNode, "doc/dbMetadata/Metadata/General/DocKeyword") + "")) ;
    metaElement.appendChild(keyElement) ;

    var authorsElement = new Element("authors");
    var txt = trim(getValue(galleryNode, "doc/dbMetadata/Metadata/General/Custom_by-line")) ;
    txt = txt.replace(/propos recueillis par/i, "") ;
    txt = WordUtils.capitalize(txt) + "" ;
    txt = txt.replace("/ et /i", " et ") ;
    txt = txt.replace("/ avec /i", " avec ") ;
    var authors = txt.split(" et ") ;
    for(var j in authors){
        authorsElement.appendChild(createElement("author", authors[j]));
    }
    metaElement.appendChild(authorsElement);

    // Publication channel
    var webElement = new Element("webChannel") ;
    metaElement.appendChild(webElement) ;
    
    webElement.appendChild(createElement("status", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Web/Status") + "")) ;
    webElement.appendChild(createElement("comment", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Web/Comment") + "")) ;
    webElement.appendChild(createElement("profile", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Web/Profile") + "")) ;
    webElement.appendChild(createElement("priority", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Digital/Priority") + "")) ;
    var topicsList = getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Web/TopicsList") + "";
    var topics = topicsList.split('\*');
    var topicsElement = new Element("topics") ;
    for (l=0; l< topics.length-1; l++) {
        topicsElement.appendChild(createElement("topic", topics[l] + ""));
    }
    webElement.appendChild(topicsElement) ;

    // Links
    var objectLinks = new Element("objectLinks") ;
    metaElement.appendChild(objectLinks) ;
    
    var objectLink = new Element("objectLink") ;

    for(var k in linkedItems) {
        var item = linkedItems[k] ;
        if ( item.isValid ) {
            if ( item.linkType == "imagegal" ) {
                objectLink = new Element("objectLink") ;
                objectLink.addAttribute(new Attribute("linkType", "image")) ;
                objectLink.addAttribute(new Attribute("extRef", item.loid)) ;
                objectLinks.appendChild(objectLink) ;
                // We take only Images in the gallery
                writeImageGal(item, galleryNode) ;
            }
        }
    }
    
    var contentElement = new Element("content");
    galleryElement.appendChild(contentElement) ;
    contentElement.appendChild(createHeadingTag(galleryNode));
    contentElement.appendChild(createTitleTag(galleryNode));
    contentElement.appendChild(createSubTitleTag(galleryNode));
    contentElement.appendChild(createLeadTag(galleryNode));
    contentElement.appendChild(createTexteTag(galleryNode));

    // Reprocess CharCount & WordCount
    var cntValue = contentElement.getValue()+ "" ;
    charsCountElt.getChild(0).setValue(cntValue.length) ;
    wordCountElt.getChild(0).setValue( cntValue.length == 0 ? 0 : cntValue.split(' ').length) ;

    // Write Gallery
    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/gallery/" + loid + ".xml" ;
    var dstFile = new File(dstPath) ;
    writeElement(galleryElement, dstFile)

    return galleryElement ;
}

// Write Image (from gallery)
function writeImageGal(imageItem, galleryNode) {
    _print("writeImageGal: " + imageItem.path);                    
    
    var imageFile = new File(ZIP_DIR, imageItem.path) ;

    var imageElement = new Element("image");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement) ;

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE")) ;
    metaElement.appendChild(createElement("issueDate", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication"))) ;
    metaElement.appendChild(createElement("permission", 0)) ;
    
    metaElement.appendChild(createElement("extRef", imageItem.loid)) ;

    var catElement = new Element("categories") ;
    catElement.appendChild(createElement("category", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + "")) ;
    metaElement.appendChild(catElement) ;

    var imageInfo = ScriptUtils.getImageInfo(imageFile);
    metaElement.appendChild(createElement("width", imageInfo.getWidth())) ;
    metaElement.appendChild(createElement("height", imageInfo.getHeight())) ;        

    var iptcData = getIptcData(imageFile)

    if ( iptcData != null ) {
        var iptc = new Element("iptc") ;
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

    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + imageItem.loid  ;
    var jpgDstFile = new File(dstPath + ".jpg") ;
    var previewFile = new File(dstPath + "_preview.jpg") ;
    var thumbFile = new File(dstPath + "_thumb.jpg") ;

    var contentElement = new Element("content");
    imageElement.appendChild(contentElement) ;
    contentElement.appendChild(createElement("uri", jpgDstFile.getName())) ;
    contentElement.appendChild(createElement("uri", previewFile.getName())) ;
    contentElement.appendChild(createElement("uri", thumbFile.getName())) ;
    convertImage(imageFile, jpgDstFile, previewFile, thumbFile) ;
        
    // Links
    var objectLinks = new Element("objectLinks") ;
    metaElement.appendChild(objectLinks) ;

    var objectLink = new Element("objectLink") ;
    objectLink.addAttribute(new Attribute("linkType", "gallery")) ;
    objectLink.addAttribute(new Attribute("extRef", galleryNode.getAttributeValue("loid"))) ;
    objectLinks.appendChild(objectLink) ;
    
    var photoNodes = galleryNode.query("doc/article/galerie/photo-groupe") ;
    for(var i=0; i<photoNodes.size(); i++) {
        var photoNode = photoNodes.get(i) ;
        var fgPhotoNodes = photoNode.query("fg-photo") ;
        if ( fgPhotoNodes.size() > 0 ) {
            var path = fgPhotoNodes.get(0).getAttributeValue("fileref");
            var uuid = path.substring(path.lastIndexOf("=") + 1) ;    
            if ( uuid == imageItem.uuid ) {
                contentElement.appendChild(createElement("caption", trim(getValue(photoNode, "photo-legende"))));
                contentElement.appendChild(createElement("credit", trim(getValue(photoNode, "photo-credit"))));
                break ;
            }
        }
    }                
    
    // Write Image Element
    var dstFile = new File(dstPath + ".xml") ;
    writeElement(imageElement, dstFile)    
}

// Process image
function processImage(imageItem) {
    _print("processImage: " +  imageItem.path);

    var imageFile = new File(ZIP_DIR, imageItem.path) ;
    if ( imageFile.exists() ) {
    // Nothing to do
    }
    else {
        _print("Image: " + imageItem.loid + " -  " +  imageFile.getPath() + " does not exist!");                    
        imageItem.isValid = false ;
    }
}

// Build XML & write Image
function writeImage(imageItem, storyNode) {
    _print("writeImage: " + imageItem.path);
    
    var imageFile = new File(ZIP_DIR, imageItem.path) ;

    var imageElement = new Element("image");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement) ;

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE")) ;
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication"))) ;
    metaElement.appendChild(createElement("permission", 0)) ;

    metaElement.appendChild(createElement("extRef", imageItem.loid)) ;
   
    var catElement = new Element("categories") ;
    catElement.appendChild(createElement("category", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + "")) ;
    metaElement.appendChild(catElement) ;
   
    var imageInfo = ScriptUtils.getImageInfo(imageFile);
    metaElement.appendChild(createElement("width", imageInfo.getWidth())) ;
    metaElement.appendChild(createElement("height", imageInfo.getHeight())) ;        

    var correlationsNodes = storyNode.query("correlations/correlation") ;
    
    for(var i=0; i<correlationsNodes.size(); i++) {
        var correlationsNode = correlationsNodes.get(i) ;
        var correlationLoid = correlationsNode.getAttributeValue("loid");
        if ( correlationLoid.equals(imageItem.loid) ) {
            var creditPhoto = getValue(correlationsNode, "dbMetadata/Metadata/General/CreditPhoto") ;
            metaElement.appendChild(createElement("creditWeb", creditPhoto + ""));
            var legend = getValue(correlationsNode, "dbMetadata/Metadata/Web/Legend") ;
            metaElement.appendChild(createElement("legendWeb", legend + ""));
        }
    }
            
    var iptcData = getIptcData(imageFile)

    if ( iptcData != null ) {
        var iptc = new Element("iptc") ;
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

    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + imageItem.loid  ;
    var jpgDstFile = new File(dstPath + ".jpg") ;
    var previewFile = new File(dstPath + "_preview.jpg") ;
    var thumbFile = new File(dstPath + "_thumb.jpg") ;
    
    var contentElement = new Element("content");
    imageElement.appendChild(contentElement) ;
    contentElement.appendChild(createElement("uri", jpgDstFile.getName())) ;
    contentElement.appendChild(createElement("uri", previewFile.getName())) ;
    contentElement.appendChild(createElement("uri", thumbFile.getName())) ;
    convertImage(imageFile, jpgDstFile, previewFile, thumbFile) ;
            
    // Links
    var objectLinks = new Element("objectLinks") ;
    metaElement.appendChild(objectLinks) ;

    contentElement.appendChild(createElement("caption", trim(getValue(storyNode, "doc/article/photo-groupe/photo-legende[" + imageItem.index + "]"))));                
    // contentElement.appendChild(createElement("credit", trim(getValue(storyNode, "doc/article/photo-groupe/photo-legende[" + imageItem.index + "]//credit"))));                
    contentElement.appendChild(createElement("credit", ScriptUtils.clean(iptcData.credit)));                

    var objectLink = new Element("objectLink") ;
    objectLink.addAttribute(new Attribute("linkType", "story")) ;
    objectLink.addAttribute(new Attribute("extRef", storyNode.getAttributeValue("loid"))) ;
    objectLinks.appendChild(objectLink) ;

    // Write Image Element
    var dstFile = new File(dstPath + ".xml") ;
    writeElement(imageElement, dstFile)
}

// Process graphic
function processGraphic(graphicItem) {
    _print("processGraphic: " + item.path);
    
    var graphicFile = new File(ZIP_DIR, graphicItem.path) ;
    if ( graphicFile.exists() ) {
    // Nothing to do
    }
    else {
        _print("Graphic: " + graphicItem.loid + " - " +  graphicFile.getPath() + " does not exist!");                    
        graphicItem.isValid = false ;
    }
}

// Write graphic
// TODO: complete attributes
function writeGraphic(graphicItem, storyNode) {
    _print("writeGraphic: " + graphicItem.path);
    
    var graphicFile = new File(ZIP_DIR, graphicItem.path) ;
    
    var graphicElement = new Element("graphic");
    var metaElement = new Element("metadata");
    graphicElement.appendChild(metaElement) ;

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE")) ;
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication"))) ;
    metaElement.appendChild(createElement("permission", 0)) ;

    metaElement.appendChild(createElement("extRef", graphicItem.loid)) ;

    var catElement = new Element("categories") ;
    catElement.appendChild(createElement("category", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + "")) ;
    metaElement.appendChild(catElement) ;

    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + graphicItem.loid  ;
    var ext = FilenameUtils.getExtension(graphicItem.path) ;
    var graphicDstFile = new File(dstPath + "." + ext) ;
    var previewFile = new File(dstPath + "_preview.jpg") ;
    var thumbFile = new File(dstPath + "_thumb.jpg") ;

    var contentElement = new Element("content");
    graphicElement.appendChild(contentElement) ;
    contentElement.appendChild(createElement("uri", graphicDstFile.getName())) ;
    contentElement.appendChild(createElement("uri", previewFile.getName())) ;
    contentElement.appendChild(createElement("uri", thumbFile.getName())) ;
        
    if ( ext.toLowerCase == "pdf" )
        convertPdf(graphicFile, graphicDstFile, previewFile, thumbFile, 40) ;
    else 
        convertImage(graphicFile, graphicDstFile, previewFile, thumbFile) ;

    var imageInfo = ScriptUtils.getImageInfo(previewFile);
    if ( imageInfo != null ) {
        metaElement.appendChild(createElement("width", imageInfo.getWidth())) ;
        metaElement.appendChild(createElement("height", imageInfo.getHeight())) ;        
    }

    // Links
    var objectLinks = new Element("objectLinks") ;
    metaElement.appendChild(objectLinks) ;

    contentElement.appendChild(createElement("caption", trim(getValue(storyNode, "doc/article/photo-groupe/photo-legende[" + graphicItem.index + "]"))));                
    contentElement.appendChild(createElement("credit", trim(getValue(storyNode, "doc/article/photo-groupe/photo-legende[" + graphicItem.index + "]//credit"))));                

    var objectLink = new Element("objectLink") ;
    objectLink.addAttribute(new Attribute("linkType", "story")) ;
    objectLink.addAttribute(new Attribute("extRef", storyNode.getAttributeValue("loid"))) ;
    objectLinks.appendChild(objectLink) ;

    // Write Media
    var dstFile = new File(dstPath + ".xml") ;
    writeElement(graphicElement, dstFile)
}

// Process image
function processVideo(videoItem) {
    _print("processVideo: " +  videoItem.path);
// TODO: We could test if the URL exists
}

// Build XML & write Image
function writeVideo(videoItem, storyNode) {
    _print("writeImage: " + videoItem.path);
    
    var imageElement = new Element("video");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement) ;

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE")) ;
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication"))) ;
    metaElement.appendChild(createElement("permission", 0)) ;

    metaElement.appendChild(createElement("extRef", videoItem.path)) ;
   
    var catElement = new Element("categories") ;
    catElement.appendChild(createElement("category", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + "")) ;
    metaElement.appendChild(catElement) ;
   
    var contentElement = new Element("content");
    imageElement.appendChild(contentElement) ;
    contentElement.appendChild(createElement("uri", videoItem.path)) ;
            
    // Links
    var objectLinks = new Element("objectLinks") ;
    metaElement.appendChild(objectLinks) ;

    var objectLink = new Element("objectLink") ;
    objectLink.addAttribute(new Attribute("linkType", "story")) ;
    objectLink.addAttribute(new Attribute("extRef", storyNode.getAttributeValue("loid"))) ;
    objectLinks.appendChild(objectLink) ;

    // Write Image Element
    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + videoItem.loid  ;
    var dstFile = new File(dstPath + ".xml") ;
    writeElement(imageElement, dstFile)
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
            else if ( tag == "tables" ) {
                setNodeName(node, "table") ;
            }
            else if ( tag == "texte" ) {
                setNodeName(node, "text") ;
            }
            else if ( tag == "photo-legende" ) {
                setNodeName(node, "legend") ;
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
                    var t = new Text(WordUtils.capitalize(node.getValue(), SEP_ARRAY));
                    node.getParent().replaceChild(node, t) ;
                }
                else if ( classAttr != null && (classAttr.getValue() + "") == "TMG_Puce_ronde" ) {
                    node.getParent().replaceChild(node, new Text("-")) ;
                }
                else if ( styleAttr != null && 
                    (styleAttr.getValue() + "") == "font-family:'EuropeanPi-Three';" &&
                    node.getValue() == "L " )  {
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
    node.appendChild(new Text(capFirst(trim(value))));
    return node ;
}

function createHeadingTag(itemNode){
    processTags(itemNode.query("doc/article/titraille/surtitre/descendant-or-self::*")) ;
    return addToElement(itemNode.query("doc/article/titraille/heading/*"), new Element("heading"))
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

function createLegPhotoTag(itemNode){
    processTags(itemNode.query("doc/article/photo-groupe/photo-legende/descendant-or-self::*")) ;
    return addToElement(itemNode.query("doc/article/photo-groupe/legend/*"), new Element("legend"))
}

function createTexteTag(itemNode){

    var nodes = itemNode.query("doc/article/texte/descendant-or-self::* | doc/article/tables/descendant-or-self::*") ;
    processTags(nodes) ;
    
    var textNode = new Element("text") ;
    nodes = itemNode.query("doc/article/text/*") ;
    for(var i=0; i<nodes.size(); i++) {
        var node = nodes.get(i) ;
        if ( node.getChildCount() > 0 ) {
            node.detach() ;
            textNode.appendChild(node) ;
        }
    }
    return textNode ;
}

// Resize Image with Ghostscript
function convertPdf(srcFile, dstFile, previewFile, thumbFile, res)  {
    return ;
    
    if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
    if ( previewFile.exists() ) FileUtils.forceDelete(previewFile) ;
    if ( thumbFile.exists() ) FileUtils.forceDelete(thumbFile) ;

    var tmpFile = File.createTempFile("page_", ".jpg") ;
    tmpFile.deleteOnExit() ;

    var exe = GS_PATH + " -q -dNOPROMPT -dBATCH -dNOPAUSE -dUseCIEColor -sDEVICE=jpeg -dJPEGQ=85 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r180 -o " ;
    var pdf = tmpFile.getPath() + " \"" + srcFile.getPath()  + "\"" ;

    // TMP JPEG
    _print("Converting PDF: " + srcFile.getName()) ;
    _execFor(exe + pdf, dstFile.getParent(), 90000) ;

    // PREVIEW
    if ( tmpFile.exists() ) {
        exe = "ext/windows/imagemagick/convert.exe \"" + tmpFile.getPath() + "\" -resize " + PREVIEW_SIZE + "x" + PREVIEW_SIZE + "> " + previewFile.getPath() ;
        _execFor(exe, dstFile.getParent(), 30000) ;
    }

    // THUMB
    if ( previewFile.exists() ) {
        exe = "ext/windows/imagemagick/convert.exe \"" + previewFile.getPath() + "\" -resize " + THUMB_SIZE + "x" + THUMB_SIZE + "> " + thumbFile.getPath() ;
        _execFor(exe, dstFile.getParent(), 30000) ;
    }

    FileUtils.deleteQuietly(tmpFile) ;
    FileUtils.copyFile(srcFile, dstFile) ;
}

// Resize Image with Image Magick
function convertImage(srcFile, dstFile, previewFile, thumbFile)  {
    //return ;

    if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
    if ( previewFile.exists() ) FileUtils.forceDelete(previewFile) ;
    if ( thumbFile.exists() ) FileUtils.forceDelete(thumbFile) ;

    var d = ScriptUtils.getImageDimension(srcFile) ;
    if ( srcFile.getName().toLowerCase().endsWith(".jpg") && (d.width == 0 || d.height == 0) ) d.width = MAX_SIZE + 1 ;

    // Convert image if larger than MAX_SIZE
    if (  d.width > MAX_SIZE || d.height > MAX_SIZE ) {
        //_print("Converting Image: " + srcFile.getName() + " to " + dstFile + " (" + d.width + "x" + d.height + ")");
        var exe = "ext/windows/imagemagick/convert.exe \"" + srcFile.getPath() + "\" -resize " + REL_SIZE + "x" + REL_SIZE + "> " + dstFile.getPath() ;
        _execFor(exe, dstFile.getParent(), 30000) ; // creates also parent directory
    }
    else {
        //_print("Copying Image: " + srcFile.getName() + " to " + dstFile + " (" + d.width + "x" + d.height + ")");
        FileUtils.copyFile(srcFile, dstFile) ;
    }

    // PREVIEW
    if ( dstFile.exists() ) {
        exe = "ext/windows/imagemagick/convert.exe " + dstFile.getPath() + " -resize " + PREVIEW_SIZE + "x" + PREVIEW_SIZE + "> " + previewFile.getPath() ;
        _execFor(exe, dstFile.getParent(), 30000) ;
    }

    // THUMB
    if ( previewFile.exists() ) {
        exe = "ext/windows/imagemagick/convert.exe " + previewFile.getPath() + " -resize " + THUMB_SIZE + "x" + THUMB_SIZE + "> " + thumbFile.getPath() ;
        _execFor(exe, dstFile.getParent(), 30000) ;
    }
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

// Get all values depending on the xpath
function getMultipleValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    var value = nodes.get(0).getValue() ;
    for(var i=1; i<nodes.size() ; i++) {
        value += nodes.get(i).getValue() ;
    }
    return value ;
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
    buildZip();

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

