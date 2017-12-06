/* 
* Emmanuel Deviller
* 
* inout.js
*/

// Attention aux mots réservés : ex.  file.delete => file["delete"] )

importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ; 

// _localScript : the being executed script (LocalScript)
// _channel : the current channel (Channel)
// _print() : print string to log
// _exit : OK = 0 ; FAIL = 1 ; NOP = 2 


// Nomenclature d'entrée TTTTTT_PP.pdf avec 
// Nomenclature de sortie: JJMMAATTTTTTPPV.pdf avec 
// Datedeparution_Nomduproduit_Numérodelapage_Numérodeversiondufichier.pdf

PRODUIT = "ASPORT" ;
VER_DIR = "C:/AUJSPORT/PRODAUJSPORT/envoyes" ;
OUT_DIRS = [ "C:/AUJSPORT/TEMPAUJSPORT/depart-ctde", 
             "C:/AUJSPORT/TEMPAUJSPORT/depart-web",
             "C:/AUJSPORT/PRODAUJSPORT/envoyes" ] ;

function getToday() {

    var today = new Date() ;
    today.setTime(today.getTime() + 1000 * 60 * 60 * 22 ) // 22 heures

    var day = today.getDate() ;
    if ( day < 10 ) day = "0" + day ;

    var month = today.getMonth() + 1  ;
    if ( month < 10 ) month = "0" + month ;
    
    var year = today.getFullYear() + ""
    year = year.substr(2,2) ;

    //_print("date " +  day + " " + month + " " + year ) ;
    return day + "" + month + "" + year ;
}

// Main 
function main() {

    var name = _srcFile.getName() ;
    var rxp = new RegExp("^" + PRODUIT + "\\d\\d\\..*", "") ;

    if ( name.match(rxp)) {

      var baseName = FilenameUtils.getBaseName(_srcFile.getName()) ;    
      var ext = FilenameUtils.getExtension(_srcFile.getName()) ;
      var dstName = getToday() + baseName ;

      var versionDir = new File(VER_DIR) ; 
      var version = 1 ;
      var regexp = new RegExp(dstName + "(\\d+)\\." + ext, "") ;

      var filenames = versionDir.list() ;  // Tableau de chaine Java
      for (i in filenames) {
        var filename = filenames[i] + "" ;  // Force la chaine en Javascript
        if ( filename.match(regexp) ) {
          var val = parseInt(filename.replace(regexp, "$1")) + 1 ;
          if ( val > version ) version = val ; 
        }
      }

      dstName = dstName + version + "." + ext  ;

      for (i in OUT_DIRS ) {
        dstFile = new File(OUT_DIRS[i], dstName) ;
        _print("copie " + name + " vers " + dstFile) ;
        FileUtils.copyFile(_srcFile.getFile(), dstFile) ;
      }
      return _OK ;   // Don't do anything after this script
    }
    else {
        _print("Le fichier " + name + " est invalide") ;
        return _FAIL ;   // Don't do anything after this script
    }
    
}

// Result _OK = 0 ; _FAIL = 1; _NOP = 2
_exit=main() ; 

