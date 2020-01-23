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

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Paramètres
var OUTPUT_DIR  = [ "C:/tmp/sortie/" ] ;

// CAS 1 - EDITION 75 - TRC - PLAQUE 1
// DATE_PAR_PAR75_TRC_P01_V1.pdf  =>   DATE_PAR_PAR75_T75_P01_V1.pdf

// CAS 2 - EDITION 75 - CAHIERS HERITES
// 310809_PAR_PAR75_TRC_P03_V1.pdf  => 310809_PAR_PAR_TRC_P03_V1.pdf
// 310809_PAR_PAR75_CPAR_P03_V1.pdf  => 310809_PAR_PAR_CPAR_P03_V1.pdf
// 310809_PAR_PAR75_TRC_P07_V1.pdf => 310809_PAR_PAR_TRC_P07_V1.pdf

// CAS 3 - Avec CAHIER >= 2 caractères
// DATE_PAR_EDITION_CAHIEREDITION_P03_V1.pdf => DATE_PAR_EDITION_CAHIER_P03_V1.pdf
// 310809_PAR_PAR91_CPARPAR91_P03_V1.pdf  =>  310809_PAR_PAR91_CPAR_P03_V1.pdf
// 310809_PAR_AUJPUB_CAUJAUJPUB_P03_V1.pdf  =>   310809_PAR_AUJPUB_CAUJ_P03_V1.pdf

// CAS 4 - EDITION 75 - CAHIERS NON HERITES
// 310809_PAR_PAR75_E75_P03_V1.pdf  => 310809_PAR_PAR75_E75_P03_V1.pdf
// 310809_PAR_PAR75_C75_P03_V1.pdf  => 310809_PAR_PAR75_C75_P03_V1.pdf

// CAS 5 - AUTRES
// DATE_PAR_EDITION_CAHIER_P03_V1.pdf => DATE_PAR_EDITION_CAHIER_P03_V1.pdf
// 020909_PAR_PAR95_E95_P01_V2.pdf => 020909_PAR_PAR95_E95_P01_V2.pdf
// 020909_PAR_AUJ_CNAT_P15_V1.pdf => 020909_PAR_AUJ_CNAT_P15_V1.pdf

// CAS 4 = CAS 5 => Rien à faire

// Main
function main() {

    var tokens = _srcFile.getName().split("_") ;
    var pdate   = tokens[0] + "" ;
    var media   = tokens[1] + "" ;  // toujours PAR
    var edition = tokens[2] + "" ;
    var book    = tokens[3] + "" ;
    var plate   = tokens[4] + "" ;
    var version = tokens[5] + "" ;

    // CAS 1
    if ( edition == "PAR75" && book == "TRC" && plate == "P01" )
        name = pdate + "_PAR_PAR75_T75_P01_" + version  ;

    // CAS 2
    else if ( edition == "PAR75" &&  ( book == "TRC" || book == "CPAR" || book == "CPARA") )
        name = pdate + "_PAR_PAR_" + book + "_" + plate + "_" + version ;

    // CAS 3
    else if ( book.length > (edition.length+1) ) {
        var index = book.length - edition.length ;
        var edit = book.substring(index, book.length);
        if ( edit == edition ) {
            var bk = book.substring(0, index) ;
            name = pdate + "_PAR_" + edition + "_" + bk + "_" + plate + "_" + version ;
        }
    }

    // CAS 4 & 5
    else
        name = _srcFile.getName() ;

    // Copie du fichier
    for (i in OUTPUT_DIR) {
        var destFile = new File(OUTPUT_DIR[i], name) ;
        _print("copie : " + name + " vers " + destFile.getPath()) ;
        FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    }

    return _OK ;
}

// start & exit
_exit = main() ;

