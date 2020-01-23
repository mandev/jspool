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
importPackage(Packages.nu.xom);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.pdftool.filters);
importPackage(Packages.com.adlitteram.pdftool.utils);
importPackage(Packages.com.adlitteram.jspool);

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Globals
var ERROR_DIR = "D:/spool/sorties/page/erreur";
var PAGIN_DIR = "D:/spool/sorties/page/config";
var PAGIN_NAME = "pagin_ctde.xml";
var OUTPUT_DIRS = ["D:/spool/sorties/page/sortie"];
var JPG_OUTPUT_DIRS = ["D:/spool/sorties/page/suivi"];

// Duplicate the pages depending on the plateNodes
function duplicatePages(plateNodes, file, jpgfile, pageNum) {

    for (var i = 0; i < plateNodes.size(); i++) {
        var plateNode = plateNodes.get(i);

        var platesNode = plateNode.getParent();
        var pageSize = platesNode.query("plate").size() * 2;
        var bookNode = platesNode.getParent();
        var bookId = bookNode.getAttribute("id").getValue();
        var productNode = bookNode.getParent();
        var productId = productNode.getAttribute("id").getValue();
        var parutionNode = productNode.getParent();
        var parutionId = parutionNode.getAttribute("id").getValue();
        var parutionDate = getParutionDate(parutionNode.getAttribute("publicationDate").getValue());

        // PAGE_200509_PAR_AUJ_CNAT_8_32_V1.pdf
        var page = "PAGE_" + parutionDate + "_" + parutionId + "_" + productId + "_" + bookId + "_" + pageNum + "_" + pageSize;

        for (var j in OUTPUT_DIRS) {
            var dstFile = new File(OUTPUT_DIRS[j], page + ".pdf");
            _print("copy " + file.getName() + " to " + dstFile.getPath());
            FileUtils.copyFile(file, dstFile);
        }

        for (var k in JPG_OUTPUT_DIRS) {
            var dstJpgFile = new File(JPG_OUTPUT_DIRS[k], page + ".jpg");
            _print("copy " + jpgfile.getName() + " to " + dstJpgFile.getPath());
            FileUtils.copyFile(jpgfile, dstJpgFile);
        }
    }
}

// Convert PDF File to Jpeg
function convertToJpeg(srcFile, dstFile) {
    _print("convertToJpeg");

    var exe = "C:/Program Files/gs/gs9.16/bin/gswin64c.exe ";
    var opt = "-q -dNOPROMPT -dBATCH -dNOPAUSE -dUseCIEColor -sDEVICE=jpeg -dJPEGQ=85 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r133 -o ";
    var pdf = dstFile.getName() + " " + srcFile.getPath() + "";

    _print("Launching " + exe + opt + pdf);
    _exec2(exe + opt + pdf, dstFile.getParent(), true, 300000); // creates also parent directory
}

// Format the date to DDMMYY
function getParutionDate(str) {
    var tokens = str.split("/");

    var day = tokens[0];
    if (day.length == 1)
        day = "0" + day;

    var month = tokens[1];
    if (month.length == 1)
        month = "0" + month;

    var year = tokens[2] + "";
    if (year.length == 4)
        year = year.substr(2, 2);

    return day + "" + month + "" + year;
}

// Process the PDF plates
function processPdf(file) {
    _print("processPdf starting");

    var pagename = _srcFile.getName();
    var index = pagename.toUpperCase().lastIndexOf("_P");
    if (index < 0) {
        _print("Le nom du fichier " + pagename + " ne comporte pas de numero de page.");
        copyToError(file, _srcFile.getName());
    }
    
    var index1 = pagename.toUpperCase().lastIndexOf("_V");
    if (index1 < 0) {
        _print("Le nom du fichier " + pagename + " ne comporte pas de numero de version.");
        copyToError(file, _srcFile.getName());
    }
    
    var pageNum = pagename.substring(index + 2, index1);
    _print("pageNum : " + pageNum);

    var parutionDate = pagename.substring(5, 11);
    var paginFile = new File(PAGIN_DIR, parutionDate + "_" + PAGIN_NAME);
    if (paginFile.exists()) {
        _print("Parsing pagin.xml");
        var builder = new Builder();
        var doc = builder.build(paginFile);
        var plateNodes = doc.query("/parution/product/book/plates/plate[@pageL='" + pagename.substring(0, index1) + "' or @pageR='" + pagename.substring(0, index1) + "']");
        _print("plateNodes.size() : " + plateNodes.size());

        if (plateNodes.size() > 0) {
            var jpgfile = File.createTempFile("page_", ".jpg");
            jpgfile.deleteOnExit();
            convertToJpeg(file, jpgfile);
            duplicatePages(plateNodes, file, jpgfile, pageNum);
            FileUtils.deleteQuietly(jpgfile);

        } else {
            _print("La page " + pagename + " n'existe pas dans le fichier de pagination " + paginFile.getName());
            copyToError(file, _srcFile.getName());
        }
    } else {
        _print("Le fichier de pagination " + paginFile.getName() + " n'existe pas");
        copyToError(file, _srcFile.getName());
    }
    _print("processPdf done");
}

function copyToError(file, filename) {
    var dstFile = new File(ERROR_DIR, filename);
    _print("copie : " + filename + " vers " + dstFile.getPath());
    FileUtils.copyFile(file, dstFile);
}

// Main
function main() {
    processPdf(_srcFile.getFile());
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


