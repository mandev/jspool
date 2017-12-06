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
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.apache.commons.lang) ;
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.org.jsoup) ;
importPackage(Packages.org.jsoup.nodes) ;
importPackage(Packages.org.jsoup.parser) ;
importPackage(Packages.org.jsoup.select) ;
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// TODO :
// gestion couleur (analyser le jpeg)
// ajouter les liens textes
// rechercher les texte et les nettoyer

var DXA_DIR = "D:/tmp/ed2/";
var OUT_DIR = "D:/tmp/ed3/";
var ZIP_DIR ;

GS_EXE = "C:/Program Files/gs/gs9.06/bin/gswin64c.exe" ;
//GS_EXE = "C:/Program Files/gs/gs9.06/bin/gswin32c.exe" ;
CONVERT_EXE = "ext/windows/imagemagick/convert.exe" ;

var MAX_SIZE = 3000 ;  // Pixels
var REL_SIZE = 3000 ;
var PREVIEW_SIZE = 768;
var THUMB_SIZE = 192 ;
var XOM = ScriptUtils.createXomBuilder(false, false) ;

// Zip archive
function buildZip() {  
    _print("Building Zip file");
    var ZIP_FILE = new File(OUTPUT_DIR + "PQLP" + getToday() + "V2_0.zip") ;
    _print("OUT_DIR: " + OUT_DIR  + " - ZIP_FILE: " + ZIP_FILE);

    if ( ZIP_FILE.exists() ) FileUtils.forceDelete(ZIP_FILE) ;
    ScriptUtils.zipDirToFile(OUT_DIR, ZIP_FILE) ;
    
    _print("Building Zip file done");
}

// Process directory
function processDaxdm() {
    _print("Processing Directory");

    var rxp = new RegExp("\\d\\d", "") ;
    var yearNames = new File(DXA_DIR).list() ;

    for(var i in yearNames ) {
        if ( yearNames[i].match(rxp) ) {
            YEAR = yearNames[i] ;
            _print("YEAR: " + YEAR);
            var yearDir = new File(DXA_DIR + YEAR) ;
            var monthNames = yearDir.list() ;
            
            for(var j in monthNames ) {
                MONTH = monthNames[j] ;
                _print("MONTH: " + MONTH);
                var monthDir = new File(yearDir, MONTH) ;
                var dayNames = monthDir.list() ;

                for(var k in dayNames ) {
                    DAY = dayNames[k] ;
                    _print("DAY: " + DAY);
                    var dayDir = new File(monthDir, DAY) ;
                    processDay(dayDir) ;
                }
            }
        }
        else {
            _print("processDir() - not valid year: " +  yearNames[i]);
        }
    }  
}

function processDay(dayDir) {
    _print("processDay starting");

    var index1File = new File(dayDir, "index1.html") ;
    if ( ! index1File.exists() ) {
        _print("processDay - " + index1File + " does no exist");
        return ;
    } 

    var prefix = ( YEAR.substr(0,1) == "9" ) ? "19" : "20" ; 
    
    INVDATE = prefix + YEAR + "" + MONTH + "" + DAY  ;
    ZIP_DIR = OUT_DIR + INVDATE + "/" ;
    FileUtils.forceMkdir(new File(ZIP_DIR)) ;

    var jsoupDoc = Jsoup.parse(index1File, "ISO-8859-1");

    var imgs = jsoupDoc.select("IMG[SRC$=.gif]").toArray();
    for (var i in imgs) {
        var img = imgs[i] ;
        var link = img.parent();
        var linkHref = link.attr("HREF");
        var imgSrc = img.attr("SRC");
        var imgAlt = img.attr("ALT");
        //_print("processDay - linkHref: " + linkHref + " - imgSrc: " + imgSrc + " - imgAlt: " + imgAlt);

        var pdfName = FilenameUtils.getBaseName(imgSrc) + ".pdf" ; // SRC="/98/01/03/1194765_779.gif"
        var htmIndex = linkHref.split('_')[1].split('\\.')[0] ; // HREF=frame_4.htm 
        var pageNum = imgAlt.split(' ')[1] ; // ALT="Page 3"
        //_print("processDay - htmIndex: " + htmIndex + " - pdfName: " + pdfName + " - pageNum: " + pageNum);

        processPage(dayDir, pdfName, htmIndex, pageNum)
    }
    
    _print("processDay done");
}

function processPage(dayDir, pdfName, htmIndex, pageNum) {
    //_print("processPage: " + pdfName);
        
    var idxFile = new File(dayDir, "idx_" + htmIndex + ".htm") ;
    var jsoupDoc = Jsoup.parse(idxFile, "ISO-8859-1");
    
    var title = jsoupDoc.getElementsByTag("TITLE").toArray()[0].ownText();
    title = title.split(' ')[1].split('_')[0] ;
    //_print("processPage - title: " + title);
    var pageMeta = getPageMeta(title) ;
    
    var objlinks = [] ;
    var links = jsoupDoc.select("A[HREF]").toArray();
    for (var i in links) {
        var link = links[i] ;
        var linkHref = link.attr("HREF");
        objlinks.push(linkHref.split('#')[1]) ;
    }
    
    var loid = FilenameUtils.getBaseName(pdfName) ;
    
    var pageElement = new Packages.nu.xom.Element("page");
    var metaElement = createElement("metadata");
    pageElement.appendChild(metaElement) ;
    
    // Base Meta
    metaElement.appendChild(createElement("source", "LEPARISIEN/DXADM")) ;
    metaElement.appendChild(createElement("extRef", loid)) ;  
    metaElement.appendChild(createElement("issueDate", INVDATE)) ;
    metaElement.appendChild(createElement("permission", 0)) ;

    // Extra meta
    metaElement.appendChild(createElement("product", "LP")) ;
    metaElement.appendChild(createElement("book", pageMeta.book)) ;
    metaElement.appendChild(createElement("pn", pageNum)) ;
    metaElement.appendChild(createElement("sequence", pageNum)) ;
    metaElement.appendChild(createElement("color", "cmyk")) ;

    var edis = pageMeta.edition.split(',');
    var editions = createElement("editions") ;
    for (var i in edis ) {
        //_print("processPage - title: " + edis[i]);
        editions.appendChild(createElement("edition", edis[i])) ;
    }
    metaElement.appendChild(editions) ;

    var categories = createElement("categories") ;
    categories.appendChild(createElement("category", pageMeta.category)) ;
    metaElement.appendChild(categories) ;

    // On ajoute les items
    var objectLinks = createElement("objectLinks") ;
    for(var i in objlinks) {
        var objectLink = createElement("objectLink") ;
        objectLink.addAttribute(createAttribute("linkType", "story")) ;
        objectLink.addAttribute(createAttribute("extRef", FilenameUtils.getBaseName(objlinks[i]))) ;
        objectLinks.appendChild(objectLink) ;
    }
    metaElement.appendChild(objectLinks) ;
    
    var virtPages = pageMeta.virtPage.split(',');
    if ( virtPages.length > 1 ) {
        var virtBooks = pageMeta.virtBook.split(',');
        var virtualPagesElement = createElement("virtualPages");
        for (var i in virtPages ) {
            var virtualPageElement = createElement("virtualPage") ;
            virtualPageElement.addAttribute(createAttribute("product", "LP")) ;
            virtualPageElement.addAttribute(createAttribute("edition", virtPages[i])) ;
            virtualPageElement.addAttribute(createAttribute("book", virtBooks[i])) ;
            virtualPageElement.addAttribute(createAttribute("pn", pageNum)) ;
            virtualPageElement.addAttribute(createAttribute("sequence", pageNum)) ;
            virtualPageElement.addAttribute(createAttribute("color", "cmyk")) ;
            virtualPagesElement.appendChild(virtualPageElement);
        }
        metaElement.appendChild(virtualPagesElement);
    }

    var contentElement = createElement("content");
    pageElement.appendChild(contentElement) ;

    // Write PDF & JPEG
    var dstPath = ZIP_DIR + "page/" + loid   ;
    var pdfSrcFile = new File(dayDir, pdfName) ;
    if ( pdfSrcFile.exists() ) {
        var pdfDstFile = new File(dstPath + ".pdf") ;
        var previewFile = new File(dstPath + "_preview.jpg") ;
        var thumbFile = new File(dstPath + "_thumb.jpg") ;
        contentElement.appendChild(createElement("uri", pdfDstFile.getName())) ;
        contentElement.appendChild(createElement("uri", previewFile.getName())) ;
        contentElement.appendChild(createElement("uri", thumbFile.getName())) ;
        convertPdf(pdfSrcFile, pdfDstFile, previewFile, thumbFile, 20) ;
    }
    else {
        _print("Le fichier PDF " + pdfSrcFile + " n'existe pas!");
    }
  
    processStory(dayDir, objlinks) ;

    // Write Page
    var dstFile = new File(dstPath + ".xml") ;
    writeElement(pageElement, dstFile) ;
}

function processStory(dayDir, objlinks) {

    for(var i in objlinks) {
        var link = objlinks[i] ;
        var storyFile = new File(dayDir, link) ;

        // Clean file
        var content = FileUtils.readFileToString(storyFile, "ISO-8859-1") + "" ;
        content = content.replace(/\n/g, " ");
        content = content.replace(/<H1>|<H2>|<H3>|<H4>|<OT_RES>/gi, "");
        content = content.replace(/<\/H1>|<\/H2>|<\/H3>|<\/H4>|<\/OT_RES>/gi, "");
        content = content.replace(/<TR>|<TD>|<TBODY>/gi, "");
        content = content.replace(/<\/TR>|<\/TD>|<\/TBODY>/gi, "");
        content = content.replace(/<IMG SRC="\/logos\/bluesq.gif">/gi, "");
        content = content.replace(/<IMG SRC="\/logos\/redsq.gif">/gi, "<p>");
        content = content.replace(/&nbsp;&nbsp;|&nbsp;/g, " ");
        content = content.replace(/&nbsp;&nbsp;|&nbsp;/g, " ");
        content = content.replace(/&nbsp;&nbsp;|&nbsp;/g, " ");
        
        var dstPath = ZIP_DIR + "story/" + link   ;
        //var jsoupDoc = Jsoup.parse(storyFile, "ISO-8859-1");
        var jsoupDoc = Jsoup.parse(content);
        //FileUtils.write(new File(dstPath + ".new"), jsoupDoc.outerHtml(), "UTF-8") ; 
        FileUtils.copyFile(storyFile, new File(dstPath)) ; 
    
        // ot_somm_sur => heading
        // ot_somm_titre =>  title
        // ot_somm_sous =>  subtitle
        // ot_somm_chapeau => lead
        // ot_somm_ville => description
        // center => subheading
        // ot_somm_auteur => signature

        var storyElement = new Packages.nu.xom.Element("story");
        var contentElement = createElement("content");
        storyElement.appendChild(contentElement) ;

        var body = jsoupDoc.select("body").first();
        if ( body != null ) {

            var textNodes = body.textNodes() ;
            for(var m=0; m< textNodes.size(); m++) {
                var textNode = textNodes.get(m) ;
                var e = new Packages.org.jsoup.nodes.Element(Tag.valueOf("p"), body.baseUri()) ;
                e.appendText(textNode.text()) ;
                textNode.replaceWith(e)
            }
  
            body.select("ot_journal").remove() ; 
            body.select("ot_cahier").remove() ; 
            body.select("ot_zone").remove() ; 
            body.select("ot_commune").remove() ; 
            body.select("ot_somm_ville").remove() ; 
            body.select("ot_ville").remove() ; 
            body.select("ot_titre").remove() ; 
            body.select("ot_page").remove() ; 
            body.select("ot_image").remove() ; 
            body.select("ot_date").remove() ; 
            body.select("a").remove() ; 
            body.select("img").remove() ; 
            body.select("br").remove() ; 
            
            body.select("table").tagName("p") ; 
            body.select("center").tagName("subheading") ; 
            body.select("ot_somm_auteur").tagName("signature") ; 
            
            body.select("ot_sig").unwrap() ; 
            body.select("ot_som").unwrap() ; 
            //body.getElementsMatchingText("^$").remove() ;

            // Nécessaire pour conserver l'ordre
            addNode(body, "ot_somm_sur", "heading", contentElement) ;
            addNode(body, "ot_somm_titre", "title", contentElement) ;
            addNode(body, "ot_somm_sous", "subtitle", contentElement) ;
            addNode(body, "ot_somm_chapeau", "lead", contentElement) ;

            var tags = body.getAllElements().toArray() ;
            for(var k in tags) {
                var tag = tags[k] ;
                var name = tag.tagName() ;
                if ( name == "ot_journal" || name == "ot_cahier" || name == "ot_zone" ||
                    name == "ot_commune" || name == "ot_somm_ville" || name == "ot_ville" ||
                    name == "ot_titre" || name == "ot_page" || name == "ot_image" ||
                    name == "ot_date" || name == "a" || name == "img" || name == "br" ||
                    name == "ot_sig" || name == "ot_som" || name == "body" || name == "p"  || name == "i" || 
                    name == "ot_somm_sur" || name == "ot_somm_titre" || name == "subtitle" || 
                    name == "ot_somm_chapeau" || name == "b" || name == "subheading" || name == "signature"  ) {
                }
                else {
                    _print("tag inconnu: " + name) ;
                    tag.unwrap() ;
                }
            }

            tags = body.getElementsByTag("b").toArray() ;
            for(var k in tags) {
                var tag = tags[k] ;
                if ( tag.parent().tagName() == "body" ) tag.wrap("<p>") ;  
            }            

            //body.getElementsMatchingText("^$").remove() ;

            // StringEscapeUtils
            var innerHtml = Parser.unescapeEntities(body.html(), false) + ""  ;
            innerHtml = innerHtml.replace(/\n/g, " ");
            innerHtml = innerHtml.replace(/&/g, "&amp;");
            innerHtml = innerHtml.replace(/'/g, "&apos;");
            innerHtml = innerHtml.replace(/""/g, "&quot;");
            innerHtml = innerHtml.replace(/      |     |    |   |  /g, " ");
            innerHtml = innerHtml.replace(/      |     |    |   |  /g, " ");
            innerHtml = innerHtml.replace(/      |     |    |   |  /g, " ");
            innerHtml = innerHtml.replace(/<p> /g, "<p>");
            innerHtml = innerHtml.replace(/<b> /g, "<b>");
            innerHtml = innerHtml.replace(/<i> /g, "<i>");
            innerHtml = innerHtml.replace(/<signature> /g, "<signature>");
            innerHtml = innerHtml.replace(/<subheading> /g, "<subheading>");
            innerHtml = innerHtml.replace(/ <\/p>/g, "</p>");
            innerHtml = innerHtml.replace(/ <\/b>/g, "</b>");
            innerHtml = innerHtml.replace(/ <\/i>/g, "</i>");
            innerHtml = innerHtml.replace(/ <\/signature>/g, "</signature>");
            innerHtml = innerHtml.replace(/ <\/subheading>/g, "</subheading>");
            
            var textElement = createElement("text") ;
            var doc = XOM.build(new StringReader("<root>" + innerHtml + "</root>"));
            var root = doc.getRootElement() ; 
            var elements = root.getChildElements() ;
            for(var j=0; j< elements.size(); j++) {
                var node = elements.get(j) ;
                node.detach() ;
                if ( j == 0 && node.getLocalName() != "p" && node.getLocalName() != "subheading" ) {
                    if ( node.getValue().trim().length() > 0 ) {
                        var p = createElement("p") ;
                        p.appendChild(node) ;
                        textElement.appendChild(p) ;
                    }
                }
                else if ( node.getValue().trim().length() > 0 ) {
                    textElement.appendChild(node) ;
                }
            }
            
            contentElement.appendChild(textElement) ;

            // Write Story
            var dstFile = new File(dstPath + ".xml") ;
            writeElement(storyElement, dstFile) ;
        }
        else {
            _print("Le tag body n'existe pas dans le fichier!");
        }
    }

// "heading" "title" "subtitle" "lead" "description"
// "table" 
// "text" "subheading" "note" "b" "i" "u" "a" "p" "signature" "sup"

}

function addNode(body, sel, elt, content) {
    var nodes = body.select(sel) ; 
    var headingElement = createElement(elt, nodes.text());
    content.appendChild(headingElement) ;
    nodes.remove() ;
}

function getPageMeta(title) {
    var pageMeta = {} ;
    
    if ( title == "DIV" ) {
        pageMeta.category = "Les Faits Divers" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "ECO" ) {
        pageMeta.category = "Votre Economie" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "FAIT" ) {
        pageMeta.category = "Le Fait du Jour" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "POL" ) {
        pageMeta.category = "La Politique" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "PUNE" || title == "UNE") {
        pageMeta.category = "A la Une" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "FRANCE" ) {
        pageMeta.category = "France" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "HIP" ) {
        pageMeta.category = "Les Courses" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "SPEC" ) {
        pageMeta.category = "Les Spectacles" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "SPO" ) {
        pageMeta.category = "Les Sports" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "TV" ) {
        pageMeta.category = "La Télévision" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "VIE" ) {
        pageMeta.category = "Vivre Mieux" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "JEUX" ) {
        pageMeta.category = "L'Horoscope et les Jeux" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "SPORTSREG" ) {
        pageMeta.category = "Les Sports Régionaux" ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }
    else if  ( title == "OISE60C" || title == "OISE60S" ) {
        pageMeta.category = "Oise" ;
        pageMeta.edition = "PAR60" ;
        pageMeta.book = "E60" ;
        pageMeta.virtPage = "" ;
        pageMeta.virtBook = "" ;
    }
    else if  ( title == "PARIS" ) {
        pageMeta.category = "Paris" ;
        pageMeta.edition = "PAR75" ;
        pageMeta.book = "E75" ;
        pageMeta.virtPage = "" ;
        pageMeta.virtBook = "" ;
    }
    else if  ( title == "MARNENORD" ) {
        pageMeta.category = "Seine et Marne Nord" ;
        pageMeta.edition = "PAR7N" ;
        pageMeta.book = "E7N" ;
        pageMeta.virtPage = "" ;
        pageMeta.virtBook = "" ;
    }
    else if  ( title == "MARNESUD" ) {
        pageMeta.category = "Seine et Marne Sud" ;
        pageMeta.edition = "PAR7S" ;
        pageMeta.book = "E7S" ;
        pageMeta.virtPage = "" ;
        pageMeta.virtBook = "" ;
    }
    else if  ( title == "YVELINES" ) {
        pageMeta.category = "Yvelines" ;
        pageMeta.edition = "PAR78" ;
        pageMeta.book = "E78" ;
        pageMeta.virtPage = "" ;
        pageMeta.virtBook = "" ;
    }
    else if  ( title == "ESSONNE" ) {
        pageMeta.category = "Essonne" ;
        pageMeta.edition = "PAR91" ;
        pageMeta.book = "E91" ;
        pageMeta.virtPage = "" ;
        pageMeta.virtBook = "" ;
    }
    else if  ( title == "HAUTSSEINE" ) {
        pageMeta.category = "Hauts de Seine" ;
        pageMeta.edition = "PAR92" ;
        pageMeta.book = "E92" ;
        pageMeta.virtPage = "" ;
        pageMeta.virtBook = "" ;
    }
    else if  ( title == "SEINEDENIS" ) {
        pageMeta.category = "Seine Saint-Denis" ;
        pageMeta.edition = "PAR93" ;
        pageMeta.book = "E93" ;
        pageMeta.virtPage = "" ;
        pageMeta.virtBook = "" ;
    }
    else if  ( title == "VALDEMARNE" ) {
        pageMeta.category = "Val-de-Marne" ;
        pageMeta.edition = "PAR94" ;
        pageMeta.book = "E94" ;
        pageMeta.virtPage = "" ;
        pageMeta.virtBook = "" ;
    }
    else if  ( title == "VALDOISE" ) {
        pageMeta.category = "Val-d'Oise" ;
        pageMeta.edition = "PAR95" ;
        pageMeta.book = "E95" ;
        pageMeta.virtPage = "" ;
        pageMeta.virtBook = "" ;
    }
    else {
        _print("Title inconnu: " + title);
        pageMeta.category = title ;
        pageMeta.edition = "PAR60,PAR75,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.book = "T75" ;
        pageMeta.virtPage = "PAR60,PAR7S,PAR7N,PAR78,PAR91,PAR92,PAR93,PAR94,PAR95" ;
        pageMeta.virtBook = "T60,T7S,T7N,T78,T91,T92,T93,T94,T95" ;
    }

    return pageMeta ;
}

// Write Element
function writeElement(element, dstFile) {
    //_print("Writing Element to  XML: " + dstFile );
    if ( dstFile.exists() ) FileUtils.forceDelete(dstFile) ;
    if ( !dstFile.getParentFile().exists() ) FileUtils.forceMkdir(dstFile.getParentFile()) ;
    var os = new BufferedOutputStream(new FileOutputStream(dstFile)) ;
    var serializer = new Serializer(os, "UTF-8");
    serializer.setIndent(3);
    serializer.write(new Packages.nu.xom.Document(element));
    os.close() ;
}

function convertPdf(srcFile, dstFile, previewFile, thumbFile, res)  {
    return ;
    
    if ( dstFile.exists() || previewFile.exists() || thumbFile.exists() ) {
        _print("convertPdf: traitement en cours") ;
        return ;
    }

    var tmpFile = File.createTempFile("page_", ".jpg") ;
    tmpFile.deleteOnExit() ;

    // TMP JPEG
    var opt = [ "-q", "-dNOPROMPT", "-dBATCH", "-dNOPAUSE", "-dUseCIEColor", "-sDEVICE=jpeg",
    "-dJPEGQ=85", "-dTextAlphaBits=4", "-dGraphicsAlphaBits=4", "-r180", "-o", 
    tmpFile.getPath(), srcFile.getPath() ] ;
    _print("Launching " + GS_EXE + " " + opt + " dir: " + dstFile.getParent()) ;
    _exec(GS_EXE, opt, dstFile.getParent(), 300000) ; // creates also parent directory

    // PREVIEW
    if ( tmpFile.exists() ) {
        opt = [ tmpFile.getPath(), "-resize", PREVIEW_SIZE + "x" + PREVIEW_SIZE +">", previewFile.getPath()] ;
        _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent()) ;
        _exec(CONVERT_EXE, opt, dstFile.getParent(), 300000) ; // creates also parent directory
    }

    // THUMB
    if ( previewFile.exists() ) {
        opt = [ previewFile.getPath(), "-resize", THUMB_SIZE + "x" + THUMB_SIZE +">", thumbFile.getPath()] ;
        _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent()) ;
        _exec(CONVERT_EXE, opt, dstFile.getParent(), 300000) ; // creates also parent directory
    }

    FileUtils.deleteQuietly(tmpFile) ;
    FileUtils.copyFile(srcFile, dstFile) ;
}

// Create <tag> value </tag>
function createElement(tag, value) {
    var element = new Packages.nu.xom.Element(tag) ;
    if( !(typeof value == 'undefined') ) element.appendChild(value);
    return element ;
}


function createAttribute(tag, value) {
    return new Packages.nu.xom.Attribute(tag, value);
}


// Main
function main() {
 
    processDaxdm() ;

    return _OK ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    //FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, _srcFile.getName())) ;
    _exit = _FAIL;
}
