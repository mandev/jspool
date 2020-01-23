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
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.drew.imaging.jpeg) ;
importPackage(Packages.com.drew.metadata.iptc) ;
importPackage(Packages.com.drew.metadata.exif) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

STAGING_DIR = "C:/tmp/ed1/" ;
OUTPUT_DIR = "C:/tmp/ed2/" ;
MAX_SIZE = 1280 ;  // Pixels
REL_SIZE = 1280 ;
PREVIEW_SIZE=512;
THUMB_SIZE=162 ;
//
var ZIP_DIR ;
var DATA_DIRNAME ;
var PLAN_FILENAME ;
var YEAR ;
var MONTH ;
var DAY ;

// Unzip and set global variables
function processZip() {
    _print("Processing Zip File");
    
    ZIP_DIR = new File(STAGING_DIR, _srcFile.getName() + "_dir") ;
    _print("ZIP_DIR: " + ZIP_DIR);
    if ( ZIP_DIR.exists() ) FileUtils.forceDelete(ZIP_DIR) ;
    ScriptUtils.unzipFileToDir(_srcFile.getFile(), ZIP_DIR) ;

    // Date Directory 20101402
    var filenames = ZIP_DIR.list() ;
    var rxp = new RegExp("\\d\\d\\d\\d\\d\\d\\d\\d", "") ;
    for(var i in filenames ) {
        if ( filenames[i].match(rxp) ) {
            DATA_DIRNAME = ZIP_DIR + "/" + filenames[i] + "/" ;
            _print("DATA_DIRNAME: " + DATA_DIRNAME);
            break ;
        }
    }

    // Planning: LeParisien_2010-10-14.xml
    rxp = new RegExp("LeParisien_\\d\\d\\d\\d-\\d\\d-\\d\\d\\.xml", "") ;
    filenames = new File(DATA_DIRNAME + "autres/").list() ;
    for(i in filenames ) {
        if ( filenames[i].match(rxp) ) {
            PLAN_FILENAME = DATA_DIRNAME + "autres/" + filenames[i] ;

            YEAR = filenames[i].substr(11,4);
            MONTH = filenames[i].substr(16,2);
            DAY = filenames[i].substr(19,2);

            _print("PLAN_FILENAME: " + PLAN_FILENAME + " - " + DAY + "/" + MONTH + "/" + YEAR);
            break ;
        }
    }

    if ( DATA_DIRNAME == null) _print("The Date Directory was not found in the Zip File");
    if ( PLAN_FILENAME == null) _print("The Planning File was not found in the Zip File");
}

// Delete ZIP_DIR
function deleteZipDir() {
    _print("Purging " + ZIP_DIR);
    if ( ZIP_DIR.exists() ) FileUtils.forceDelete(ZIP_DIR) ;
}

// Return all physical pages
function getAllPages() {
    //_print("getPhysPages");

    var physPages = new Array() ;

    var builder = new Builder();
    var doc = builder.build(new File(PLAN_FILENAME));
    var parutionNode = doc.getRootElement();
        
    var productDate = parutionNode.getAttributeValue("issueDate") ;
    var inverseDate = getInvertedDate(productDate) ;
    var editionNodes = parutionNode.getChildElements()  ;

    // On liste les pages physiques
    for (var i = 0; i < editionNodes.size(); i++) {
        var editionNode = editionNodes.get(i);
        var editionName = editionNode.getAttributeValue("name") + "" ;
        //_print("editionName: " + editionName);
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
                    var pagePath = "PAGE_" + inverseDate + "_PAR_" + editionName + "_" + bookName + "_" + pagePn + ".pdf" ; // PAGE_20100927_PAR_PAR75_E75_IX.pdf
                    physPages.push(createPhysPage(productDate, "LP", editionName, bookName, pagePn, pageEditionNum, pageSection, pageColor, pageMax, sequence, pagePath)) ;
                }
            }
        }
    }

    // On liste les pages liées
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
                    addLinkedPage(physPages, pageMasterEdition, pageMasterNum, "LP", editionName, bookName, pagePn, pageColor, pageMax, sequence) ;
                }
            }
        }
    }
    return physPages ;
}

// Process all pages /spool/20100927/pages dans ROOT/ANNEE/MOIS/JOUR/PRODUCT/EDITION/PAGE/BOOK
function processPages(physPages) {
    for ( i in physPages ) {
        var physPage = physPages[i] ;
        var invDate = getInvertedDate(physPage.date) ;
        var srcPath = DATA_DIRNAME + "pages/" + physPage.path ;
        var srcFile = new File(srcPath) ;
        if ( srcFile.exists() ) {
            var dstPath = OUTPUT_DIR + invDate.substr(0,4) + "/" + invDate.substr(4,2) + "/" + invDate.substr(6,2) + "/" + physPage.product + "/" + physPage.edition + "/" + physPage.book  + "/" + physPage.pn + "/" + physPage.path ;
            _print("Copying Page: " + srcFile.getName() + " to " + dstPath );

            var dstFile = new File(dstPath)
            var basename = FilenameUtils.getBaseName(dstFile.getName()) ;
            var previewFile = new File(dstFile.getParent(), "PREVIEW_" + basename + ".jpg") ;
            var thumbFile = new File(dstFile.getParent(), "THUMB_" + basename + ".jpg") ;
            physPage.preview = previewFile.getName();
            physPage.thumb = thumbFile.getName();

            convertPdf(srcFile, dstFile, previewFile, thumbFile, 20) ;

            //if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
            //FileUtils.moveFile(srcFile, dstFile) ; // MoveFile

            // Crée le fichier XML de description
            var xmlFile = new File(dstPath + ".xml");
            writePage(physPage, xmlFile) ;
        }
    }
}

// Create a physical page
function createPhysPage(date, product, edition, book, pn, editnum, section, color, pageMax, sequence, path) {
    //_print("physPage: " + date + ", " + product + ", " + edition + ", " + book  + ", " + pn + ", " + editnum + ", " + section + ", " + path);
    if ( section == null ) section = "" ;
    if ( color == null ) color = "cmyk" ;

    var physPage = new Object();
    physPage.date = date;
    physPage.product = product ;
    physPage.edition = edition ;
    physPage.book = book ;
    physPage.pn = pn ;
    physPage.editnum = editnum ;
    physPage.section = section ;
    physPage.color = color ;
    physPage.pageMax = pageMax ;
    physPage.sequence = sequence ;
    physPage.path = path ;
    physPage.preview = null ;
    physPage.thumb = null ;
    physPage.links = new Array() ;
    return physPage ;
}

// Add a linked page to a physical page
function addLinkedPage(physPages, masterEdition, masterNum, product, edition, book, pn, color, pageMax, sequence) {
    for ( i in physPages ) {
        var physPage = physPages[i] ;
        if ( physPage.edition == masterEdition &&  physPage.editnum == masterNum ) {
            //_print("linkedPage: " + masterEdition + ", " + masterNum + ", " + product + ", " + edition + ", " + book + ", " + pn);
            if ( color == null ) color = physPage.color ;

            var linkedPage = new Object();
            linkedPage.product = product ;
            linkedPage.edition = edition;
            linkedPage.book = book ;
            linkedPage.pn = pn ;
            linkedPage.color = color ;
            linkedPage.pageMax = pageMax ;
            linkedPage.sequence = sequence ;
            physPage.links.push(linkedPage) ;
            return ;
        }
    }
    _print("Unable to add linkedPage: " + masterEdition + ", " + masterNum + ", " + product + ", " + edition + ", " + book + ", " + pn);
}

// Write the XML description for the physical page
function writePage(physPage, file) {
    //_print("Create " + file );

    var page = new Element("page");
    page.addAttribute(new Attribute("date", physPage.date)) ;
    page.addAttribute(new Attribute("product", physPage.product)) ;
    page.addAttribute(new Attribute("edition", physPage.edition)) ;
    page.addAttribute(new Attribute("book", physPage.book)) ;
    page.addAttribute(new Attribute("pn", physPage.pn)) ;
    page.addAttribute(new Attribute("color", physPage.color)) ;
    page.addAttribute(new Attribute("section", physPage.section)) ;
    page.addAttribute(new Attribute("pageMax", physPage.pageMax)) ;
    page.addAttribute(new Attribute("sequence", physPage.sequence)) ;
    page.addAttribute(new Attribute("path", physPage.path)) ;
    page.addAttribute(new Attribute("preview", physPage.preview)) ;
    page.addAttribute(new Attribute("thumb", physPage.thumb)) ;

    var links = physPage.links;
    if ( links.length > 0 ) {
        var inheritedPages = new Element("inheritedPages");
        for (var i in links) {
            var linkedPage = links[i] ;
            var inheritedPage = new Element("inheritedPage") ;
            inheritedPage.addAttribute(new Attribute("product", linkedPage.product)) ;
            inheritedPage.addAttribute(new Attribute("edition", linkedPage.edition)) ;
            inheritedPage.addAttribute(new Attribute("book", linkedPage.book)) ;
            inheritedPage.addAttribute(new Attribute("pn", linkedPage.pn)) ;
            inheritedPage.addAttribute(new Attribute("color", linkedPage.color)) ;
            inheritedPage.addAttribute(new Attribute("pageMax", linkedPage.pageMax)) ;
            inheritedPage.addAttribute(new Attribute("sequence", linkedPage.sequence)) ;
            inheritedPages.appendChild(inheritedPage);
        }
        page.appendChild(inheritedPages);
    }

    // Create the XML Page descriptor
    _print("Writing Page XML: " + file );
    var os = new BufferedOutputStream(new FileOutputStream(file)) ;
    var serializer = new Serializer(os, "UTF-8");
    serializer.setIndent(3);
    serializer.write(new Document(page));
    os.close() ;
}

// Process all stories
function processStories(physPages) {
    var dir = new File(DATA_DIRNAME) ;
    var rxp = new RegExp("STORY_.*\\.xml", "") ;

    var storyFiles = dir.listFiles()
    for (var i in storyFiles) {
        var storyFile = storyFiles[i];
        if ( storyFile.getName().match(rxp)) writeStory(physPages, storyFile) ;
    }
}

// Process and write Story
function writeStory(physPages, storyFile) {
    //_print("getStory " + storyFile);

    var builder = new Builder();
    var doc = builder.build(storyFile);

    var text = getValue(doc, "/doc/article") + "" ;
    var mediaNodes = doc.query("/doc/article/media-groupe") ;
    var prodname = getValue(doc, "/doc/dbMetadata/sys/props/productInfo/name") + "" ;
    var issuedate = getValue(doc, "/doc/dbMetadata/sys/props/productInfo/issueDate") + "";
    var edition = getValue(doc, "/doc/dbMetadata/Metadata/PubData/Paper/Edition") + "" ;
    var book = getValue(doc, "/doc/dbMetadata/Metadata/PubData/Paper/Book") + "" ;
    var pn = getValue(doc, "/doc/dbMetadata/Metadata/PubData/Paper/PageNumber") + "" ;

    if ( (mediaNodes == null || mediaNodes.size() == 0 || mediaNodes.get(0).getValue().length() < 25 ) && text.length < 150 )  {
        _print("Rejecting too short article: " + storyFile);
	//FileUtils.moveFile(storyFile, new File("C:/tmp/reject", storyFile.getName())) ;
	FileUtils.forceDelete(storyFile);
        return ;
    }

	
    if ( pn == "1" && text.length < 300 && text.indexOf("ANDORRE") >= 0 &&  text.indexOf("DOM-TOM") > 0 && 
		text.indexOf("BELGIQUE") > 0 && text.indexOf("SUISSE") > 0 && text.indexOf("ESPAGNE") > 0 &&
		text.indexOf("GRECE") > 0 && text.indexOf("MAROC") > 0 && text.indexOf("PORTUGAL") > 0 &&
		text.indexOf("ZONE CFA") > 0 && text.indexOf("TUNISIE") > 0 ) {

	FileUtils.forceDelete(storyFile);
        return ;
    }


    if ( issuedate.substr(6,2) != DAY || issuedate.substr(4,2) != MONTH || issuedate.substr(0,4) != YEAR ) {
        _print("Not corresponding date: " + storyFile + " (" + issuedate + " != " + YEAR + "/" + MONTH + "/" + DAY + ")");
    }

    // TODO: check SUPECO, AUJ, TAP, etc
    var product = ( prodname == "LeParisien" ) ? "LP" : "AUJ" ;
    //var date = issuedate.substr(6,2) + "/" + issuedate.substr(4,2) + "/" + issuedate.substr(0,4) ;
    var date = DAY + "/" + MONTH + "/" + YEAR ;

    var physPage = getPhysPage(physPages, product, date, edition, book, pn);
    if ( physPage == null ) {
        //date = DAY + "/" + MONTH + "/" + YEAR ;
        date = issuedate.substr(6,2) + "/" + issuedate.substr(4,2) + "/" + issuedate.substr(0,4) ;
        physPage = getPhysPage(physPages, product, date, edition, book, pn);
    }

    if ( physPage != null ) {
        var srcDir = DATA_DIRNAME ;
        var dstDir = OUTPUT_DIR + YEAR + "/" + MONTH + "/" + DAY + "/" + physPage.product + "/" + physPage.edition + "/" + physPage.book  + "/" + physPage.pn + "/" ;

        // Copy Media
        writePhoto(mediaNodes, storyFile, srcDir, dstDir) ;

        // Modify Page paths
        var pageNameNode = doc.query("/doc/dbMetadata/Metadata/PubData/Paper/PageName").get(0) ;
        pageNameNode.removeChildren();
        pageNameNode.appendChild(physPage.path);

        var links = physPage.links;
        if ( links.length > 0 ) {
            var inheritedPages = new Element("inheritedPages");
            for (var i in links) {
                var linkedPage = links[i] ;
                var inheritedPage = new Element("inheritedPage") ;
                inheritedPage.addAttribute(new Attribute("product", linkedPage.product)) ;
                inheritedPage.addAttribute(new Attribute("edition", linkedPage.edition)) ;
                inheritedPage.addAttribute(new Attribute("book", linkedPage.book)) ;
                inheritedPage.addAttribute(new Attribute("pn", linkedPage.pn)) ;
                inheritedPage.addAttribute(new Attribute("color", linkedPage.color)) ;
                inheritedPage.addAttribute(new Attribute("pageMax", linkedPage.pageMax)) ;
                inheritedPage.addAttribute(new Attribute("sequence", linkedPage.sequence)) ;
                inheritedPages.appendChild(inheritedPage);
            }
            var paperNode = doc.query("/doc/dbMetadata/Metadata/PubData/Paper").get(0) ;
            paperNode.appendChild(inheritedPages);
        }

        // Create Story.xml
        var dstDirFile = new File(dstDir) ;
        if ( !dstDirFile.exists() ) FileUtils.forceMkdir(dstDirFile) ;

        var file = new File(dstDir, storyFile.getName()) ;
        //_print("Writing Story XML: " + file );
        var os = new BufferedOutputStream(new FileOutputStream(file)) ;
        var serializer = new Serializer(os, "ISO-8859-1");
        serializer.setIndent(3);
        serializer.write(doc);
        os.close() ;

        //_print("Deleting: " + storyFile );
        FileUtils.forceDelete(storyFile);
    }
}

// Return the Physical with the corresponding product, date, edition...
function getPhysPage(physPages, product, date, edition, book, pn) {
    for ( i in physPages ) {
        var physPage = physPages[i] ;
        //_print(date + " " + product + " " + edition + " " + book + " " + pn) ;
        //_print(physPage.date + " " + physPage.product + " " + physPage.edition + " " + physPage.book + " " + physPage.pn) ;
        if ( physPage.date == date && physPage.product == product && physPage.edition == edition &&  physPage.book == book  && physPage.pn == pn ) {
            return physPage ;
        }
    }
    return null ;
}

// Rewrite the photo in the xml and convert to lower resolution
function writePhoto(mediaNodes, storyFile, srcDir, dstDir) {

    if ( mediaNodes.size() == 0 ) return ;

    var mediaNode = mediaNodes.get(0) ;
    var photoNodes = mediaNode.query("photo") ;
    var legendeNodes = mediaNode.query("legende") ;
    mediaNode.removeChildren();
    var jpgCount = 0 ;
    var pdfCount = 0 ;

    for (var i = 0; i < photoNodes.size(); i++) {
        var photoNode = photoNodes.get(i) ;
        var legendeNode = (i<legendeNodes.size()) ? legendeNodes.get(i) : null ;

        var srcFile = new File(srcDir + photoNode.getValue()) ;
        var ext = FilenameUtils.getExtension(srcFile.getName()) ;
        if ( ext.toLowerCase() == "pdf" ) processImagePdf(storyFile, srcFile, ext, (++jpgCount), dstDir, mediaNode, legendeNode) ;
        else processImageJpeg(storyFile, srcFile, ext, (++pdfCount), dstDir, mediaNode, legendeNode)
    }
}

function processImagePdf(storyFile, srcFile, ext, count, dstDir, mediaNode, legendeNode) {

    var basename = FilenameUtils.getBaseName(storyFile.getName()).substr("STORY_".length);
    var filename = "IMAGE_" + basename + "_" + count + "." + ext ;
    var dstFile = new File(dstDir,  filename) ;

    if ( srcFile.exists() && srcFile.isFile() ) {
        var previewFile = new File(dstFile.getParent(), "PREVIEW_" + basename + "_" + count + ".jpg") ;
        var thumbFile = new File(dstFile.getParent(), "THUMB_" + basename + "_" + count + ".jpg") ;
        convertPdf(srcFile, dstFile, previewFile, thumbFile, 72) ;

        if ( dstFile.exists() ) {
            var media = new Element("media") ;
            media.appendChild(createTag("photo", filename));
            media.appendChild(createTag("preview", previewFile.getName()));
            media.appendChild(createTag("thumb", thumbFile.getName()));

            if ( legendeNode != null && legendeNode.getValue().length() > 0 ) {
                media.appendChild(createTag("legende", legendeNode.getValue()));
            }

            mediaNode.appendChild(media);
        }
        else {
            _print("Unable to convert pdf file: " + srcFile + " (" + storyFile + ")");
        }
    }
    else {
        _print("Unable to read media file: " + srcFile + " (" + storyFile + ")");
    }

}

function processImageJpeg(storyFile, srcFile, ext, count, dstDir, mediaNode, legendeNode) {

    var basename = FilenameUtils.getBaseName(storyFile.getName()).substr("STORY_".length);
    var filename = "IMAGE_" + basename + "_" + count + "." + ext ;
    var dstFile = new File(dstDir, filename) ;

    if ( srcFile.exists() && srcFile.isFile() ) {
        var previewFile = new File(dstFile.getParent(), "PREVIEW_" + dstFile.getName().substr("IMAGE_".length)) ;
        var thumbFile = new File(dstFile.getParent(), "THUMB_" + dstFile.getName().substr("IMAGE_".length)) ;
        var iptcData = getIptcData(srcFile)
        convertImage(srcFile, dstFile, previewFile, thumbFile) ;

        if ( dstFile.exists() ) {
            var media = new Element("media") ;
            media.appendChild(createTag("photo", filename));
            media.appendChild(createTag("preview", previewFile.getName()));
            media.appendChild(createTag("thumb", thumbFile.getName()));

            if ( legendeNode != null ) {
                media.appendChild(createTag("legende", legendeNode.getValue()));
            }

            if ( iptcData != null ) {
                var iptc = new Element("iptc") ;
                iptc.appendChild(createTag("caption", iptcData.caption));
                iptc.appendChild(createTag("headline", iptcData.headline));
                iptc.appendChild(createTag("credit", iptcData.credit));
                iptc.appendChild(createTag("byline", iptcData.byline));
                iptc.appendChild(createTag("objectname", iptcData.objectname));
                iptc.appendChild(createTag("datecreated", iptcData.datecreated));
                iptc.appendChild(createTag("city", iptcData.city));
                media.appendChild(iptc);
            }

            mediaNode.appendChild(media);
        }
        else {
            _print("Unable to convert image file: " + srcFile + " (" + storyFile + ")");
        }
    }
    else {
        _print("Unable to read media file: " + srcFile + " (" + storyFile + ")");
    }
}

// Create <tag> value </tag>
function createTag(tag, value) {
    var element = new Element(tag) ;
    element.appendChild(value);
    return element ;
}

// Resize Image with Ghostscript
function convertPdf(srcFile, dstFile, previewFile, thumbFile, res)  {
    if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
    if ( previewFile.exists() ) FileUtils.forceDelete(previewFile) ;
    if ( thumbFile.exists() ) FileUtils.forceDelete(thumbFile) ;

    var tmpFile = File.createTempFile("page_", ".jpg") ;
    tmpFile.deleteOnExit() ;

    var exe = "C:/Program Files/gs/gs9.02/bin/gswin64c.exe -q -dNOPROMPT -dBATCH -dNOPAUSE -dUseCIEColor -sDEVICE=jpeg -dJPEGQ=85 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r180 -o " ;
    var pdf = tmpFile.getPath() + " " + srcFile.getPath()  + "" ;

    // TMP JPEG
    _print("Converting PDF: " + srcFile.getName()) ;
    _execFor(exe + pdf, dstFile.getParent(), 90000) ;

    // PREVIEW
    if ( tmpFile.exists() ) {
        exe = "ext/windows/imagemagick/convert.exe " + tmpFile.getPath() + " -resize " + PREVIEW_SIZE + "x" + PREVIEW_SIZE + "> " + previewFile.getPath() ;
        _execFor(exe, dstFile.getParent(), 30000) ;
    }

    // THUMB
    if ( previewFile.exists() ) {
        exe = "ext/windows/imagemagick/convert.exe " + previewFile.getPath() + " -resize " + THUMB_SIZE + "x" + THUMB_SIZE + "> " + thumbFile.getPath() ;
        _execFor(exe, dstFile.getParent(), 30000) ;
    }

    FileUtils.moveFile(srcFile, dstFile) ;
    FileUtils.deleteQuietly(tmpFile) ;
}

// Resize Image with Image Magick
function convertImage(srcFile, dstFile, previewFile, thumbFile)  {
    if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
    if ( previewFile.exists() ) FileUtils.forceDelete(previewFile) ;
    if ( thumbFile.exists() ) FileUtils.forceDelete(thumbFile) ;

    var d = ScriptUtils.getImageDimension(srcFile) ;
    if ( srcFile.getName().toLowerCase().endsWith(".jpg") && (d.width == 0 || d.height == 0) ) d.width = MAX_SIZE + 1 ;

    // Convert image if larger than MAX_SIZE
    if (  d.width > MAX_SIZE || d.height > MAX_SIZE ) {
        _print("Converting Image: " + srcFile.getName() + " to " + dstFile + " (" + d.width + "x" + d.height + ")");
        var exe = "ext/windows/imagemagick/convert.exe " + srcFile.getPath() + " -resize " + REL_SIZE + "x" + REL_SIZE + "> " + dstFile.getPath() ;
        _execFor(exe, dstFile.getParent(), 30000) ; // creates also parent directory
        FileUtils.forceDelete(srcFile) ;
    }
    else {
        _print("Copying Image: " + srcFile.getName() + " to " + dstFile + " (" + d.width + "x" + d.height + ")");
        FileUtils.moveFile(srcFile, dstFile) ;
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

// Process all remaining medias (pub, infographies)
function processMedias(physPages) {
    var dir = new File(DATA_DIRNAME, "media") ;

    var storyFiles = dir.listFiles()
    for (var i in storyFiles) {
        var mediaFile = storyFiles[i];
        if ( mediaFile.isFile() ) writeMedia(physPages, mediaFile) ;
    }
}

// Write remaining (non linked) media files
function writeMedia(physPages, mediaFile) {

    if ( mediaFile.getName().toLowerCase().endsWith(".pdf") ) {
        var pdfInfo = PdfExtractor.getPdfInfo(mediaFile) ;
        var type1 = pdfInfo.getMetadata("OVConfigIdentifier") + "" ;
        var type2 = pdfInfo.getMetadata("OneVisionQueueName") + "" ;
        var title = pdfInfo.getMetadata("Title") + "" ;
        if ( type1 == "Traitement publicites PDF" || type2 == "Traitement publicites PDF" ) {
            _print("Rejecting Pub: " + mediaFile) ;
            FileUtils.forceDelete(mediaFile) ;
            return ;
        }
        if ( type1 == "Traitement pageTV EPS vers PDF" || type2 == "Traitement pageTV EPS vers PDF") {
            _print("Rejecting Page TV: " + mediaFile) ;
            FileUtils.forceDelete(mediaFile) ;
            return ;
        }
        if ( type1 == "Traitement pageTV PDF vers PDF" || type2 == "Traitement pageTV PDF vers PDF") {
            _print("Rejecting Page TV: " + mediaFile) ;
            FileUtils.forceDelete(mediaFile) ;
            return ;
        }
        if ( title.match(/CIRCULATION-SEMAINE.*/) ) {
            _print("Rejecting Circulation: " + mediaFile) ;
            FileUtils.forceDelete(mediaFile) ;
            return ;
        }
        if ( mediaFile.length() < 100000 ) {
            _print("Rejecting Small PDF: " + mediaFile) ;
            FileUtils.forceDelete(mediaFile) ;
            return ;
        }
        if ( mediaFile.length() > 5000000 ) {
            _print("Rejecting To Big Media: " + mediaFile) ;
            FileUtils.forceDelete(mediaFile) ;
            return ;
        }
    }
    else {
        if ( mediaFile.length() < 50000 ) {
            _print("Rejecting Small Media: " + mediaFile) ;
            FileUtils.forceDelete(mediaFile) ;
            return ;
        }
        if ( mediaFile.length() > 5000000 ) {
            _print("Rejecting To Big Media: " + mediaFile) ;
            FileUtils.forceDelete(mediaFile) ;
            return ;
        }
    }
    
    var dstDir = OUTPUT_DIR + YEAR + "/" + MONTH + "/" + DAY + "/divers/" ;
    var dstFile = new File(dstDir, mediaFile.getName()) ;
    _print("Copying Media: " + mediaFile.getName() + " to " + dstFile);
    if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
    FileUtils.moveFile(mediaFile, dstFile) ;
}

function getIptcData(file) {
    // Jpeg Only
    try {
        var metadata = JpegMetadataReader.readMetadata(file) ;
        var iptcDir = ScriptUtils.getIptcDirectory(metadata);
        if ( iptcDir != null ) {
            var iptcData = new Object();
            iptcData.caption = nonNull(iptcDir.getString(IptcDirectory.TAG_CAPTION));
            iptcData.headline = nonNull(iptcDir.getString(IptcDirectory.TAG_HEADLINE));
            iptcData.credit = nonNull(iptcDir.getString(IptcDirectory.TAG_CREDIT));
            iptcData.byline = nonNull(iptcDir.getString(IptcDirectory.TAG_BY_LINE));
            iptcData.objectname = nonNull(iptcDir.getString(IptcDirectory.TAG_OBJECT_NAME));
            iptcData.datecreated = nonNull(iptcDir.getString(IptcDirectory.TAG_DATE_CREATED));
            iptcData.city = nonNull(iptcDir.getString(IptcDirectory.TAG_CITY));
            return iptcData ;
        }
    }
    catch (e) {
        _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
        _print("Error parsing iptc: " + file) ;
    }
    return null ;
}

function nonNull(value) {
    return ( value == null ) ? "" : value ;
}

// 27/09/2010 => // 20100927
function getInvertedDate(date) {
    return date.substr(6,4) + date.substr(3,2) + date.substr(0,2) ;
}

// Trim string
function trim (myString) {
    return myString.replace(/^\s+/g,'').replace(/\s+$/g,'')
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    if ( nodes.size() > 1 ) _print("xpath: " + xpath + " - multiple values: " + nodes.get(0).getValue())
    return nodes.get(0).getValue() ;
}

// Main
function main() {
    _print("Starting Process");

    processZip() ;

    var pages = getAllPages() ;
    processPages(pages) ;
    processStories(pages) ;
    processMedias(pages) ;
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

