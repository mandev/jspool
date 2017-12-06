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
importPackage(Packages.org.apache.commons.lang) ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.drew.imaging.jpeg) ;
importPackage(Packages.com.drew.metadata.iptc) ;
importPackage(Packages.com.drew.metadata.exif) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

STAGING_DIR = "D:/METHODE/archive/envoi_pqn/" ;
OUTPUT_DIR = "D:/METHODE/archive/envoi_pqn/" ;
//STAGING_DIR = "C:/tmp/envoi_pqn/" ;
//OUTPUT_DIR = "C:/tmp/envoi_pqn/" ;

REL_SIZE = 512 ; // Pixels
//
var TMP_ZIP_DIR ;
var OUTPUT_DIRNAME ;
var DATA_DIRNAME ;
var PLAN_FILENAME ;
var YEAR ;
var MONTH ;
var DAY ;

function getToday() {

    var today = new Date() ;

    var year = today.getFullYear() + ""
    //year = year.substr(2,2) ;

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

// Unzip and set global variables
function extractZip() {
    _print("Processing Zip File");
    
    TMP_ZIP_DIR = new File(STAGING_DIR, _srcFile.getName() + "_dir") ;
    _print("TMP_ZIP_DIR: " + TMP_ZIP_DIR);
    if ( TMP_ZIP_DIR.exists() ) FileUtils.forceDelete(TMP_ZIP_DIR) ;
    ScriptUtils.unzipFileToDir(_srcFile.getFile(), TMP_ZIP_DIR) ;

    // Date Directory 20101402
    var filenames = TMP_ZIP_DIR.list() ;
    var rxp = new RegExp("\\d\\d\\d\\d\\d\\d\\d\\d", "") ;
    for(var i in filenames ) {
        if ( filenames[i].match(rxp) ) {
            DATA_DIRNAME = TMP_ZIP_DIR + "/" + filenames[i] + "/" ;
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
    OUTPUT_DIRNAME = OUTPUT_DIR  + "/" + "PQLP" + getToday() + "V2_0" ;

    if ( DATA_DIRNAME == null) _print("The Date Directory was not found in the Zip File");
    if ( PLAN_FILENAME == null) _print("The Planning File was not found in the Zip File");
}

function compressZip() {
    var zipFile = new File(OUTPUT_DIRNAME + ".zip") ;
    _print("Compressing " + OUTPUT_DIRNAME + " to " + zipFile);
    ScriptUtils.zipDirToFile(new File(OUTPUT_DIRNAME), zipFile) ;

    _print("Deleting " + TMP_ZIP_DIR + " " + OUTPUT_DIRNAME);
    if ( TMP_ZIP_DIR.exists() ) FileUtils.forceDelete(TMP_ZIP_DIR) ;

    var outDir = new File(OUTPUT_DIRNAME) ;
    if ( outDir.exists() ) FileUtils.forceDelete(outDir) ;
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

        // On ne veut que les AUJ
        if ( editionName != "AUJ" ) continue ;

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
                    var pageNum = pageNode.getAttributeValue("pnEditionNumber") + "" ;
                    var pageNum2 = ( pagePn.indexOf(",") < 0 ) ? pageNum  : pad(parseInt(pageNum, 10) + 1, "0", 3) ;
	// SH: modifié ci-dessous + "Y" par + "O" - le 05/08/2011 -			
                    var multi = ( pageNum == pageNum2  ) ? pageNum + "N" : pageNum + "_" + pageNum2 + "O" ;

                    var pageSection = pageNode.getAttributeValue("section");
                    var pageColor = pageNode.getAttributeValue("color");
                    var sequence = pageNode.getAttributeValue("sequenceNumber") + "";
                    var pagePath = "PAGE_" + inverseDate + "_PAR_" + editionName + "_" + bookName + "_" + pagePn + ".pdf" ; // PAGE_20100927_PAR_PAR75_E75_IX.pdf
                    var trgPath = "Q_PQLP_" + inverseDate + "_" + "00000" + "_N_" + multi + ".pdf" ; // PAGE_20100927_PAR_PAR75_E75_IX.pdf
                    physPages.push(createPhysPage(productDate, "LP", editionName, bookName, pagePn, pageNum, pageSection, pageColor, pageMax, sequence, pagePath, trgPath)) ;
                }
            }
        }
    }

    // Pour AUJ normalement aucune page n'est héritée. On prend donc uniquement les pages physiques AUJ
    // sans y ajouter les pages liées.
    // En revanche pour PARXX, il serait nécessaire de lister toutes les pages physiques, ajouter les
    // pages liées (héritées) - donc décommenter les lignes suivantes  et dans la fonction processPages,
    // selon l'édition demandée,  filtrer et
    // recopier les pages physiques en tenant compte également de la page liée.


    // A décommenter si PARXX (cf. explication ci-dessus)
    // On liste les pages liées
    //    for (i = 0; i < editionNodes.size(); i++) {
    //        editionNode = editionNodes.get(i);
    //        editionName = editionNode.getAttributeValue("name") + "" ;
    //        bookNodes = editionNode.getChildElements() ;
    //
    //        for (j = 0; j < bookNodes.size(); j++) {
    //            bookNode = bookNodes.get(j) ;
    //            bookName = bookNode.getAttributeValue("name") ;
    //            pageNodes = bookNode.getChildElements() ;
    //            pageMax = pageNodes.size() + "" ;
    //
    //            for ( k = 0; k < pageNodes.size(); k++) {
    //                pageNode = pageNodes.get(k);
    //                pageMasterEdition = pageNode.getAttributeValue("masterEdition") + "" ;
    //                if ( editionName != pageMasterEdition) {
    //                    var pageMasterNum = pageNode.getAttributeValue("masterPnEditionNumber") + "" ;
    //                    pagePn = pageNode.getAttributeValue("pn") ;
    //                    pageSection = pageNode.getAttributeValue("section") ;
    //                    pageColor = pageNode.getAttributeValue("color");
    //                    sequence = pageNode.getAttributeValue("sequenceNumber") + "";
    //                    addLinkedPage(physPages, pageMasterEdition, pageMasterNum, "LP", editionName, bookName, pagePn, pageColor, pageMax, sequence) ;
    //                }
    //            }
    //        }
    //    }
    return physPages ;
}

// Create a physical page
function createPhysPage(date, product, edition, book, pn, editnum, section, color, pageMax, sequence, path, trgPath) {
    //_print("physPage: " + date + ", " + product + ", " + edition + ", " + book  + ", " + pn + ", " + editnum + ", " + section + ", " + path);
    if ( section == null ) section = "" ;
    if ( color == null ) color = "cmyk" ;

    var physPage = new Object();
    physPage.date = date;
    physPage.invDate = getInvertedDate(date) ;
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
    physPage.trgPath = trgPath ;
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

// Process all pages /spool/20100927/pages dans ROOT/ANNEE/MOIS/JOUR/PRODUCT/EDITION/PAGE/BOOK
function processPages(physPages) {
    for ( var i in physPages ) {
        var physPage = physPages[i] ;
        var srcPath = DATA_DIRNAME + "pages/" + physPage.path ;
        var srcFile = new File(srcPath) ;
        if ( srcFile.exists() ) {
            var dstPath = OUTPUT_DIRNAME + "/" + physPage.trgPath ;
            _print("Copying Page: " + srcFile.getName() + " to " + dstPath );
            var dstFile = new File(dstPath)

            if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
            convertPage(srcFile, dstFile) ;
            
		  if ( dstFile.length() > srcFile.length() ) {
	            FileUtils.forceDelete(dstFile) ; 
        		  FileUtils.moveFile(srcFile, dstFile) ; // MoveFile
		  }
		  else {
	            FileUtils.forceDelete(srcFile) ;
		  	
		  }
        }
    }
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
    var date = DAY + "/" + MONTH + "/" + YEAR ;

    var physPage = getPhysPage(physPages, product, date, edition, book, pn);
    if ( physPage == null ) {
        date = issuedate.substr(6,2) + "/" + issuedate.substr(4,2) + "/" + issuedate.substr(0,4) ;
        physPage = getPhysPage(physPages, product, date, edition, book, pn);
    }

    if ( physPage != null ) {
        var article = new Element("ARTICLE");
        article.appendChild(createTag("VERSION", "2.0" ));
        article.appendChild(createTag("ID", (getValue(doc, "/doc/dbMetadata/sys/loid") + "")));
        article.appendChild(createTag("SOURCE", "Le Parisien"));


        article.appendChild(createTag("PUBLICATION", physPage.edition));
        article.appendChild(createTag("NUM", "00000"));
        article.appendChild(createTag("DATE", physPage.invDate));
        article.appendChild(createTag("PAGINATION", physPage.editnum));
        article.appendChild(createTag("RUBRIQUE", getValue(doc, "/doc/dbMetadata/Metadata/PubData/Paper/Section") + ""));
        article.appendChild(createTag("SURTITRE", trim(getValue(doc, "/doc/article/titraille/surtitre"))));
        article.appendChild(createTag("TITRE", trim(getValue(doc, "/doc/article/titraille/titre"))));
        article.appendChild(createTag("SOUSTITRE", trim(getValue(doc, "/doc/article/titraille/soustitre"))));
        article.appendChild(createTag("CHAPO", trim(getValue(doc, "/doc/article/titraille/chapo"))));

        var auteurs = new Element("AUTEURS");
        auteurs.addAttribute(new Attribute("type", "VRAC"))

        // getValue(doc, "/doc/dbMetadata/Metadata/General/DocAuthor") + "")
        var custom = trim(getValue(doc, "/doc/dbMetadata/Metadata/General/Custom_by-line")) ;
        custom = custom.replace("Propos recueillis par", "") ;
        custom = custom.replace("PROPOS RECUEILLIS PAR", "") ;

        custom = WordUtils.capitalize(custom) + "" ;
        custom = custom.replace(" Et ", " et ").replace(" ET ", " et ") ;

        var auteur = custom.split(" et ") ;
        for(var i in auteur){
            auteurs.appendChild(createTag("AUTEUR", auteur[i]));
        }
        article.appendChild(auteurs);

        article.appendChild(createTexteTag(doc));

        var annexes = new Element("ANNEXES");
        article.appendChild(annexes) ;

        var encadres = new Element("ENCADRES");
        article.appendChild(encadres) ;

        var visuels = new Element("VISUELS");
        article.appendChild(visuels) ;

        var infographies = new Element("INFOGRAPHIES");
        article.appendChild(infographies) ;

        var srcDir = DATA_DIRNAME ;
        var dstDir = OUTPUT_DIRNAME ;

        var pdfs = new Element("PDFS");
        pdfs.appendChild(createTag("PDF", physPage.trgPath));
        article.appendChild(pdfs) ;

        // Copy Media
        writeMedias(mediaNodes, visuels, infographies, storyFile, srcDir, dstDir) ;
      
        var file = new File(dstDir, storyFile.getName()) ;
        _print("Writing Story: " + file );
        var os = new FileOutputStream(file) ;
        var serializer = new Serializer(os, "UTF-8");
        serializer.setIndent(3);
        serializer.setMaxLength(80);
        serializer.write(new Document(article));
        os.close() ;

        //_print("Deleting: " + storyFile );
        FileUtils.forceDelete(storyFile);
    }
}

function createTexteTag(doc){

    var nodes = doc.query("/doc/article/texte/descendant-or-self::* | /doc/article/tables/descendant-or-self::*") ;
    for(var i=0; i<nodes.size(); i++) {
        var node = nodes.get(i) ;
        if ( node.getChildCount() > 0 ) {
            var tag = node.getLocalName().toLowerCase() ;
            if ( tag == "tables" ) node.setLocalName("TEXTE") ;
            else if ( tag == "texte" ) node.setLocalName("TEXTE") ;
            else if ( tag == "intertitre" ) node.setLocalName("INTERTITRE") ;
            // else if ( tag == "correspondant" ) insertNode(node, "P", "B") ;
            else if ( tag == "correspondant" ) node.setLocalName("B") ;
            else if ( tag == "question" ) {
                node.setLocalName("P") ;
                node.addAttribute(new Attribute("type", "QUESTION"))
            }
            else if ( tag == "signature" ) node.setLocalName("I") ;
            else {
                node.setLocalName("P") ;
            }
        }
        else {
            node.detach() ;
        }
    }
    
    var textNode = new Element("TEXTE") ;
    nodes = doc.query("/doc/article/TEXTE/*") ;
    for(i=0; i<nodes.size(); i++) {
        node = nodes.get(i) ;
        if ( node.getChildCount() > 0 ) {
            node.detach() ;
            textNode.appendChild(node) ;
        }
    }
    return textNode ;
}

function insertNode(node, newTag, newName) {
    var newNode = new Element(newTag) ;
    node.getParent().replaceChild(node, newNode) ;
    newNode.appendChild(node) ;
    node.setLocalName(newName) ;
}

// List all photos and infographies
function writeMedias(mediaNodes, visuels, infographies, storyFile, srcDir, dstDir) {

    if ( mediaNodes.size() == 0 ) return ;

    var mediaNode = mediaNodes.get(0) ;
    var photoNodes = mediaNode.query("photo") ;
    var legendeNodes = mediaNode.query("legende") ;
    var jpgCount = 0 ;
    var pdfCount = 0 ;

    for (var i = 0; i < photoNodes.size(); i++) {
        var photoNode = photoNodes.get(i) ;
        var legendeNode = (i<legendeNodes.size()) ? legendeNodes.get(i) : null ;

        var srcFile = new File(srcDir + photoNode.getValue()) ;
        var ext = FilenameUtils.getExtension(srcFile.getName()) ;
        if ( ext.toLowerCase() == "pdf" ) {
            processImagePdf(storyFile, srcFile, (++jpgCount), dstDir, infographies, legendeNode) ;
        }
        else {
            processImageJpeg(storyFile, srcFile, (++pdfCount), dstDir, visuels, legendeNode)
        }
    }
}

// Write the infographie in the xml and convert to lower resolution JPEG
function processImagePdf(storyFile, srcFile, count, dstDir, infographies, legendeNode) {

    var basename = FilenameUtils.getBaseName(storyFile.getName()).substr("STORY_".length);
    var filename = "GRAPHIC_" + basename + "_" + count + ".jpg" ;
    var dstFile = new File(dstDir,  filename) ;

    if ( srcFile.exists() && srcFile.isFile() ) {
        convertPdf(srcFile, dstFile) ;

        if ( dstFile.exists() ) {
            var infographie = new Element("INFOGRAPHIE");
            infographie.appendChild(createTag("TITINFOGRAPHIE", ""));
            infographie.appendChild(createTag("NOMINFOGRAPHIE", filename));
            infographie.appendChild(createTag("CREDINFOGRAPHIE", legendeNode == null ? "" : trim(getValue(legendeNode, ".//credit"))));
            infographie.appendChild(createTag("LEGINFOGRAPHIE", legendeNode == null ? "" : trim(legendeNode.getValue())));
            infographies.appendChild(infographie);
        }
        else {
            _print("Unable to convert pdf file: " + srcFile + " (" + storyFile + ")");
        }
    }
    else {
        _print("Unable to read media file: " + srcFile + " (" + storyFile + ")");
    }

}

// Write the photo in the xml and convert to lower resolution JPEG
function processImageJpeg(storyFile, srcFile, count, dstDir, visuels, legendeNode) {

    var basename = FilenameUtils.getBaseName(storyFile.getName()).substr("STORY_".length);
    var filename = "PHOTO_" + basename + "_" + count + ".jpg"  ;
    var dstFile = new File(dstDir, filename) ;

    if ( srcFile.exists() && srcFile.isFile() ) {
        convertImage(srcFile, dstFile) ;

        if ( dstFile.exists() ) {
            var visuel = new Element("VISUEL");
            visuel.appendChild(createTag("TITVISUEL", ""));
            visuel.appendChild(createTag("NOMVISUEL", filename));
            visuel.appendChild(createTag("CREDVISUEL", legendeNode == null ? "" : trim(getValue(legendeNode, ".//credit"))));
            visuel.appendChild(createTag("LEGVISUEL", legendeNode == null ? "" : trim(legendeNode.getValue())));
            visuels.appendChild(visuel);
        }
        else {
            _print("Unable to convert image file: " + srcFile + " (" + storyFile + ")");
        }
    }
    else {
        _print("Unable to read media file: " + srcFile + " (" + storyFile + ")");
    }
}

// Resize Image with Ghostscript
function convertPdf(srcFile, dstFile)  {
    if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;

    var tmpFile = File.createTempFile("page_", ".jpg") ;
    tmpFile.deleteOnExit() ;

    var exe = "C:/Program Files/gs/gs9.04/bin/gswin32c.exe -q -dNOPROMPT -dBATCH -dNOPAUSE -dUseCIEColor -sDEVICE=jpeg -dJPEGQ=85 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r180 -o " ;
    var pdf = tmpFile.getPath() + " " + srcFile.getPath()  + "" ;

    // TMP JPEG
    _print("Converting PDF: " + srcFile.getName()) ;
    _execFor(exe + pdf, dstFile.getParent(), 90000) ;

    if ( tmpFile.exists() ) {
        exe = "ext/windows/imagemagick/convert.exe " + tmpFile.getPath() + " -resize " + REL_SIZE + "x" + REL_SIZE + "> " + dstFile.getPath() ;
        _execFor(exe, dstFile.getParent(), 30000) ;
        FileUtils.deleteQuietly(tmpFile) ;
    }
}

// Resize Image with Image Magick
function convertImage(srcFile, dstFile)  {
    if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;

    _print("Converting Image: " + srcFile.getName() + " to " + dstFile) ;
    var exe = "ext/windows/imagemagick/convert.exe -strip " + srcFile.getPath() + " -resize " + REL_SIZE + "x" + REL_SIZE + "> " + dstFile.getPath() ;
    _execFor(exe, dstFile.getParent(), 30000) ; // creates also parent directory
    FileUtils.forceDelete(srcFile) ;
}

// Exec GS interpreter
function convertPage(srcFile, dstFile)  {
    _print("Converting Page: " + srcFile.getName() + " to " + dstFile) ;
    var exe = "C:/Program Files/gs/gs9.04/bin/gswin32c.exe -q -dNOPROMPT -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -dPDFSETTINGS=/screen -dCompatibilityLevel=1.4 -dAutoRotatePages=/None -dGraphicsAlphaBits=4 -o " ;
    var pdf = dstFile.getName() + " " + srcFile.getPath() ;
// SH le 29/12/2011 suite blocage taritement fichier pdf (ancienne valeur 90000)
	_execFor(exe + pdf, dstFile.getParent(), 300000) ; // creates also parent directory
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
    
    var dstDir = OUTPUT_DIRNAME + "/divers/" ;
    var dstFile = new File(dstDir, mediaFile.getName()) ;
    _print("Copying Media: " + mediaFile.getName() + " to " + dstFile);
    if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
    FileUtils.moveFile(mediaFile, dstFile) ;
}

function nonNull(value) {
    return ( value == null ) ? "" : value ;
}

// 27/09/2010 => // 20100927
function getInvertedDate(date) {
    return date.substr(6,4) + date.substr(3,2) + date.substr(0,2) ;
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

// Main
function main() {
    _print("Starting Process");

    extractZip() ;

    var pages = getAllPages() ;
    processPages(pages) ;
    processStories(pages) ;
    // processMedias(pages) ;
    _print("Compressing...");
    compressZip() ;

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

