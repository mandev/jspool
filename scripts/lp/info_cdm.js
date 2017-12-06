/* test.js
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
importPackage(Packages.com.AdLitteram.jSpool.Pdf) ; 

// Init
OUTPUT_DIR="C:/tmp/ed2/" ;
CONFIG_DIR="C:/dev/netbeans/jSpool/infogaphies/" ;
ERROR_DIR="C:/tmp/ed4/" ;

OUTPUTS = [ 
"feuille_match.pdf", 
"joueur_detail_1.pdf",
"joueur_detail_2.pdf",
"joueur_detail_3.pdf",
"joueur_detail_4.pdf",
"joueur_detail_5.pdf",
"joueur_detail_6.pdf",
"joueur_detail_7.pdf",
"joueur_detail_8.pdf",
"joueur_detail_9.pdf",
"joueur_detail_10.pdf",
"joueur_detail_11.pdf",
"joueur_simple_1.pdf",
"joueur_simple_2.pdf",
"joueur_simple_3.pdf",
"joueur_simple_4.pdf",
"joueur_simple_5.pdf",
"joueur_simple_6.pdf",
"joueur_simple_7.pdf",
"joueur_simple_8.pdf",
"joueur_simple_9.pdf",
"joueur_simple_10.pdf",
"joueur_simple_11.pdf"
] ;

CONFIGS = [ 
"Q - FEUILLE DE MATCH.xml",
"Q - GRAND JOUEUR_1.xml",
"Q - GRAND JOUEUR_2.xml",
"Q - GRAND JOUEUR_3.xml",
"Q - GRAND JOUEUR_4.xml",
"Q - GRAND JOUEUR_5.xml",
"Q - GRAND JOUEUR_6.xml",
"Q - GRAND JOUEUR_7.xml",
"Q - GRAND JOUEUR_8.xml",
"Q - GRAND JOUEUR_9.xml",
"Q - GRAND JOUEUR_10.xml",
"Q - GRAND JOUEUR_11.xml",
"Q - PETIT JOUEUR_1.xml",
"Q - PETIT JOUEUR_2.xml",
"Q - PETIT JOUEUR_3.xml",
"Q - PETIT JOUEUR_4.xml",
"Q - PETIT JOUEUR_5.xml",
"Q - PETIT JOUEUR_6.xml",
"Q - PETIT JOUEUR_7.xml",
"Q - PETIT JOUEUR_8.xml",
"Q - PETIT JOUEUR_9.xml",
"Q - PETIT JOUEUR_10.xml",
"Q - PETIT JOUEUR_11.xml"
] ;

function mergePDF(input) {

   var etat = true ;
   var pdfMerger = new PdfMerger() ;

   for (var i in OUTPUTS) {
      var output = OUTPUT_DIR + OUTPUTS[i] ;
      var config = CONFIG_DIR + CONFIGS[i] ;

      var status = pdfMerger.merge(input, output, config) ;
      if ( status == 0 ) {
         _print("Fichier généré : " + output ) ;
      }
      else {
         etat = false ;
         _print("Erreur lors de la génération  : " + input + " - " + config ) ;
      }
   }
   return etat ;
}

// Main 
function main() {
 
    var input = _srcFile.getPath() ;

    if ( mergePDF(input) ) {
        _print("Les fichiers PDF ont été générés avec succès - " + input ) ;
    }
    else {
        _print("Erreur lors de la génération des fichiers PDF - " + input) ;
        var destFile = new File(ERROR_DIR, _srcFile.getName()) ;
        _print("Copie fichier : " + _srcFile.getName() + " vers " + destFile) ;
        FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    }    
    return _OK ;
}

// start & exit 
_exit = main() ; 

