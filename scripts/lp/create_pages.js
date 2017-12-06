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
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.adlitteram.pdftool.filters) ;
importPackage(Packages.com.adlitteram.pdftool.utils) ;
importPackage(Packages.com.adlitteram.jspool) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Globals
var ERROR_DIR = "D:/LP/ArrMethode/plaques_erreur" ;
var PAGIN_DIR = "D:/LP/ArrMethode/plaques_config" ;
var SUIVI_DIR = "D:/LP/ArrMethode/pages/suivi" ;
var PORTAIL_DIR = "D:/LP/ArrMethode/pages/portail" ;

var PAGIN_NAME = "pagin_ctde.xml" ;

var OUTPUT_DIRS = [ "D:/LP/ArrMethode/pages/entree" ] ;

var plateJpgFile ;
var leftPdfFile ;
var rightPdfFile ;
var leftJpgFile ;
var rightJpgFile ;

// Resize Image with Image Magick
//function resizeImage(srcFile, dstFile, size)  {
//
//    var exe = "ext/windows/imagemagick/convert.exe " ;
//    var opt = srcFile.getPath() + " -filter Lanczos -resize " + size + "x" + " " + dstFile.getPath() ;
//
//    _print("Launching " + exe + opt) ;
//    _exec2(exe + opt, dstFile.getParent(), true, 30000) ; // creates also parent directory
//}


// Duplicate the pages depending on the plateNodes
function duplicatePages(plateNodes) {

    for (var i=0; i<plateNodes.size(); i++) {
        var plateNode = plateNodes.get(i) ;
        var plateNumber = plateNode.getAttribute("number").getValue();

        var platesNode = plateNode.getParent() ;
        var plateSize = platesNode.query("plate").size();
        var pageSize = plateSize * 2 ;

        var bookNode = platesNode.getParent() ;
        var bookId = bookNode.getAttribute("id").getValue();

        var productNode = bookNode.getParent() ;
        var productId = productNode.getAttribute("id").getValue();

        var parutionNode = productNode.getParent() ;
        var parutionId = parutionNode.getAttribute("id").getValue() ;
        var parutionDate = getParutionDate(parutionNode.getAttribute("publicationDate").getValue()) ;

        // PAGE_200509_PAR_AUJ_CNAT_8_32.pdf
        var p1 = "PAGE_" + parutionDate + "_" + parutionId + "_" + productId + "_" + bookId + "_" + plateNumber + "_" + pageSize  ;
        var p2 = "PAGE_" + parutionDate + "_" + parutionId + "_" + productId + "_" + bookId + "_" + (pageSize-plateNumber+1) + "_" + pageSize ;

        if ( plateNumber % 2 == 0 ) {
        	copyPages(p1, p2) ;
        }
        else {
		copyPages(p2, p1) ;
        }
    }
}

// Copy pages to the output
function copyPages(leftPageName, rightPageName) {

    for (i in OUTPUT_DIRS) {
        var dstFile = new File(OUTPUT_DIRS[i], leftPageName + ".pdf") ;
        _print("copy " + leftPdfFile.getName() + " to " + dstFile.getPath()) ;
        FileUtils.copyFile(leftPdfFile, dstFile) ;

        dstFile = new File(OUTPUT_DIRS[i], leftPageName + ".jpg") ;
        _print("copy " + leftJpgFile.getName() + " to " + dstFile.getPath()) ;
        FileUtils.copyFile(leftJpgFile, dstFile) ;

        dstFile = new File(OUTPUT_DIRS[i], rightPageName + ".pdf") ;
        _print("copy " + rightPdfFile.getName() + " to " + dstFile.getPath()) ;
        FileUtils.copyFile(rightPdfFile, dstFile) ;

        dstFile = new File(OUTPUT_DIRS[i], rightPageName + ".jpg") ;
        _print("copy " + rightJpgFile.getName() + " to " + dstFile.getPath()) ;
        FileUtils.copyFile(rightJpgFile, dstFile) ;
    }
}

// Convert PDF File to Jpeg
function convertToJpeg(srcFile, dstFile)  {
    _print("convertToJpeg starting") ;
    
    var exe = "C:/Program Files/gs/gs9.16/bin/gswin64c.exe " ;
    var opt = "-q -dNOPROMPT -dBATCH -dNOPAUSE -dUseCIEColor -sDEVICE=jpeg -dJPEGQ=85 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r133 -o " ;
    var pdf = dstFile.getName() + " " + srcFile.getPath() + "" ;

    _print("Launching " + exe + opt + pdf) ;
    _exec2(exe + opt + pdf, dstFile.getParent(), true, 300000) ; // creates also parent directory

}

// Convert the PDF File to PDF
function convertToPdf(file)  {
    _print("convertToPdf starting") ;

    var tmpFile = File.createTempFile("tmp_", ".pdf", file.getParentFile()) ;   
    tmpFile.deleteOnExit()  ;

    var exe = "C:/Program Files/gs/gs9.16/bin/gswin64c.exe " ;
    //var opt = "-q -dNOPROMPT -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -dPDFSETTINGS=/ebook -dAutoRotatePages=/None -dDownsampleColorImages=false -o " ;
    // var opt = "-q -dNOPROMPT -dCompatibilityLevel=1.4 -d -dUseCIEColor -dColorConversionStrategy=/sRGB -dProcessColorModel=/DeviceRGB -sDEVICE=pdfwrite -o " ;
    var opt = "-q -dNOPROMPT -dBATCH -dNOPAUSE -dCompatibilityLevel=1.4 -dAutoRotatePages=/None -sDEVICE=pdfwrite -o " ;
    var pdf = tmpFile.getName() + " " + file.getPath() + "" ;

    _print("Launching " + exe + opt + pdf) ;
    _exec2(exe + opt + pdf, tmpFile.getParent(), true, 300000) ; // creates also parent directory
    
    FileUtils.deleteQuietly(file) ;
    FileUtils.moveFile(tmpFile, file) ;
}

// Crop the Jpeg Plate to 2 Jpeg pages
function cropPlateToPages(file)  {
	_print("cropPlateToPages starting") ;
	
	// Taille du fichier plaque PDF : 644mm x 410mm
	var d = ScriptUtils.getImageDimension(file) ;
	var w = Math.round(d.width * (256+24) / 644) ;
	var h = Math.round(d.height * (354+26) / 410) ;
	var x0 = Math.round(d.width * 49 / 644) ;
	var x1 = Math.round(d.width * 326 / 644) ;
	var y = Math.round(d.height * 20 / 410) ;
	
	var exe = "ext/windows/imagemagick/convert.exe " ;

	var opt = file.getPath() + " -crop " + w + "x" + h + "+" + x0 + "+" + y + " +repage -resize 1080x " + leftJpgFile.getPath() ;
	_print("Launching " + exe + opt) ;
	_exec2(exe + opt, leftJpgFile.getParent(), true, 30000) ; 
	
	var opt = file.getPath() + " -crop " + w + "x" + h + "+" + x1 + "+" + y + " +repage -resize 1080x " + rightJpgFile.getPath() ;
	_print("Launching " + exe + opt) ;
	_exec2(exe + opt, rightJpgFile.getParent(), true, 30000) ;

}

// Rip and copy plate to Suivi
function ripPdfPlate(file) {
	convertToJpeg(file, plateJpgFile) ;
	cropPlateToPages(plateJpgFile) ;

	var dstFile = new File(SUIVI_DIR, file.getName()) ;
	_print("copy " + file.getName() + " to " + dstFile.getPath()) ;
	FileUtils.copyFile(file, dstFile) ;

	var baseName = FilenameUtils.getBaseName(file.getName()) ;
	var dstFile = new File(SUIVI_DIR, baseName + ".jpg") ;
	_print("copy " + plateJpgFile.getName() + " to " + dstFile.getPath()) ;
	FileUtils.copyFile(plateJpgFile, dstFile) ;
}

// Split the plate into 2 pages
function splitPdfPlate(file) {
    _print("splitPdfPlate starting");

    var pdfTool = new PdfTool();
    pdfTool.addFilter(new CropMargin(leftPdfFile.getPath(), 49* NumUtils.MMtoPT, 20* NumUtils.MMtoPT, 15* NumUtils.MMtoPT, 317* NumUtils.MMtoPT ));
    pdfTool.execute(file);
    convertToPdf(leftPdfFile)  

    pdfTool = new PdfTool();
    pdfTool.addFilter(new CropMargin(rightPdfFile.getPath(), 326* NumUtils.MMtoPT, 20* NumUtils.MMtoPT, 15* NumUtils.MMtoPT, 40* NumUtils.MMtoPT ));
    pdfTool.execute(file);
    convertToPdf(rightPdfFile)  

}

// Clean and remove temporary objects
function cleanTmpFiles() {
	FileUtils.deleteQuietly(plateJpgFile) ;
	FileUtils.deleteQuietly(leftPdfFile) ;
	FileUtils.deleteQuietly(leftJpgFile) ;
	FileUtils.deleteQuietly(rightPdfFile) ;
	FileUtils.deleteQuietly(rightJpgFile) ;
}

// Init Temporary files
function initTmpFiles() {
	plateJpgFile = File.createTempFile("plate_", ".jpg") ;
	plateJpgFile.deleteOnExit() ;
	leftPdfFile = File.createTempFile("left_page_", ".pdf") ;
	leftPdfFile.deleteOnExit() ;
	leftJpgFile = File.createTempFile("left_page_", ".jpg") ;
	leftJpgFile.deleteOnExit() ;
	rightPdfFile = File.createTempFile("right_page_", ".pdf")
	rightPdfFile.deleteOnExit() ;
	rightJpgFile = File.createTempFile("right_page_", ".jpg") ;
	rightJpgFile.deleteOnExit() ;
}


// Format the date to DDMMYY
function getParutionDate(str) {
    var tokens = str.split("/") ;

    var day = tokens[0] ;
    if ( day.length == 1 ) day = "0" + day ;

    var month = tokens[1] ;
    if ( month.length == 1 ) month = "0" + month ;

    var year = tokens[2] + "";
    if ( year.length == 4 ) year = year.substr(2,2) ;

    return day + "" + month + "" + year ;
}

// Process the PDF plates
function processPdf(file) {
	_print("processPdf starting");

	var filename = _srcFile.getName() ;
	var index = filename.toUpperCase().lastIndexOf("_V") ;
	if ( index < 0 ) index = filename.lastIndexOf(".") ;
	filename = filename.substring(0, index) ;
	
	var parutionDate = filename.substring(0, 6) ;
	var paginFile = new File(PAGIN_DIR, parutionDate + "_" + PAGIN_NAME) ;
	if ( paginFile.exists() ) {	   
	   _print("Parsing pagin.xml");
	   var builder = new Builder();
	   var doc = builder.build(paginFile);
	   
	   var plateNodes = doc.query("//plate [@filename='" + filename + "']");
	
	   if ( plateNodes.size() > 0 ) {
		initTmpFiles() ;
		ripPdfPlate(file) ;
		splitPdfPlate(file) ;
		duplicatePages(plateNodes) ;
		cleanTmpFiles() ;
	   }
	   else {
	       _print("La plaque " + filename + " n'existe pas dans le fichier de pagination " + paginFile.getName());
	       copyToError(file, _srcFile.getName()) ;
	   }
	}
	else {
	   _print("Le fichier de pagination " + paginFile.getName() + " n'existe pas");
	   copyToError(file, _srcFile.getName()) ;
	}
	_print("processPdf done");
}

function copyToError(file, filename) {
    var dstFile = new File(ERROR_DIR, filename) ;
    _print("copie : " + filename + " vers " + dstFile.getPath()) ;
    FileUtils.copyFile(file, dstFile) ;
}

// Main
function main() {
 
    var file = _srcFile.getFile() ;
    processPdf(file) ;

    return _OK ;
}

// start & exit
_exit = main() ;

