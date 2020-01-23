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
importPackage(Packages.java.awt);
importPackage(Packages.java.lang);
importPackage(Packages.java.awt.geom);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.imageinfo);
importPackage(Packages.com.drew.imaging.jpeg);
importPackage(Packages.com.drew.metadata.iptc);
importPackage(Packages.com.drew.metadata.exif);
importPackage(Packages.org.apache.commons.io);
//importPackage(Packages.org.apache.commons.lang);
importPackage(Packages.org.apache.commons.mail);
importPackage(Packages.org.apache.commons.lang3);
importPackage(Packages.org.apache.commons.lang3.text);
importPackage(Packages.nu.xom);

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

MAIL_SERVER = "10.196.50.5";     // adresse du serveur smtp
MAIL_TO_USER = _getValue("MAIL_TO_USER");
MAIL_TO_USER2 = _getValue("MAIL_TO_USER2");
MAIL_FROM_USER = "eidosmedia@leparisien.presse.fr";

STAGING_DIR = _getValue("STAGING_DIR");
OUTPUT_DIR = _getValue("OUTPUT_DIR");
ZIPOUT_DIR = _getValue("ZIPOUT_DIR");
ERROR_DIR = _getValue("ERROR_DIR");
ENVOI = _getValue("ENVOI");

GS_EXE = "C:/Program Files/gs/gs9.15/bin/gswin64c.exe";
CONVERT_EXE = "ext/windows/imagemagick/convert.exe";

MAX_SIZE = 1280;  // Pixels
REL_SIZE = 1280;
PREVIEW_SIZE = 545;
THUMB_SIZE = 192;

var SEP_ARRAY = [' ', '-', '.'];
var TRANS_RE = new RegExp(".*translate\\((.*?)\\)", "");
var SCALE_RE = new RegExp(".*scale\\((.*?)\\)", "");
var ROTATE_RE = new RegExp(".*rotate\\((.*?)\\)", "");

var TO_REMOVE = ["\u0001", "\u0002", "\u0003", "\u0004", "\u0005", "\u0006", "\u0007", "\u0008", "\u0009", "\u000A", "\u200A", "\u200B", "&mdash;"]; // par ""
var TO_REPLACE = ["\u00A0", "\u2003", "\u2004", "\u2005", "\u2009", "\u202F", "&#8212;"]; // par " "

var XOM = ScriptUtils.createXomBuilder(false, false);
var ZIP_DIR;
var OUTPUT_NAME;

// Horrible hack
function cleanStoryFile(file) {
    var content = FileUtils.readFileToString(file, "UTF-8");
    for (var i in TO_REMOVE) {
        content = content.replace(TO_REMOVE[i], "");
    }
    for (var j in TO_REPLACE) {
        content = content.replace(TO_REPLACE[j], " ");
    }
    FileUtils.writeStringToFile(file, content, "UTF-8");
    return file;
}

// Create and send the email message
function sendEmail(itemNode) {
    try {
        _print("Sending email");

        var sujet = "Contribution WEB";
        var value = trim(getValue(itemNode, "metadata/authors/author"));
        if (value != null && value.length > 0)
            sujet += " - " + value;
        value = trim(getValue(itemNode, "metadata/categories/category"));
        var section = value;
        if (value != null && value.length > 0)
            sujet += " - " + value;
        value = trim(getValue(itemNode, "content/title"));
        if (value != null && value.length > 0)
            sujet += " - " + value;

        var corps = "<html><body>";
        // var value = trim(getValue(itemNode, "content/title")) ;
        if (value != null && value.length > 0)
            corps += "<h2>" + value + "</h2>";
        value = trim(getValue(itemNode, "content/text"));
        if (value != null && value.length > 0)
            corps += value;
        value = trim(getValue(itemNode, "story/content/legend"));
        if (value != null && value.length > 0)
            corps += "<h3>" + value + "</h3>";
        corps += "</body></html>";

        var email = new HtmlEmail();
        email.setHostName(MAIL_SERVER);
        email.setFrom(MAIL_FROM_USER);
        email.setCharset("UTF-8");
        
        // If (edition!=94,93,92,75) then only send email 
        if ((section != "Val-de-Marne")
        	&&(section != "Seine-Saint-Denis")
        	&&(section != "Hauts-de-Seine")
        	&&(section != "Paris")
        	&&(section != "Val-d'Oise")
        	&&(section != "Yvelines")
        	&&(section != "Seine-et-Marne")
        	&&(section != "Essonne")
        	&&(section != "Oise")) {
	       var toUser = MAIL_TO_USER.split(";");
            for (var i in toUser) {
	           email.addTo(toUser[i]);
	       }
        }
        var user = "";
        if (section == "Oise"){
            user = "LPA_liste_60_Oise@leparisien.net";
        }
        else if (section == "Paris"){
            user = "LPA_liste_75_Paris@leparisien.net";
        }
        else if (section == "Seine-et-Marne"){
            user = "LPA_liste_77_Seine_et_Marne@leparisien.net";
        }
        else if (section == "Yvelines"){
            user = "LPA_liste_78_Yvelines@leparisien.net";
        }
        else if (section == "Essonne"){
            user = "LPA_liste_91_Essonne@leparisien.net";
        }
        else if (section == "Hauts-de-Seine"){
            user = "LPA_liste_92_Hauts_de_Seine@leparisien.net";
        }
        else if (section == "Seine-Saint-Denis"){
            user = "LPA_liste_93_Seine_Saint_Denis@leparisien.net";
        }
        else if (section == "Val-de-Marne"){
            user = "LPA_liste_94_Val_de_Marne@leparisien.net";
        }
        else if (section == "Val-d'Oise"){
            user = "LPA_liste_95_Val_d_Oise@leparisien.net";
        }
        //_print("send email to user: " + user);

        if ((user != "")&&(ENVOI == "1")){
        	 email.addTo(user);
           var toUser = MAIL_TO_USER2.split(";");
            for (var i in toUser) {
	           email.addTo(toUser[i]);
	       }
        }

        email.setSubject(sujet);
        email.setHtmlMsg(corps);
        email.send();
    }
    catch (e) {
        _print("Cannot send email");
    }
}


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
    var dir = new File(OUTPUT_DIR);
    if (dir.exists()) {
        var zipFile = new File(ZIPOUT_DIR + OUTPUT_NAME + ".zip");
        _print("zipFile: " + zipFile);
        ScriptUtils.zipDirToFile(dir, zipFile);
        _print("Building zipFile done");
        FileUtils.cleanDirectory(dir);
    }
    else {
        _print("Error: the output directory " + dir + " does not exist");
        var dstFile = new File(ERROR_DIR, _srcFile.getName());
        _print("Copy " + _srcFile.getName() + " to " + dstFile.getPath());
        FileUtils.copyFile(_srcFile.getFile(), dstFile);
    }

    if (ZIP_DIR.exists())
        FileUtils.forceDelete(ZIP_DIR);

}

// Process zip and set global variables
function processZip() {
    _print("Processing Zip File");

    var files = new File(ZIP_DIR, "Story").listFiles();
    for (var i in files) {
	   try{
	       var file = cleanStoryFile(files[i]);
	       var doc = XOM.build(file);
	       var itemNode = doc.getRootElement();
	       var loid = itemNode.getAttributeValue("loid");
	       OUTPUT_NAME = loid;
		   
	       var type = itemNode.getAttributeValue("type");
	
	       var linkedItems = new Array();
	       if (checkHas2Send(itemNode)) {
	           if (type == "EOM::Story" || type == "EOM::CompoundStory") {
	               processStory(file, itemNode, linkedItems);
	               var storyElement = writeStory(itemNode, linkedItems);
	               sendEmail(storyElement);
	           }
	           else if (type == "EOM::MediaGallery") {
	               processGallery(file, itemNode, linkedItems);
	               var galleryElement = writeGallery(itemNode, linkedItems);
	               sendEmail(galleryElement);
	           }
	        }
	   }
	   catch (ParsingException) {
	   	  _print("parsing exception : XML is not valid.");
            var dstFile = new File(ERROR_DIR, _srcFile.getName());
        	  _print("Copy " + _srcFile.getName() + " to " + dstFile.getPath());
        	  FileUtils.copyFile(_srcFile.getFile(), dstFile);
        	  return _OK;
	   }
    }
}

// If (edition=94,93,92,75) then true, otherwise, if not send yet true, otherwise false 
function checkHas2Send(node) {
    var section = getValue(node, "doc/dbMetadata/Metadata/PubData/Paper/Section");
    _print("checkHas2Send - section : " + section);
    if ((section != "Val-de-Marne")
        	&&(section != "Seine-Saint-Denis")
        	&&(section != "Hauts-de-Seine")
        	&&(section != "Paris")
        	&&(section != "Val-d'Oise")
        	&&(section != "Yvelines")
        	&&(section != "Seine-et-Marne")
        	&&(section != "Essonne")
        	&&(section != "Oise")) {
        var nodes = node.query("doc/dbMetadata/sys/tl/t");
        for (var i = 0; i < nodes.size(); i++) {
            var val = nodes.get(i).getFirstChildElement("tp");
            if (val != null && val.getValue() == "WebPub") {
                _print("checkHas2Send: already published - not sending");
			   return false;
            }
        }
    }
    _print("checkHas2Send: sending");
    return true;
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
    // serializer.setIndent(3);
    serializer.write(new Document(element));
    os.close();
}

// Create a new Item
function createItem(linkType, loid, uuid, path, index) {
    return {
        linkType: linkType,
        loid: loid,
        uuid: uuid,
        path: path, // not valid for story !
        index: index,
        isValid: true,
        shape: null,
        affine: null,
        items: new Array() // Array of items        
    };
}

// Create an affine transform
function createAffine(affineNodes) {

    var tr = [0, 0];
    var sc = [1, 1];
    var rt = [0];

    if (affineNodes.size() > 0) {
        var str = affineNodes.get(0).getAttributeValue("xtransform") + "";

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

    //_print("xtransform : " + tr[0] + " " + tr[1] + " " + sc[0] + " " + sc[1] + " " + rt[0] + " " )

    return {
        tx: tr[0],
        ty: tr[1],
        sx: sc[0],
        sy: sc[1],
        ro: rt[0]
    };
}

// Create an shape
function createShape(shapeNodes) {
    var t = [0, 0, 0, 0];
    var tmx = shapeNodes.get(0).getAttributeValue("tmx");
    if (tmx != null)
        t = tmx.split(" "); // tmx="2600 1722 640 280"
    //_print("tmx : " + t[0] + " " + t[1] + " " + t[2] + " " + t[3] + " ") ;

    return {
        x1: t[0],
        y1: t[1],
        x2: t[2],
        y2: t[3]
    };
}

function processPhoto(photoNode, linkedItems, imagetype, index) {
    var fgPhotoNodes = photoNode.query("fg-photo");
    if (fgPhotoNodes.size() > 0) {
        // "/LP/Divers/aremond_1280930985644.jpg?uuid=f205cad6-9fd1-11df-a98a-00144f6f4ec8"
        var fileref = fgPhotoNodes.get(0).getAttributeValue("fileref");
        if (fileref != null && fileref.length() > 1) {
            var uuid = fileref.substring(fileref.lastIndexOf("=") + 1);
            var path = "Media/" + uuid + "_original.jpg";
            var loid = uuid + "_" + index;
            var imageItem = createItem(imagetype, loid, uuid, path, -1);
            processImage(imageItem);
            if (imageItem.isValid) {
                imageItem.affine = createAffine(fgPhotoNodes);
                imageItem.shape = createShape(fgPhotoNodes);
                linkedItems.push(imageItem);
            }
        }
    }
}

function processInfog(photoNode, linkedItems, graphictype, index) {
    var fgPhotoNodes = photoNode.query("fg-photo");
    if (fgPhotoNodes.size() > 0) {
        // "/LP/Divers/aremond_1280930985644.jpg?uuid=f205cad6-9fd1-11df-a98a-00144f6f4ec8"
        var fileref = fgPhotoNodes.get(0).getAttributeValue("fileref");
        if (fileref != null && fileref.length() > 1) {
            var uuid = fileref.substring(fileref.lastIndexOf("=") + 1);
            var path = "Media/" + uuid + "_original.pdf";
            var loid = uuid + "_" + index;
            var graphicItem = createItem(graphictype, loid, uuid, path, -1);
            processGraphic(graphicItem);
            if (graphicItem.isValid) {
                graphicItem.affine = createAffine(fgPhotoNodes);
                graphicItem.shape = createShape(fgPhotoNodes);
                linkedItems.push(graphicItem);
            }
        }
    }
}

function processInlinePhoto(photoNode, linkedItems, imagetype, index) {
    var photoNodes = photoNode.query("p/photo");
    if (photoNodes.size() > 0) {
        // "/LP/Divers/aremond_1280930985644.jpg?uuid=f205cad6-9fd1-11df-a98a-00144f6f4ec8"
        var fileref = photoNodes.get(0).getAttributeValue("fileref");
        if (fileref != null && fileref.length() > 1) {
            var uuid = fileref.substring(fileref.lastIndexOf("=") + 1);
            var path = "Media/" + uuid + "_original.jpg";
            var loid = uuid + "_" + index;
            var imageItem = createItem(imagetype, loid, uuid, path, -1);
            processImage(imageItem);
            if (imageItem.isValid) {
                imageItem.affine = createAffine(photoNodes);
                imageItem.shape = createShape(photoNodes);
                linkedItems.push(imageItem);
            }
        }
    }
}

function processInlineGraphic(graphicNode, linkedItems, graphictype, index) {
    var graphicNodes = graphicNode.query("p/infographie");
    if (graphicNodes.size() > 0) {
        // "/LP/Divers/aremond_1280930985644.jpg?uuid=f205cad6-9fd1-11df-a98a-00144f6f4ec8"
        var fileref = graphicNodes.get(0).getAttributeValue("fileref");
        if (fileref != null && fileref.length() > 1) {
            var uuid = fileref.substring(fileref.lastIndexOf("=") + 1);
            var path = "Media/" + uuid + "_original.pdf";
            var loid = uuid + "_" + index;
            var graphicItem = createItem(graphictype, loid, uuid, path, -1);
            processGraphic(graphicItem);
            if (graphicItem.isValid) {
                graphicItem.affine = createAffine(graphicNodes);
                graphicItem.shape = createShape(graphicNodes);
                linkedItems.push(graphicItem);
            }
        }
    }
}

// Process Story
function processStory(storyFile, itemNode, linkedItems) {
    _print("processStory " + storyFile);

    // photo-group 
    var nodes = itemNode.query("doc/article/photo-groupe");
    for (var j = 0; j < nodes.size(); j++) {
    	   var fgPhotoNodes = nodes.get(j).query("fg-photo");
        if (fgPhotoNodes.size() > 0) {
        	  var fileref = fgPhotoNodes.get(0).getAttributeValue("fileref");
        	  if (fileref != null && fileref.length() > 1) {
            	if (fileref.indexOf(".pdf?") > 0) {
            		processInfog(nodes.get(j), linkedItems, "graphicgrp", 1);
            	}
            	else {
        			processPhoto(nodes.get(j), linkedItems, "imagegrp", 1);
            	}
        	  }
        }
    }

    // photo-alt1,2,3,4,5 
    for (var i = 1; i <= 5; i++) {
        var photoNodes = itemNode.query("doc/article/photo-alt" + i);
        for (var j = 0; j < photoNodes.size(); j++) {
            processPhoto(photoNodes.get(j), linkedItems, "imagealt", i);
        }
    }

    // photo-inline 
    var photoInlineNodes = itemNode.query("doc/article/texte/pbox [@class='photo']");
    for (var j = 0; j < photoInlineNodes.size(); j++) {
        processInlinePhoto(photoInlineNodes.get(j), linkedItems, "imageinl", 1);
    }

    // graphic-inline 
    var graphicInlineNodes = itemNode.query("doc/article/texte/pbox [@class='infographie']");
    for (var j = 0; j < graphicInlineNodes.size(); j++) {
        processInlineGraphic(graphicInlineNodes.get(j), linkedItems, "graphic", 1);
    }


    // Correlation et media Gallery
    var captionIndex = 1;
    var correlationNodes = itemNode.query("correlations/correlation");
    for (var i = 0; i < correlationNodes.size(); i++) {
        var correlationNode = correlationNodes.get(i);
        var type = correlationNode.getAttributeValue("type");
        var loid = correlationNode.getAttributeValue("loid");
        var uuid = correlationNode.getAttributeValue("uuid");
        if ((type == "Image") || (type == "WireImage")) {
            var path = "Media/" + uuid + "_original.jpg";
            var imageItem = createItem("image", loid, uuid, path, captionIndex++);
            processImage(imageItem);
            if (imageItem.isValid)
                linkedItems.push(imageItem);
        }
        else if (type == "Graphic") {
            var path = "Media/" + uuid + "_original.pdf";
            var graphicItem = createItem("graphic", loid, uuid, path, captionIndex++);
            processGraphic(graphicItem);
            if (graphicItem.isValid)
                linkedItems.push(graphicItem);
        }
        else if (type == "Video") {
            var url = correlationNode.getAttributeValue("url");
            if (loid == "external object")
                loid = UUID.randomUUID();
            var videoItem = createItem("video", loid, uuid, url, 0);
            processVideo(videoItem);
            if (videoItem.isValid)
                linkedItems.push(videoItem);
        }
    }
}

// Build XML & write story
function writeStory(storyNode, linkedItems) {
    _print("writeStory : titre = " + getValue(storyNode, "doc/article/titraille/titre"));

    var charsCountElt = createElement("charsCount", getValue(storyNode, "doc/dbMetadata/sys/props/charsCount"));
    var wordCountElt = createElement("wordCount", getValue(storyNode, "doc/dbMetadata/sys/props/wordCount"));
    var loid = storyNode.getAttributeValue("loid");
    var uuid = storyNode.getAttributeValue("uuid");

    // Create XML
    var storyElement = new Element("story");
    var metaElement = new Element("metadata");
    storyElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication")));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("extRef", uuid));
    metaElement.appendChild(charsCountElt);
    metaElement.appendChild(wordCountElt);
    var city = getValue(storyNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/City_Name");
    if ((city != null)&&(city!="")){
	    if (city.indexOf("/")>0){
	        var tmp = city.split("/");
	        metaElement.appendChild(createElement("city", tmp[0].trim()));
	        metaElement.appendChild(createElement("zipcode", tmp[1]));
	    } else {
	        var tmp = city.split('\\(');
	        metaElement.appendChild(createElement("city", tmp[0].trim()));
	        metaElement.appendChild(createElement("zipcode", (tmp[1]) ? tmp[1].replace(')','') : ""));
	    }
    } else {
        metaElement.appendChild(createElement("city", ""));
        metaElement.appendChild(createElement("zipcode", ""));
    }
    metaElement.appendChild(createElement("province", getValue(storyNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Province_Name")));
    metaElement.appendChild(createElement("country", getValue(storyNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Country")));
    var address = getValue(storyNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Address");
    metaElement.appendChild(createElement("address", address.replace('_', ' ').replace('_', ' ')));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + ""));
    metaElement.appendChild(catElement);

    var keyElement = new Element("keywords");
    keyElement.appendChild(createElement("keyword", getValue(storyNode, "doc/dbMetadata/Metadata/General/DocKeyword") + ""));
    metaElement.appendChild(keyElement);

    var authorsElement = new Element("authors");
    var txt = trim(getValue(storyNode, "doc/dbMetadata/Metadata/General/Custom_by-line")) + "";
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

    webElement.appendChild(createElement("paying", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Web/Paying") + ""));
    webElement.appendChild(createElement("theme", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Web/Theme") + ""));
    webElement.appendChild(createElement("status", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Web/Status") + ""));
    webElement.appendChild(createElement("comment", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Web/Comment") + ""));
    webElement.appendChild(createElement("profile", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Web/Profile") + ""));
    webElement.appendChild(createElement("priority", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Digital/Priority") + ""));
    if ((city == null)||(city == "")){
    	   webElement.appendChild(createElement("primeRubric", ""));
    }
    var topicsList = getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Web/TopicsList") + "";
    var topics = topicsList.split('\*');
    var topicsElement = new Element("topics");
    for (var l = 0; l < topics.length - 1; l++) {
        topicsElement.appendChild(createElement("topic", topics[l] + ""));
        if ((city != null)&&(city != "")&&(topics[l].indexOf(city)>0)){
        	webElement.appendChild(createElement("primeRubric", topics[l]));
        }
    }
    webElement.appendChild(topicsElement);
    var complementsElement = new Element("complements");
    var titleComplements = storyNode.query("//pbox [@class='complement']/p [@class='titre']");
    var urlComplements = storyNode.query("//pbox [@class='complement']/p [@class='url']");
    for (var m=0; m<titleComplements.size(); m++){
    	   if ((titleComplements.get(m))&&(titleComplements.get(m).getValue()!= "")){
		   var complementElement= new Element("complement");
    	        complementElement.addAttribute(new Attribute("title", titleComplements.get(m).getValue()));
    	        //_print(titleComplements.get(m).getValue());
    	        var terms = urlComplements.get(m).getValue().split("#");
		   complementElement.addAttribute(new Attribute("url", terms[0]));
		   complementElement.addAttribute(new Attribute("imgUrl", terms[1]));
		   complementsElement.appendChild(complementElement);
    	   }
    }
    webElement.appendChild(complementsElement);
    
    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    for (var k in linkedItems) {
        var item = linkedItems[k];
        if (item.isValid) {
            var ltype = (item.linkType == "imagealt" || item.linkType == "imagegrp"||item.linkType == "imageinl" || item.linkType == "graphic" || item.linkType == "graphicgrp") ? "image" : item.linkType;
            var objectLink = new Element("objectLink");
            if ((item.linkType == "imagegrp")||(item.linkType == "graphicgrp")) 
            	objectLink.addAttribute(new Attribute("head", "true"));
            objectLink.addAttribute(new Attribute("linkType", ltype));
            objectLink.addAttribute(new Attribute("extRef", item.loid));
            objectLinks.appendChild(objectLink);
            if (item.linkType == "image")
                writeImage(item, storyNode);
            else if ((item.linkType == "imagealt")||(item.linkType == "imageinl"))
                writeImageAlt(item, storyNode);
            else if (item.linkType == "imagegrp")
                writeImageGrp(item, storyNode);
            else if ((item.linkType == "graphic")||(item.linkType == "graphicgrp"))
                writeGraphic(item, storyNode, item.linkType);
            else if (item.linkType == "video")
                writeVideo(item, storyNode);
        }
    }

    var contentElement = new Element("content");
    storyElement.appendChild(contentElement);
    contentElement.appendChild(createHeadingTag(storyNode));
    contentElement.appendChild(createTitleTag(storyNode));
    contentElement.appendChild(createSubTitleTag(storyNode));
    contentElement.appendChild(createLeadTag(storyNode));
    contentElement.appendChild(createTexteTag(storyNode));
    contentElement.appendChild(createPreLegPhotoTag(storyNode));
    contentElement.appendChild(createCreditPhotoTag(storyNode));
    contentElement.appendChild(createLegPhotoTag(storyNode));
    
    // Reprocess CharCount & WordCount
    var cntValue = contentElement.getValue() + "";
    charsCountElt.getChild(0).setValue(cntValue.length);
    wordCountElt.getChild(0).setValue(cntValue.length == 0 ? 0 : cntValue.split(' ').length);

    // Write Story
    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/story/" + loid + ".xml";
    var dstFile = new File(dstPath);
    writeElement(storyElement, dstFile);

    return storyElement;
}

// Process correlated & imageAlt & imageGrp image 
function processImage(imageItem) {
    _print("processImage: " + imageItem.path);

    var imageFile = new File(ZIP_DIR, imageItem.path);
    if (imageFile.exists()) {
        var imageInfo = ScriptUtils.getImageInfo(imageFile);
        if (imageInfo == null || imageInfo.getWidth() < 1 || imageInfo.getHeight() < 1) {
            _print("processImage: " + imageFile.getPath() + " not a valid image!");
            imageItem.isValid = false;
        }
    }
    else {
        _print("processImage: " + imageItem.loid + " -  " + imageFile.getPath() + " does not exist!");
        imageItem.isValid = false;
    }
}

// Build XML & write correlated image (from story)
function writeImage(imageItem, storyNode) {
    _print("writeImage: " + imageItem.path);

    var imageFile = new File(ZIP_DIR, imageItem.path);

    var imageElement = new Element("image");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication")));
    metaElement.appendChild(createElement("permission", 0));
    metaElement.appendChild(createElement("extRef", imageItem.loid));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + ""));
    metaElement.appendChild(catElement);

    var correlationsNodes = storyNode.query("correlations/correlation");

    for (var i = 0; i < correlationsNodes.size(); i++) {
        var correlationsNode = correlationsNodes.get(i);
        var correlationLoid = correlationsNode.getAttributeValue("loid");
        if (correlationLoid.equals(imageItem.loid)) {
            var creditPhoto = getValue(correlationsNode, "dbMetadata/Metadata/General/CreditPhoto");
            metaElement.appendChild(createElement("creditWeb", creditPhoto + ""));
            var legend = getValue(correlationsNode, "dbMetadata/Metadata/Web/Legend");
            metaElement.appendChild(createElement("legendWeb", legend + ""));
        }
    }

    var iptcData = getIptcData(imageFile);
    metaElement.appendChild(addIptcElement(iptcData));

    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + imageItem.loid;
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

    contentElement.appendChild(createElement("caption", trim(getValue(storyNode, "doc/article/photo-groupe/photo-legende[" + imageItem.index + "]"))));
    // contentElement.appendChild(createElement("credit", trim(getValue(storyNode, "doc/article/photo-groupe/photo-legende[" + imageItem.index + "]//credit"))));                
    contentElement.appendChild(createElement("credit", ScriptUtils.clean(iptcData.credit)));

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", "story"));
    objectLink.addAttribute(new Attribute("extRef", storyNode.getAttributeValue("loid")));
    objectLinks.appendChild(objectLink);

    // Write Image Element
    var dstFile = new File(dstPath + ".xml");
    writeElement(imageElement, dstFile);
}

// Build XML & Write Grouped Image (from story)
function writeImageGrp(imageItem, storyNode) {
    _print("writeImageGrp: " + imageItem.path);

    var imageFile = new File(ZIP_DIR, imageItem.path);

    var imageElement = new Element("image");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication")));
    metaElement.appendChild(createElement("permission", 0));
    metaElement.appendChild(createElement("extRef", imageItem.loid));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + ""));
    metaElement.appendChild(catElement);

    var iptcData = getIptcData(imageFile);
    metaElement.appendChild(addIptcElement(iptcData));

    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + imageItem.loid;
    var jpgDstFile = new File(dstPath + ".jpg");
    var previewFile = new File(dstPath + "_preview.jpg");
    var thumbFile = new File(dstPath + "_thumb.jpg");

    var contentElement = new Element("content");
    imageElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", jpgDstFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));

    convertImage3(imageFile, jpgDstFile, previewFile, thumbFile, imageItem.shape, imageItem.affine);

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", "image"));
    objectLink.addAttribute(new Attribute("extRef", storyNode.getAttributeValue("loid")));
    objectLinks.appendChild(objectLink);

    var photoNodes = storyNode.query("doc/article/photo-groupe");
    for (var i = 0; i < photoNodes.size(); i++) {
        var photoNode = photoNodes.get(i);
        var fgPhotoNodes = photoNode.query("fg-photo");
        if (fgPhotoNodes.size() > 0) {
            var fileref = fgPhotoNodes.get(0).getAttributeValue("fileref");
            if (fileref != null) {
                var index = fileref.lastIndexOf("=") + 1;
                var uuid = fileref.substring(index);
                if (uuid == imageItem.uuid) {
                    contentElement.appendChild(createElement("caption", trim(getValue(photoNode, "photo-legende"))));
                    contentElement.appendChild(createElement("credit", trim(getValue(photoNode, "photo-credit"))));
                    break;
                }
            }
            else {
                _print("PhotoNode.path == null!");
            }
        }
    }

    // Write Image Element
    var dstFile = new File(dstPath + ".xml");
    writeElement(imageElement, dstFile);
}

// Build XML & Write Alt Image (from story)
function writeImageAlt(imageItem, storyNode) {
    _print("writeImageAlt: " + imageItem.path);

    var imageFile = new File(ZIP_DIR, imageItem.path);

    var imageElement = new Element("image");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication")));
    metaElement.appendChild(createElement("permission", 0));
    metaElement.appendChild(createElement("extRef", imageItem.loid));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + ""));
    metaElement.appendChild(catElement);

    var iptcData = getIptcData(imageFile);
    metaElement.appendChild(addIptcElement(iptcData));

    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + imageItem.loid;
    var jpgDstFile = new File(dstPath + ".jpg");
    var previewFile = new File(dstPath + "_preview.jpg");
    var thumbFile = new File(dstPath + "_thumb.jpg");

    var contentElement = new Element("content");
    imageElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", jpgDstFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));

    convertImage2(imageFile, jpgDstFile, previewFile, thumbFile, imageItem.shape, imageItem.affine);

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", "story"));
    objectLink.addAttribute(new Attribute("extRef", storyNode.getAttributeValue("loid")));
    objectLinks.appendChild(objectLink);

    // Write Image Element
    var dstFile = new File(dstPath + ".xml");
    writeElement(imageElement, dstFile);
}

// Process graphic
function processGraphic(graphicItem) {
    _print("processGraphic: " + graphicItem.path);

    var graphicFile = new File(ZIP_DIR, graphicItem.path);
    if (graphicFile.exists()) {
        graphicItem.isValid = true;
    }
    else {
        _print("Graphic: " + graphicItem.loid + " - " + graphicFile.getPath() + " does not exist!");
        graphicItem.isValid = false;
    }
}

// Write graphic
// TODO: complete attributes
function writeGraphic(graphicItem, storyNode, graphicType) {
    _print("writeGraphic: " + graphicItem.path);

    var graphicFile = new File(ZIP_DIR, graphicItem.path);

    var graphicElement = new Element("graphic");
    var metaElement = new Element("metadata");
    graphicElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication")));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("extRef", graphicItem.loid));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + ""));
    metaElement.appendChild(catElement);

    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + graphicItem.loid;
    var ext = FilenameUtils.getExtension(graphicItem.path);
    var graphicDstFile = new File(dstPath + "." + ext);
    var previewFile = new File(dstPath + "_preview.jpg");
    var thumbFile = new File(dstPath + "_thumb.jpg");

    var contentElement = new Element("content");
    graphicElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));
    contentElement.appendChild(createElement("uri", graphicDstFile.getName()));
    
    var graphicNodes = (graphicType == "graphic") ? storyNode.query("//infographie") : storyNode.query("//fg-photo");
    
    if (ext.toLowerCase == "pdf") {
        contentElement.appendChild(createElement("uri", new File(dstPath + ".jpg").getName()));
    	   convertPdf(graphicFile, graphicDstFile, previewFile, thumbFile, createShape(graphicNodes), createAffine(graphicNodes), 40);
    }
    else {
        convertImage2(graphicFile, graphicDstFile, previewFile, thumbFile, createShape(graphicNodes), createAffine(graphicNodes));
	}

    var imageInfo = ScriptUtils.getImageInfo(previewFile);
    if (imageInfo != null) {
        metaElement.appendChild(createElement("width", imageInfo.getWidth()));
        metaElement.appendChild(createElement("height", imageInfo.getHeight()));
    }

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    contentElement.appendChild(createElement("caption", trim(getValue(storyNode, "doc/article/photo-groupe/photo-legende[" + graphicItem.index + "]"))));
    contentElement.appendChild(createElement("credit", trim(getValue(storyNode, "doc/article/photo-groupe/photo-legende[" + graphicItem.index + "]//credit"))));

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", "story"));
    objectLink.addAttribute(new Attribute("extRef", storyNode.getAttributeValue("loid")));
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
function writeVideo(videoItem, storyNode) {
    _print("writeVideo: " + videoItem.path);

    var imageElement = new Element("video");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication")));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("extRef", videoItem.path));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(storyNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + ""));
    metaElement.appendChild(catElement);

    var contentElement = new Element("content");
    imageElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", videoItem.path));

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", "story"));
    objectLink.addAttribute(new Attribute("extRef", storyNode.getAttributeValue("loid")));
    objectLinks.appendChild(objectLink);

    // Write Image Element
    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + videoItem.loid;
    var dstFile = new File(dstPath + ".xml");
    writeElement(imageElement, dstFile);
}

// Process Gallery
function processGallery(galleryFile, itemNode, linkedItems) {
    _print("processGallery " + galleryFile);

    var photoNodes = itemNode.query("doc/article/galerie/photo-groupe");

    for (var i = 0; i < photoNodes.size(); i++) {
        var photoNode = photoNodes.get(i);
        var fgPhotoNodes = photoNode.query("fg-photo");
        if (fgPhotoNodes.size() > 0) {
            // "/LP/Divers/aremond_1280930985644.jpg?uuid=f205cad6-9fd1-11df-a98a-00144f6f4ec8"
            var fileref = fgPhotoNodes.get(0).getAttributeValue("fileref");
            if (fileref != null && fileref.length() > 1) {
                var uuid = fileref.substring(fileref.lastIndexOf("=") + 1);
                var path = "Media/" + uuid + "_original.jpg";
                var loid = uuid + "_" + i;
                var imageGalItem = createItem("imagegal", loid, uuid, path, i);
                processImageGal(imageGalItem);
                if (imageGalItem.isValid) {
                    imageGalItem.affine = createAffine(fgPhotoNodes);
                    imageGalItem.shape = createShape(fgPhotoNodes);
                    linkedItems.push(imageGalItem);
                }
            }
        }
    }

    if (linkedItems.length == 0) {
        _print("gallery: aucune image dans la galerie");
    }
}

// Buid XML & write gallery
function writeGallery(galleryNode, linkedItems) {
    _print("writeGallery : titre = " + getValue(galleryNode, "doc/article/titraille/titre"));
    var loid = galleryNode.getAttributeValue("loid");
    var uuid = galleryNode.getAttributeValue("uuid");

    var charsCountElt = createElement("charsCount", getValue(galleryNode, "doc/dbMetadata/sys/props/charsCount"));
    var wordCountElt = createElement("wordCount", getValue(galleryNode, "doc/dbMetadata/sys/props/wordCount"));

    var galleryElement = new Element("gallery");
    var metaElement = new Element("metadata");
    galleryElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication")));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("extRef", uuid));
    metaElement.appendChild(charsCountElt);
    metaElement.appendChild(wordCountElt);
    var city = getValue(galleryNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/City_Name");
    if (city != null){
	    if (city.indexOf("/")>0){
	        var tmp = city.split("/");
	        metaElement.appendChild(createElement("city", tmp[0].trim()));
	        metaElement.appendChild(createElement("zipcode", tmp[1]));
	    } else {
	        var tmp = city.split('\\(');
	        metaElement.appendChild(createElement("city", tmp[0].trim()));
	        metaElement.appendChild(createElement("zipcode", tmp[1] ? tmp[1].replace(')','') : ""));
	    }
    } else {
        metaElement.appendChild(createElement("city", ""));
        metaElement.appendChild(createElement("zipcode", ""));
    }
    metaElement.appendChild(createElement("country", getValue(galleryNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Country")));
    metaElement.appendChild(createElement("address", getValue(galleryNode, "doc/dbMetadata/Metadata/General/GeographicalPlaces/Address")));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + ""));
    metaElement.appendChild(catElement);

    var keyElement = new Element("keywords");
    keyElement.appendChild(createElement("keyword", getValue(galleryNode, "doc/dbMetadata/Metadata/General/DocKeyword") + ""));
    metaElement.appendChild(keyElement);

    var authorsElement = new Element("authors");
    var txt = trim(getValue(galleryNode, "doc/dbMetadata/Metadata/General/Custom_by-line"));
    txt = txt.replace(/propos recueillis par/i, "");
    txt = WordUtils.capitalize(txt) + "";
    txt = txt.replace("/ et /i", " et ");
    txt = txt.replace("/ avec /i", " avec ");
    var authors = txt.split(" et ");
    for (var j in authors) {
        authorsElement.appendChild(createElement("author", authors[j]));
    }
    metaElement.appendChild(authorsElement);

    // Publication channel
    var webElement = new Element("webChannel");
    metaElement.appendChild(webElement);

    webElement.appendChild(createElement("status", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Web/Status") + ""));
    webElement.appendChild(createElement("comment", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Web/Comment") + ""));
    webElement.appendChild(createElement("profile", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Web/Profile") + ""));
    webElement.appendChild(createElement("priority", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Digital/Priority") + ""));
    if ((city == null)||(city == "")){
    	   webElement.appendChild(createElement("primeRubric", ""));
    }
    var topicsList = getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Web/TopicsList") + "";
    var topics = topicsList.split('\*');
    var topicsElement = new Element("topics");
    for (l = 0; l < topics.length - 1; l++) {
        topicsElement.appendChild(createElement("topic", topics[l] + ""));
        if ((city != null)&&(city != "")&&(topics[l].indexOf(city)>0)){
        	webElement.appendChild(createElement("primeRubric", topics[l]));
        }
    }
    webElement.appendChild(topicsElement);
    var complementsElement = new Element("complements");
    var titleComplements = galleryNode.query("//pbox [@class='complement']/p [@class='titre']");
    var urlComplements = galleryNode.query("//pbox [@class='complement']/p [@class='url']");
    for (var m=0; m<titleComplements.length; m++){
    	   if ((titleComplements[m])&&(titleComplements[m]!= "")){
		   var complementElement= new Element("complement");
    	        complementElement.addAttribute("title", titleComplements[m]);
    	        var url = urlComplements[m].replace("https://www.google.com/url?q=","");
		   complementElement.addAttribute("url", url.substring(0,url.indexOf(".php")+4));
		   complementsElement.appendChild(complementElement);
    	   }
    }
    webElement.appendChild(complementsElement);

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var objectLink = new Element("objectLink");

    for (var k in linkedItems) {
        var item = linkedItems[k];
        if (item.isValid) {
            if (item.linkType == "imagegal") {
                objectLink = new Element("objectLink");
                objectLink.addAttribute(new Attribute("linkType", "image"));
                objectLink.addAttribute(new Attribute("extRef", item.loid));
                objectLinks.appendChild(objectLink);
                // We take only Images in the gallery
                writeImageGal(item, galleryNode);
            }
        }
    }

    var contentElement = new Element("content");
    galleryElement.appendChild(contentElement);
    contentElement.appendChild(createHeadingTag(galleryNode));
    contentElement.appendChild(createTitleTag(galleryNode));
    contentElement.appendChild(createSubTitleTag(galleryNode));
    contentElement.appendChild(createLeadTag(galleryNode));
    contentElement.appendChild(createTexteTag(galleryNode));

    // Reprocess CharCount & WordCount
    var cntValue = contentElement.getValue() + "";
    charsCountElt.getChild(0).setValue(cntValue.length);
    wordCountElt.getChild(0).setValue(cntValue.length == 0 ? 0 : cntValue.split(' ').length);

    // Write Gallery
    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/gallery/" + loid + ".xml";
    var dstFile = new File(dstPath);
    writeElement(galleryElement, dstFile);

    return galleryElement;
}

// Process image
function processImageGal(imageGalItem) {
    _print("processImageGal: " + imageGalItem.path);

    var imageFile = new File(ZIP_DIR, imageGalItem.path);
    if (imageFile.exists()) {
        var imageInfo = ScriptUtils.getImageInfo(imageFile);
        if (imageInfo == null || imageInfo.getWidth() < 1 || imageInfo.getHeight() < 1) {
            _print("processImageGal: " + imageFile.getPath() + " not a valid image!");
            imageGalItem.isValid = false;
        }
    }
    else {
        _print("processImageGal: " + imageGalItem.loid + " -  " + imageFile.getPath() + " does not exist!");
        imageGalItem.isValid = false;
    }
}

// Write Image (from gallery)
function writeImageGal(imageItem, galleryNode) {
    _print("writeImageGal: " + imageItem.path);

    var imageFile = new File(ZIP_DIR, imageItem.path);

    var imageElement = new Element("image");
    var metaElement = new Element("metadata");
    imageElement.appendChild(metaElement);

    metaElement.appendChild(createElement("source", "LEPARISIEN/METHODE"));
    metaElement.appendChild(createElement("issueDate", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Paper/date_Publication")));
    metaElement.appendChild(createElement("permission", 0));

    metaElement.appendChild(createElement("extRef", imageItem.loid));

    var catElement = new Element("categories");
    catElement.appendChild(createElement("category", getValue(galleryNode, "doc/dbMetadata/Metadata/PubData/Paper/Section") + ""));
    metaElement.appendChild(catElement);

    //    var imageInfo = ScriptUtils.getImageInfo(imageFile);
    //    metaElement.appendChild(createElement("width", imageInfo.getWidth())) ;
    //    metaElement.appendChild(createElement("height", imageInfo.getHeight())) ;        

    var iptcData = getIptcData(imageFile);
    metaElement.appendChild(addIptcElement(iptcData));

    var dstPath = OUTPUT_DIR + OUTPUT_NAME + "/media/" + imageItem.loid;
    var jpgDstFile = new File(dstPath + ".jpg");
    var previewFile = new File(dstPath + "_preview.jpg");
    var thumbFile = new File(dstPath + "_thumb.jpg");

    var contentElement = new Element("content");
    imageElement.appendChild(contentElement);
    contentElement.appendChild(createElement("uri", jpgDstFile.getName()));
    contentElement.appendChild(createElement("uri", previewFile.getName()));
    contentElement.appendChild(createElement("uri", thumbFile.getName()));

    convertImage3(imageFile, jpgDstFile, previewFile, thumbFile, imageItem.shape, imageItem.affine);

    // Links
    var objectLinks = new Element("objectLinks");
    metaElement.appendChild(objectLinks);

    var objectLink = new Element("objectLink");
    objectLink.addAttribute(new Attribute("linkType", "gallery"));
    objectLink.addAttribute(new Attribute("extRef", galleryNode.getAttributeValue("loid")));
    objectLinks.appendChild(objectLink);

    var photoNodes = galleryNode.query("doc/article/galerie/photo-groupe");
    for (var i = 0; i < photoNodes.size(); i++) {
        var photoNode = photoNodes.get(i);
        var fgPhotoNodes = photoNode.query("fg-photo");
        if (fgPhotoNodes.size() > 0) {
            var fileref = fgPhotoNodes.get(0).getAttributeValue("fileref");
            if (fileref != null) {
                var index = fileref.lastIndexOf("=") + 1;
                var uuid = fileref.substring(index);
                // var uuid = "photo" + $i;
                if (uuid == imageItem.uuid) {
                    contentElement.appendChild(createElement("caption", trim(getValue(photoNode, "photo-legende"))));
                    contentElement.appendChild(createElement("credit", trim(getValue(photoNode, "photo-credit"))));
                    break;
                }
            }
            else {
                _print("PhotoNode.path == null!");
            }
        }
    }

    // Write Image Element
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
            	 detach(node.query("p/b"));
                detach(node.query("p/creditlegend"));
                setNodeName(node, "legend");
            }
            else if (tag == "credit") {
                setNodeName(node, "creditlegend");
            }
            else if (tag == "intertitre") {
                setNodeName(node, "strong");
            }
            else if (tag == "b" || tag == "correspondant" || tag == "graspuce" || tag == "mot-cle") {
                setNodeName(node, "b");
            }
            else if (tag == "note") {
                setNodeName(node, "note");
            }
            else if (tag == "i") {
                setNodeName(node, "i");
            }
            else if (tag == "u") {
                setNodeName(node, "u");
            }
            else if (tag == "sup") {
            	 setNodeName(node, "sup");
            }
            else if (tag == "a") {
                var classAttr = node.getAttribute("class");
                if (classAttr != null)
                    node.removeAttribute(classAttr);
                //setNodeName(node, "u") ;
            }
            else if (tag == "question") {
                setNodeName(node, "strong");
            }
            else if (tag == "signature") {
                var signNode = new Element("signature");
                var txt = WordUtils.capitalizeFully(trim(node.getValue()), SEP_ARRAY) + "";
                txt = txt.replace(/propos recueillis par/i, "");
                txt = txt.replace(/ et /i, " et ");
                txt = txt.replace(/ avec /i, " avec ");
                signNode.appendChild(txt);
                //_print("pbox : " + node.getParent().getParent().getAttributeValue("class"));
                if (node.getParent().getParent()&&(node.getParent().getParent().getAttributeValue("class") == "blocEncadre")) {
                	node.getParent().removeChild(node);
                }
                else node.getParent().replaceChild(node, signNode);
            }
            else if (tag == "pbox") {
                var classAttr = node.getAttribute("class");
                if (classAttr != null) {
                    var className = classAttr.getValue() + "";
                    if (className == "tweet") {
                        detach(node.query("photo"));
                        var pNode = new Element("p");
                	    pNode.appendChild(" ");
                        node.getParent().insertChild(pNode, node.getParent().indexOf(node));
			         var strongNode = new Element("strong");
                	    strongNode.appendChild(getValue(node, "p [@class='intro']") + " ");
                	    detach(node.query("p [@class='intro']"));
                        node.getParent().insertChild(strongNode, node.getParent().indexOf(node));
                        var innerhtml = "";
                        var pnodes = node.query("p");
                        for (var j = 0; j < pnodes.size(); j++) {
                            var html = pnodes.get(j).getValue().replace(' »', '"').replace('»', '"').replace(" ?", "?").replace(" ;", ";").replace(" :", ":").replace(" async", " async=\"async\"");
                            innerhtml += StringEscapeUtils.unescapeHtml4(html).replaceAll("&", "&amp;");
                        }
                        var pdoc = XOM.build(new StringReader("<root><p>" + innerhtml + "</p></root>"));
                        var pnode = pdoc.getRootElement().getFirstChildElement("p");
                        pnode.detach();
                        node.getParent().replaceChild(node, pnode);
                        if (pnode.getFirstChildElement("script")) {
                        	   pnode.getFirstChildElement("script").appendChild(new Text(" "));
                        }
                        var pNode2 = new Element("p");
                	    pNode2.appendChild(" ");
                        pnode.getParent().insertChild(pNode2, pnode.getParent().indexOf(pnode)+1);
			         
                    }
                    else if (className == "encadre") {
                        var strongNode = new Element("strong");
                	    strongNode.addAttribute(new Attribute("style", "font-size:18px;"));
                	    strongNode.appendChild(getValue(node, "p [@class='intro']") + " ");
                	    if (node.query("p [@class='intro']").size()>0) {
                	    	   node.replaceChild(node.query("p [@class='intro']").get(0), strongNode);
                	    }
                        setNodeName(node, "div");
                        node.addAttribute(new Attribute("class", "blocEncadre"));
                        node.addAttribute(new Attribute("style", "background-color:#ebf0f5; border:3px solid #ccdce4; color:#00283C; margin:20px 0 0 0; padding:14px; clear:both;"));
                    }
                    else if (className == "video") {
                        var pNode = new Element("p");
                	    pNode.appendChild(" ");
                        node.getParent().insertChild(pNode, node.getParent().indexOf(node));
			         var strongNode = new Element("strong");
                	    strongNode.appendChild(getValue(node, "p [@class='intro']") + " ");
                        node.getParent().insertChild(strongNode, node.getParent().indexOf(node));
                        var urlVideo = getValue(node, "p/a");
                        _print("urlVideo : " + urlVideo);
                        if (urlVideo.indexOf('_') != -1) {
							urlVideo = urlVideo.substring(0, urlVideo.indexOf('_'));
                        }
                        //_print(urlVideo);
                        var iframeNode = new Element("iframe");
                        iframeNode.addAttribute(new Attribute("frameborder", "0"));
                        iframeNode.addAttribute(new Attribute("width", "545"));
                        iframeNode.addAttribute(new Attribute("height", "307"));
                        iframeNode.addAttribute(new Attribute("allowfullscreen","true"));
                        iframeNode.addAttribute(new Attribute("src", (urlVideo == "") ? "" : urlVideo.replaceAll("com/video", "com/embed/video") + '?syndication=111791&logo=0&info=0&quality=720'));
                        node.getParent().replaceChild(node, iframeNode);
                        iframeNode.appendChild(new Text(" "));
                        var pNode2 = new Element("p");
                	    pNode2.appendChild(" ");
                        iframeNode.getParent().insertChild(pNode2, iframeNode.getParent().indexOf(iframeNode)+1);
                    }
                    else if (className == "infographie") {
 			         var pNode = new Element("p");
                	    pNode.appendChild(" ");
                        node.getParent().insertChild(pNode, node.getParent().indexOf(node));
			         var strongNode = new Element("strong");
                	    strongNode.appendChild(getValue(node, "p [@class='intro']") + " ");
                        node.getParent().insertChild(strongNode, node.getParent().indexOf(node));
			         var anotherStrongNode = new Element("strong");
                	    anotherStrongNode.appendChild(getValue(node, "p/i") + " ");
                        var imgNode = new Element("img");
			         var graphicNodes = node.query("p/infographie");
				    if (graphicNodes.size() > 0) {
				        var fileref = graphicNodes.get(0).getAttributeValue("fileref");
				        if (fileref != null && fileref.length() > 1) {
				            var uuid = fileref.substring(fileref.lastIndexOf("=") + 1);
				            var path = "Media/" + uuid + "_1.jpg";
				            imgNode.addAttribute(new Attribute("src", path));
				            var shape = createShape(graphicNodes);
				            imgNode.addAttribute(new Attribute("width", shape.x2));
				            imgNode.addAttribute(new Attribute("heigth", shape.y2));
				        }
				    }
                        node.getParent().replaceChild(node, imgNode);
                        imgNode.appendChild(new Text(" "));
                        imgNode.getParent().insertChild(anotherStrongNode, imgNode.getParent().indexOf(imgNode)+1);
			         var pNode2 = new Element("p");
                	    pNode2.appendChild(" ");
                        imgNode.getParent().insertChild(pNode2, imgNode.getParent().indexOf(imgNode)+2);
                    }
                    else if (className == "photo") {
			         var pNode = new Element("p");
                	    pNode.appendChild(" ");
                        node.getParent().insertChild(pNode, node.getParent().indexOf(node));
			         var strongNode = new Element("strong");
                	    strongNode.appendChild(getValue(node, "p/i") + " ");
                        var imgNode = new Element("img");
			         var photoNodes = node.query("p/photo");
				    if (photoNodes.size() > 0) {
				        var fileref = photoNodes.get(0).getAttributeValue("fileref");
				        if (fileref != null && fileref.length() > 1) {
				            var uuid = fileref.substring(fileref.lastIndexOf("=") + 1);
				            var path = "Media/" + uuid + "_1.jpg";
				            imgNode.addAttribute(new Attribute("src", path));
				            var shape = createShape(photoNodes);
				            imgNode.addAttribute(new Attribute("width", shape.x2));
				            imgNode.addAttribute(new Attribute("heigth", shape.y2));
				        }
				    }
                        node.getParent().replaceChild(node, imgNode);
                        imgNode.appendChild(new Text(" "));
                        imgNode.getParent().insertChild(strongNode, imgNode.getParent().indexOf(imgNode)+1);
			         var pNode2 = new Element("p");
                	    pNode2.appendChild(" ");
                        imgNode.getParent().insertChild(pNode2, imgNode.getParent().indexOf(imgNode)+2);
                    }
                    else if (className == "complement") {
				    node.detach();
                    }
                    else if (className == "autres") {
                        var pNode = new Element("p");
                	    var html = getValue(node, "p").replace(' »', '"').replace('»', '"').replace(" ?", "?").replace(" ;", ";").replace(" :", ":").replace(" async", " async=\"async\"");
                        var innerhtml = StringEscapeUtils.unescapeHtml4(html).replaceAll("&", "&amp;");
                        pNode.appendChild(innerhtml);
                        node.getParent().replaceChild(node, pNode);
                    }
                }
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
            else setNodeName(node, "p");
        }
        else {
            var tag = node.getLocalName().toLowerCase();
            if (tag == "br") {
                var t = new Text(" ");
                node.getParent().replaceChild(node, t);
            }
            else if (tag == "p") {
            	 if (node.getValue()=="") {
            	 	node.appendChild(new Text(" ")); 
            	 }          	  
            }
            else
                node.detach();
        }
    }
}

function detach(nodes) {
    if (nodes != null) {
        for (var j = 0; j < nodes.size(); j++)
            nodes.get(j).detach();
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
    processTags(itemNode.query("doc/article/titraille/surtitre/descendant-or-self::*"));
    return addToElement(itemNode.query("doc/article/titraille/heading/*"), new Element("heading"));
}

function createTitleTag(itemNode) {
    processTags(itemNode.query("doc/article/titraille/titre/descendant-or-self::*"));
//    return addToElement(itemNode.query("doc/article/titraille/title/child::node()"), new Element("title"));

    var titleNode = new Element("title");
    var node = itemNode.query("doc/article/titraille/title/child::node()").get(0);
    node.detach();
    titleNode.appendChild(node);
    return titleNode;
}

function createSubTitleTag(itemNode) {
    processTags(itemNode.query("doc/article/titraille/soustitre/descendant-or-self::*"));
    return addToElement(itemNode.query("doc/article/titraille/subtitle/*"), new Element("subtitle"));
}

function createLeadTag(itemNode) {
    processTags(itemNode.query("doc/article/titraille/chapo/descendant-or-self::*"));
    return addToElement(itemNode.query("doc/article/titraille/lead/*"), new Element("lead"));
}

function createLegPhotoTag(itemNode) {
    processTags(itemNode.query("doc/article/photo-groupe/photo-legende/descendant-or-self::*"));
//    return addToElement(itemNode.query("doc/article/photo-groupe/legend/*"), new Element("legend"));

    var LegPhotoNode = new Element("legend");
    var node = itemNode.query("doc/article/photo-groupe/legend/child::node()").get(0);
    node.detach();
    LegPhotoNode.appendChild(node);
    return LegPhotoNode;
}

function createCreditPhotoTag(itemNode) {
    processTags(itemNode.query("doc/article/photo-groupe/photo-legende/p/credit"));
    return addToElement(itemNode.query("doc/article/photo-groupe/photo-legende/p/creditlegend"), new Element("creditlegend"));
}

function createPreLegPhotoTag(itemNode) {
    processTags(itemNode.query("doc/article/photo-groupe/photo-legende/p/b"));
    return addToElement(itemNode.query("doc/article/photo-groupe/photo-legende/p/b"), new Element("prelegend"));
}

function createTexteTag(itemNode) {

    var nodes = itemNode.query("doc/article/texte/descendant-or-self::* | doc/article/tables/descendant-or-self::*");
    processTags(nodes);

    var textNode = new Element("text");
    nodes = itemNode.query("doc/article/text/*");
    for (var i = 0; i < nodes.size(); i++) {
        var node = nodes.get(i);
        if (node.getChildCount() > 0) {
            node.detach();
            textNode.appendChild(node);
        }
    }
    return textNode;
}

function addIptcElement(iptcData) {
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
    return iptc;
}

// Resize Image with Ghostscript
function convertPdf(srcFile, dstFile, previewFile, thumbFile, shape, affine, res) {
    _print("Converting PDF: " + srcFile.getName());

    var jpgFile = new File(FilenameUtils.removeExtension(dstFile.getPath()) + ".jpg");
    if (dstFile.exists())
        FileUtils.deleteQuietly(dstFile);
    if (jpgFile.exists())
        FileUtils.deleteQuietly(jpgFile);
    if (previewFile.exists())
        FileUtils.deleteQuietly(previewFile);
    if (thumbFile.exists())
        FileUtils.deleteQuietly(thumbFile);

    var tmpFile = File.createTempFile("graphics_", ".jpg");
    tmpFile.deleteOnExit();

    var exe = GS_EXE + " -q -dNOPROMPT -dBATCH -dNOPAUSE -dUseCIEColor -sDEVICE=jpeg -dJPEGQ=85 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r180 -o ";
    var pdf = tmpFile.getPath() + " \"" + srcFile.getPath() + "\"";

    // TMP JPEG
    _print("Converting PDF: " + srcFile.getName());
    _execFor(exe + pdf, dstFile.getParent(), 90000);
    
    convertImage(tmpFile, jpgFile, previewFile, thumbFile, shape, affine);
    FileUtils.deleteQuietly(tmpFile);
    FileUtils.copyFile(srcFile, dstFile);
}

// Resize Image with Image Magick
function convertImage(srcFile, dstFile, previewFile, thumbFile) {
    _print("Converting Image: " + srcFile.getName());
    if (dstFile.exists() || previewFile.exists() || thumbFile.exists()) {
        return;
    }

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

// Resize Image with Image Magick depending on affine transform, shape and size 
function convertImage2(srcFile, dstFile, previewFile, thumbFile, shape, affine) {
    _print("Converting Image2: " + srcFile.getName());

    if (dstFile.exists() || previewFile.exists() || thumbFile.exists()) {
        return;
    }

    // Transform and convert to jpeg image
    var w = Math.round(shape.x2 / Math.abs(affine.sx));
    var h = Math.round(shape.y2 / Math.abs(affine.sy));
    var opt;

    if (affine.ro == "0" && affine.sx > 0 && affine.sy > 0) {
        var x = sign(Math.round(-affine.tx / affine.sx));
        var y = sign(Math.round(-affine.ty / affine.sy));
        opt = [srcFile.getPath(), "-crop", w + "x" + h + x + y, "+repage",
            "-resize", shape.x2 + "x" + shape.y2 + ">", dstFile.getPath()];
    }
    else {
        var imageInfo = ScriptUtils.getImageInfo(srcFile);
        var af = AffineTransform.getScaleInstance(affine.sx, affine.sy);
        af.rotate(toRad(affine.ro));
        var rec = new Rectangle2D.Double(0, 0, imageInfo.getWidth(), imageInfo.getHeight());
        var bbox = af.createTransformedShape(rec).getBounds2D();
        var x = sign(Math.round((-affine.tx - bbox.getX()) / Math.abs(affine.sx)));
        var y = sign(Math.round((-affine.ty - bbox.getY()) / Math.abs(affine.sy)));
        var flop = (affine.sx < 0) ? "-flop" : "";
        var flip = (affine.sy < 0) ? "-flip" : "";
        opt = [srcFile.getPath(), flip, flop, "-rotate", affine.ro,
            "-crop", w + "x" + h + x + y, "+repage",
            "-resize", shape.x2 + "x" + shape.y2 + ">", dstFile.getPath()];
    }

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

// Resize Image with Image Magick depending on affine transform and shape but size
function convertImage3(srcFile, dstFile, previewFile, thumbFile, shape, affine) {
    _print("Converting Image3: " + srcFile.getName());
    if (dstFile.exists() || previewFile.exists() || thumbFile.exists()) {
        return;
    }

    // Transform and convert to jpeg image
    var w = Math.round(shape.x2 / Math.abs(affine.sx));
    var h = Math.round(shape.y2 / Math.abs(affine.sy));
    var x = sign(Math.round(-affine.tx / affine.sx));
    var y = sign(Math.round(-affine.ty / affine.sy));
    var opt;

    if (affine.ro == "0" && affine.sx > 0 && affine.sy > 0) {
        var x = sign(Math.round(-affine.tx / affine.sx));
        var y = sign(Math.round(-affine.ty / affine.sy));
        opt = [srcFile.getPath(), "-crop", w + "x" + h + x + y, "+repage",
            "-resize", REL_SIZE + "x" + REL_SIZE + ">", dstFile.getPath()];
    }
    else {
        var imageInfo = ScriptUtils.getImageInfo(srcFile);
        var af = AffineTransform.getScaleInstance(affine.sx, affine.sy);
        af.rotate(toRad(affine.ro));
        var rec = new Rectangle2D.Double(0, 0, imageInfo.getWidth(), imageInfo.getHeight());
        var bbox = af.createTransformedShape(rec).getBounds2D();
        //        _print("d.width: " + imageInfo.getWidth() + " - d.height: " + imageInfo.getHeight() ) ;
        //        _print("affine.tx: " + affine.tx + " - affine.ty: " + affine.ty + " - affine.ro: " + affine.ro ) ;
        //        _print("affine.sx: " + affine.sx + " - affine.sy: " + affine.sy ) ;
        //        _print("bbox.getX(): " + bbox.getX() + " - bbox.getY(): " + bbox.getY() ) ;

        var x = sign(Math.round((-affine.tx - bbox.getX()) / Math.abs(affine.sx)));
        var y = sign(Math.round((-affine.ty - bbox.getY()) / Math.abs(affine.sy)));
        var flop = (affine.sx < 0) ? "-flop" : "";
        var flip = (affine.sy < 0) ? "-flip" : "";
        opt = [srcFile.getPath(), flip, flop, "-rotate", affine.ro,
            "-crop", w + "x" + h + x + y, "+repage",
            "-resize", REL_SIZE + "x" + REL_SIZE + ">", dstFile.getPath()];
    }

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

// Get Some IPTC values for JPEG image
function getIptcData(file) {
    var iptcData = new Object();
    try {
        var metadata = JpegMetadataReader.readMetadata(file);
        var iptcDir = ScriptUtils.getIptcDirectory(metadata);
        if (iptcDir != null) {
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
    return iptcData;
}

function nonNull(value) {
    return (value == null) ? "" : value;
}

// Capitalize only the first char of the string
function capFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Trim string
function trim(str) {
    return (str == null) ? null : (str + "").replace(/^\s+/g, '').replace(/\s+$/g, '');
}

// Change node name and remove all attributes 
function setNodeName(node, newName) {
    for (var i = node.getAttributeCount() - 1; i >= 0; i--) {
        var attr = node.getAttribute(i);
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

// Create a new element <tag> value </tag>
function createElement(tag, value) {
    var element = new Element(tag);
    element.appendChild(value);
    return element;
}

function toRad(deg) {
    return deg * Math.PI / 180;
}

// Add + if n >= 0
function sign(n) {
    return (n >= 0) ? "+" + n : n;
}

// Main
function main() {
    _print("Starting Process");
    extractZip();
    processZip();
    buildZip();
    _print("Process Done");
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

