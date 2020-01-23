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
importPackage(Packages.nu.xom) ;
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.adlitteram.pdftool.filters) ;
importPackage(Packages.com.adlitteram.pdftool.utils) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Paramètres
var OUTPUT_DIRS  = [ "C:/tmp/sortie/" ] ;

// Définitions de expression régulières

function isFriday(date) {
    return (date.getDay() == 5) ;
}

function isSunday(date) {
    return (date.getDay() == 0) ;
}

function isAujourdhui() {
    return ( edition == "AUJ" && book == "CNAT" && plate == "P01" )
}

function isLeparisienFriday() {
    return true ;
}

function isLeparisienSunday() {
    return true ;
}

// Copy pages to destinations
function copyTo(file, filename) {
    for (i in OUTPUT_DIRS) {
        var destFile = new File(OUTPUT_DIRS[i], filename) ;
        _print("copie : " + file.getName() + " vers " + destFile.getPath()) ;
        FileUtils.copyFile(file, destFile) ;
    }
}

// Process the PDF plates
function processPdf(file) {
    //210909_PAR_AUJ_CNAT_P04_V1.pdf
    var basename = FilenameUtils.getBaseName(_srcFile.getName()) ;
    var tokens = basename.split("_") ;
    pdate   = tokens[0] + "" ;
    media   = tokens[1] + "" ;  // toujours PAR
    edition = tokens[2] + "" ;
    book    = tokens[3] + "" ;
    plate   = tokens[4] + "" ;

    // file: LeParisien_2009-09-01.xml.map
    var day = parseInt(pdate.substring(0,2)) ;
    var month = parseInt(pdate.substring(2,4)) ;
    var year = parseInt("20" + pdate.substring(4,6)) ;
    var date = new Date(year, month, day) ;
    // LeParisien_2009-09-04.xml.map
}

// Main
function main() {

    var name = _srcFile.getName() ;
    if ( name.match(re_auj) ) copyFileTo(AUJ) ;
    if ( name.match(re_auj_nat) ) copyFileTo(AUJ_NAT) ;
    return _OK ;

}

// start & exit
_exit = main() ;

