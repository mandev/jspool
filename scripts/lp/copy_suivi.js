/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

// $ed171209
importPackage(Packages.java.io)  ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.im4java.core) ;
importPackage(Packages.org.im4java.process) ;
importPackage(Packages.org.im4java.utils) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

OUTPUT_DIR = "C:/dsiprod/production" ;
ERROR_DIR = "C:/dsiprod/production/erreur" ;

// Resize Image with Image Magick
function resizeImage(srcFile, dstFile, size)  {

    var exe = "ext/windows/imagemagick/convert.exe " ;
    var opt = srcFile.getPath() + " -resize " + size + "x" + size + " " + dstFile.getPath() ;

    _print("Launching " + exe + opt) ;
    _exec2(exe + opt, dstFile.getParent(), true, 60000) ; // creates also parent directory
    _print("resizeImage done") ;
}


// Exec GS interpreter
function execGhostscript(srcFile, dstFile)  {
    var exe = "C:/Program Files/gs/gs9.16/bin/gswin64c.exe " ;
    var opt = "-q -dNOPROMPT -dBATCH -dNOPAUSE -dUseCIEColor -sDEVICE=jpeg -dJPEGQ=85 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r96 -o " ;
    var pdf = dstFile.getName() + " " + srcFile.getPath() + "" ;

    _print("Launching " + exe + opt + pdf) ;
    _exec2(exe + opt + pdf, dstFile.getParent(), true, 300000) ; // creates also parent directory
    _print("execGhostscript done") ;
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

// Traitement du fichier ctde: LeParisien_2009-12-20.xml.ctde
function processCtde() {
    _print("Processing  CTDE file");
    var builder = new Builder();
    var doc = builder.build(_srcFile.getFile());
    var parutionDate = getParutionDate(doc.query("/parution/@publicationDate").get(0).getValue());

    var DIR = OUTPUT_DIR + "/" + parutionDate ;
    var dstFile = new File(DIR, parutionDate + "_pagin_ctde.xml") ;
    FileUtils.copyFile(_srcFile.getFile(), dstFile) ;
}

// Plaque: 141209_PAR_PAR60_E60_P03_V1.pdf
// 2 vignettes par plaque : 160px 480px
function processPlate() {
    _print("Processing Plate file");
    var DIR = OUTPUT_DIR + "/" + _srcFile.getName().split("_")[0] ;
    FileUtils.forceMkdir(new File(DIR));

	var baseName = FilenameUtils.getBaseName(_srcFile.getName()) ;
	var jpeg96 = new File(_srcFile.getFile().getParent(), baseName + ".jpg");
	if ( !jpeg96.exists() ) { 
	    jpeg96 = File.createTempFile("plate_", ".jpg") ;
	    jpeg96.deleteOnExit() ;
	    execGhostscript(_srcFile.getFile(), jpeg96) ;
	}
    
    var jpeg1 = new File(DIR, baseName + ".jpg1") ;
    resizeImage(jpeg96, jpeg1, 480) ;

    var jpeg2 = new File(DIR, baseName + ".jpg2") ;
    resizeImage(jpeg1, jpeg2, 160) ;

    //var jpeg0 = new File(DIR, baseName + ".jpg0") ;
    //FileUtils.copyFile(jpeg96, jpeg0) ;
    FileUtils.forceDelete(jpeg96) ;

    var dstFile = new File(DIR, _srcFile.getName()) ;
    FileUtils.copyFile(_srcFile.getFile(), dstFile) ;
}

// Page: PAGE_141209_PAR_PAR7N_CPAR_3_8.pdf
// 2 vignettes par page : 108px et 323px
function processPage() {
    _print("Processing Page file");
    var DIR = OUTPUT_DIR + "/" + _srcFile.getName().split("_")[1] ;
    FileUtils.forceMkdir(new File(DIR));

	var baseName = FilenameUtils.getBaseName(_srcFile.getName()) ;
	var jpeg96 = new File(_srcFile.getFile().getParent(), baseName + ".jpg");

	// Il est plus prudent de reconstruire la page systématiquement
	//if ( !jpeg96.exists() ) { 
	    jpeg96 = File.createTempFile("page_", ".jpg") ;
	    jpeg96.deleteOnExit() ;
	    execGhostscript(_srcFile.getFile(), jpeg96) ;
	//}
	
    var jpeg1 = new File(DIR, baseName + ".jpg1") ;
    resizeImage(jpeg96, jpeg1, 323) ;

    var jpeg2 = new File(DIR, baseName + ".jpg2") ;
    resizeImage(jpeg1, jpeg2, 108);

    //var jpeg0 = new File(DIR, baseName + ".jpg0") ;
    //FileUtils.copyFile(jpeg96, jpeg0) ;
    FileUtils.forceDelete(jpeg96) ;

    var dstFile = new File(DIR, _srcFile.getName()) ;
    FileUtils.copyFile(_srcFile.getFile(), dstFile) ;
}

function main() {
    
    var filename = _srcFile.getName() ;

    if (filename.match(/^PAGE_\d\d\d\d\d\d_.*\.pdf/)) processPage() ;
    else if (filename.match(/^\d\d\d\d\d\d_.*\.pdf/)) processPlate() ;
    else if (filename.match(/^\d\d\d\d\d\d_pagin_ctde\.xml/)) processCtde() ;
    else {
        _print("Le type du fichier " + filename + " est inconnu") ;
        FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, filename)) ;
    }

    return _OK ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
}
