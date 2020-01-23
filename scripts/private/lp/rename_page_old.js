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

var OUTPUT_DIRS = [ "D:/LP/ArrMethode/pages/milibris_edition_unique", "D:/LP/ArrMethode/pages/milibris" ] ;

var JSPOOL_DIR = "C:/Documents and Settings/Administrateur/.jSpool/" ;
//var JSPOOL_DIR = "C:/Users/edeviller/.jSpool/" ;
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
function copySunday(file) {
    var tokens = _srcFile.getName().split("_") ; 
    var parDate = tokens[1] ;
    var edition = tokens[3] ;
    var book = tokens[4] ;
    var folio = tokens[5] ;
    var maxext = tokens[6] ;
    
	if ( edition == "PAR75" && book == "E75" ) {
        for (var i in SUNDAYEDTS) {
            var newName = "PAGE_" + parDate + "_PAR_PAR" + SUNDAYEDTS[i] + "_E" + SUNDAYEDTS[i] + "_" + folio + "_" + maxext ; 
            copyToOutput(file, newName) ;
        }
    }
}

// Process the PDF plates
function processPdf(file) {
    _print("processPdf starting");

    var filename = _srcFile.getName() ;
    var tokens = filename.split("_") ; 
    var parutionDate = tokens[1] ;
	   
    copyToOutput(file, _srcFile.getName()) ;
	
	// if date is sunday, we copy edition 75 to the other editions
	var sunday = isSunday(parutionDate) ;
    if ( sunday ) copySunday(file)
    
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



