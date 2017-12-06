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
importPackage(Packages.java.util);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.lang);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.pdftool.filters);
importPackage(Packages.com.adlitteram.pdftool.utils);
importPackage(Packages.nu.xom);

// Chemin de fer : LeParisien_2015-11-25.xml.ctde
// <plates publicationDate="25/11/2015">
//   <plate name="251115_PAR_ROUGH_CR_P01" pageL="page_251115_PAR_ROUGH_CR_P08" pageR="page_251115_PAR_ROUGH_CR_P01"/>
// 
// Les sorties sont déjà configurées au niveau page : le préfixe PAGE_ a été rajouté au nom actuel :
// PAGE_{issueDate:$d2$m2$y2}_PAR_{edition}_{book}_P{pn}_V{outputVersion}.pdf
// PAGE_{issueDate:$d2$m2$y2}_PAR_{edition}_{book}_DBL_P{pn}_V{outputVersion}.pdf
// ex. PAGE_250215_PAR_PAR75_T75_P07_V3.pdf

OUTPUT_DIRS = ["D:/METHODE/PROD/pairing/plates1", "D:/METHODE/PROD/pairing/plates2"];
STAGE_DIR = "D:/METHODE/PROD/pairing/stage/";
PAIR_DIR = "D:/METHODE/PROD/pairing/config/";
ERROR_DIR = "D:/METHODE/PROD/pairing/error/";

MAIL_SERVER = "10.196.50.5";     // adresse du serveur smtp
MAIL_TO_USER = ["LPA_DSI_Encadr@leparisien.fr"];
MAIL_FROM_USER = "make_plates.js@leparisien.fr";

// ENTREE PAGES:
// Page simple w x h = 280 x 380 (793.7009887695312 x 1077.1650390625)
// Page double w x h = 560 x 380 (1587.4019775390625 x 1077.1650390625) - Inter page 24 mm 
// Margin Left Top Bottom Right  12 13 13 12
// Surface interne : 256 x 354

// SORTIE PLAQUE:
// w x h = 644 x 410 
// Margin Left Top Bottom Right  58.5 30.2 25.8 49.5

// Create and send the email message
function sendMail(toUser, sujet, corps) {
    var email = new HtmlEmail();
    email.setHostName(MAIL_SERVER);
    email.setFrom(MAIL_FROM_USER);
    email.setCharset("UTF-8");
    for (var i in toUser)
        email.addTo(toUser[i]);
    email.setSubject(sujet);
    email.setHtmlMsg(corps);
    email.send();
}

function getFileVersion(filter) {
    var version = -1;
    var re = new RegExp("^" + filter + "_V(\\d+)\\.pdf");
    var files = new File(STAGE_DIR).listFiles();
    for (var i = 0; i < files.length; i++) {
        var name = files[i].getName() + "";
        if (name.match(re)) {
            var v = parseInt(name.replace(re, "$1"), 10);
            if (v > version)
                version = v;
        }
    }
    return version;
}

// Split the plate into 2 pages (mililimeters)
function splitPdfPlate(srcFile, dstFile, left, top, bottom, right) {
    _print("splitPdfPlate starting");
    var pdfTool = new PdfTool();
    pdfTool.addFilter(new CropMargin(dstFile.getPath(), left * NumUtils.MMtoPT, top * NumUtils.MMtoPT, bottom * NumUtils.MMtoPT, right * NumUtils.MMtoPT));
    pdfTool.execute(srcFile);
    //convertToPdf(leftFile)
}

// snum : P03
function getNextPage(snum) {
    var v = parseInt(snum.substr(1), 10) + 1;
    return (v < 10) ? "P0" + v : "P" + v;
}

function doPlate(doc, pname) {
    _print("Looking pair for: " + pname);

    // Check Left Page
    var plateNodes = doc.query("/plates/plate[@pageL='" + pname + "']");
    for (var i = 0; i < plateNodes.size(); i++) {
        var plateNode = plateNodes.get(i);
        createPlate(plateNode.getAttributeValue("name"), pname, plateNode.getAttributeValue("pageR"));
    }

    // Check Right Page
    var plateNodes = doc.query("/plates/plate[@pageR='" + pname + "']");
    for (var i = 0; i < plateNodes.size(); i++) {
        var plateNode = plateNodes.get(i);
        createPlate(plateNode.getAttributeValue("name"), plateNode.getAttributeValue("pageL"), pname);
    }
}

function createPlate(plate, pageL, pageR) {
    _print("createPlate: " + plate + " - " + pageL + " - " + pageR);
    var vl = getFileVersion(pageL);
    if (vl < 0) {
        _print(pageL + " not found");
        return;
    }

    var vr = getFileVersion(pageR);
    if (vr < 0) {
        _print(pageR + " not found");
        return;
    }

    var vp = getFileVersion(plate) + 1 ;
    if ( vp === 0 ) vp = 1 ;
    var plateFile = new File(STAGE_DIR, plate + "_V" + vp + ".pdf");
    var pageLFile = new File(STAGE_DIR, pageL + "_V" + vl + ".pdf");
    var pageRFile = new File(STAGE_DIR, pageR + "_V" + vr + ".pdf");
    _print("impose: " + plateFile.getName() + " - " + pageLFile.getName() + " - " + pageRFile.getName());


    var impose = new Impose(plateFile.getPath() + "", 644 * NumUtils.MMtoPT, 410 * NumUtils.MMtoPT,
            (58.5 - 12) * NumUtils.MMtoPT, (25.8 - 13) * NumUtils.MMtoPT,
            (58.5 + 256 + 24 - 12) * NumUtils.MMtoPT, (25.8 - 13) * NumUtils.MMtoPT);

    // Desambiguate impose overloading     
    // var impose = new Impose(plateFile.getPath()+"", (278+10) * 2 * NumUtils.MMtoPT, (375+20) * NumUtils.MMtoPT, Impose.SIMPLE);
//    var impose = new Impose["(java.lang.String,float,float,int)"](plateFile.getPath() + "", (278 + 10) * 2 * NumUtils.MMtoPT, (375 + 20) * NumUtils.MMtoPT, Impose.SIMPLE);
//    impose.addPageSlot(new PageSlot(10 * NumUtils.MMtoPT, 10 * NumUtils.MMtoPT, true, 144 * NumUtils.MMtoPT, 10 * NumUtils.MMtoPT, "{FILENAME} - Page {FOLIO}", 10));
//    impose.addPageSlot(new PageSlot((278 + 10) * NumUtils.MMtoPT, 10 * NumUtils.MMtoPT, true, (278 + 10 + 144) * NumUtils.MMtoPT, 10 * NumUtils.MMtoPT, "{FILENAME} - Page {FOLIO}", 10));
    impose.setDeleteSource(false);

    var pdfTool = new PdfTool();
    pdfTool.addFilter(impose);
    pdfTool.execute(pageLFile, pageRFile);

    for (var i in OUTPUT_DIRS) {
        var dstFile = new File(OUTPUT_DIRS[i], plateFile.getName());
        FileUtils.copyFile(plateFile, dstFile);
    }
}

function processXml() {
    _print("processXml: " + _srcFile.getName());

    // PAGE_250215_PAR_PAR75_T75_P07_V3.pdf
    var basename = FilenameUtils.getBaseName(_srcFile.getName());
    var toks = basename.split("_");
    var rdat = toks[1] + "";

    // Chemin de fer : LeParisien_2015-11-25.xml.ctde
    var ctdeName = "LeParisien_20" + rdat.substr(4, 2) + "-" + rdat.substr(2, 2) + "-" + rdat.substr(0, 2) + ".xml.pair";
    var ctdeFile = new File(PAIR_DIR, ctdeName);

    if (ctdeFile.exists()) {
        _print("Pairing Map File: " + ctdeFile.getName());
        var XOM = ScriptUtils.createXomBuilder(false, false);
        var doc = XOM.build(ctdeFile);

        var stageFile = new File(STAGE_DIR, _srcFile.getName());
        var pname = "PAGE_" + rdat + "_PAR_" + toks[3] + "_" + toks[4] + "_" + toks[5];

        // Check if simple or double page
        var dimension = PdfExtractor.getPageSize(_srcFile.getFile(), 1);
        var w = dimension.getWidth();

        if (w < 800) {
            // Copy Simple Page to Staging Dir
            FileUtils.copyFile(_srcFile.getFile(), stageFile);
            doPlate(doc, pname);
        }
        else {
            // Split Double Page into 2 simple Pages to Staging Dir
            splitPdfPlate(_srcFile.getFile(), stageFile, 0, 0, 0, 280);
            doPlate(doc, pname);

            var pname2 = "PAGE_" + rdat + "_PAR_" + toks[3] + "_" + toks[4] + "_" + getNextPage(toks[5]+"");
            var stageFile2 = new File(STAGE_DIR, pname2 + "_" + toks[6] + ".pdf");
            splitPdfPlate(_srcFile.getFile(), stageFile2, 280, 0, 0, 0);
            doPlate(doc, pname2);

            // TODO: avoid to send 2 times a pano by checking the destintaion plate 
        }
    }
    else {
        _print("Error - ctdefile not found : " + ctdeFile);
        // TODO handle error and mail
    }
}

function main() {

    // PAGE_250215_PAR_PAR75_T75_P07_V3.pdf
    var filename = _srcFile.getName();
    var RE = new RegExp("^PAGE_(\\d+)_PAR_(.+)_(.+)_(.+)_V(\\d+)\\.pdf", "");

    if (filename.match(RE)) {
        processXml();
    }
    else {
        _print("Error - bad page file : " + filename);
        FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, _srcFile.getName()));
        sendMail(MAIL_TO_USER, title, "<p>" + corps1 + "</p>" + "<p>" + corps2 + "</p>" + "<p>" + corps3 + "</p>");
        // TODO handle error and mail
    }

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
