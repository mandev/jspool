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

var OUTPUT_DIRS = [ "D:/LP/ArrMethode/pages/milibris/milibris_edition_unique", "D:/LP/ArrMethode/pages/milibris/milibris_ftp" ] ;
var ERROR_DIR = "D:/LP/ArrMethode/plaques_erreur" ;
var PAGIN_DIR = "D:/LP/ArrMethode/plaques_config" ;
var MAP_NAME = "pagin_map.xml" ;

var JSPOOL_DIR = "C:/Documents and Settings/Administrateur/.jSpool/" ;
var SUNDAYEDTS = [ "7N", "7S", "78", "91" , "92" , "93", "94", "95" ] ;

// Test if it is Sunday
function isSunday(parDate) {
    var da = new Date() ;
    da.setHours(6,0,0,0) ;
    da.setFullYear("20" + parDate.substr(4,2), parDate.substr(2,2)-1, parDate.substr(0,2)) ;
    return ( da.getDay() == 0 ) ;
}

// Copie les pages des éditions 75 dans les autres editions (sauf 60)
// PAGE_181212_PAR_PAR75_E75_5_6 => PAGE_181212_PAR_PAR91_E91_5_6
function copySunday(file, name) {
    var tokens = name.split("_") ; 
    var parDate = tokens[1] ;
    var edition = tokens[3] ;
    var book = tokens[4] ;
    var folio = tokens[5] ;
    var maxext = tokens[6] ;
    
    if ( edition == "PAR75" && ( book == "E75" || book == "T75")) {
        for (var i in SUNDAYEDTS) {
        	  var cahier = (book == "E75") ? "_E" : "_T";
            var newName = "PAGE_" + parDate + "_PAR_PAR" + SUNDAYEDTS[i] + cahier + SUNDAYEDTS[i] + "_" + folio + "_" + maxext ; 
            copyToOutput(file, newName) ;
        }
    }
}

// Process the PDF plates
function processPdf(file) {
    _print("processPdf starting");

    var filename = _srcFile.getName() ;
    var index = filename.lastIndexOf(".") ;
    var filename2 = filename.substring(0, index) ;
    var ext = filename.substr(index) ;

    var tokens = filename.split("_") ; 
    var parutionDate = tokens[1] ;
    var book = tokens[4] ;
    var folio = tokens[5] ;   

    var mapFile = new File(PAGIN_DIR, parutionDate + "_" + MAP_NAME) ;
    if ( mapFile.exists() ) {	   
    
        _print("Parsing map.xml");
        var builder = new Builder();
        var doc = builder.build(mapFile);
				
        var mapNodes = doc.query("//page [@oldName='" + filename2 + "']");
        if ( mapNodes.size() > 0 ) {
            for (var k = 0; k < mapNodes.size(); k++) {
                var newName = mapNodes.get(k).getAttributeValue("newName") + ext ;
                copyToOutput(file, newName) ;
            }
        }
        else {
            _print("La page " + filename + " n existe pas dans le fichier de map " + mapFile.getPath());
        	  copyToOutput(file, filename) ;
        	  if (isSunday(parutionDate)) copySunday(file, filename) ;
        }
    }
    else {
        _print("Le fichier map " + mapFile.getPath() + " n'existe pas");
        copyToOutput(file, _srcFile.getName()) ;
        if (isSunday(parutionDate)) copySunday(file, _srcFile.getName()) ;
    }
    
    _print("processPdf done");
    return _OK ;
}

function copyToOutput(file, filename) {
    for (var i in OUTPUT_DIRS) {
        var dstFile = new File(OUTPUT_DIRS[i], filename) ;
        _print("copie : " + file.getName() + " vers " + dstFile.getPath()) ;
        FileUtils.copyFile(file, dstFile, false) ;
    }
}

function copyToError(file, filename) {
    var dstFile = new File(ERROR_DIR, filename) ;
    _print("copie : " + file.getName() + " vers " + dstFile.getPath()) ;
    FileUtils.copyFile(file, dstFile) ;
}

// Main
function main() {
    var file = _srcFile.getFile() ;
    return processPdf(file) ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
}



