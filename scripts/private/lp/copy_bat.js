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
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.nu.xom) ;

// Paramètres
var XWEB_PATH = "D:/tmp/xweb_structure.xml" ; 
var OUTPUT_DIR = "D:/tmp/ed4/"  ;

// Page In : PAGE_210912_PAR_PAR75_MAG_001_132.pdf
// Page out : PAGE_210912_TAP_UNE01.pdf
function findPage() {

    var srcFile = _srcFile.getFile() ;
    var basename = FilenameUtils.getBaseName(_srcFile.getName()) ;
    var tokens = basename.split("_") ;
    var date = tokens[1] + "" ;  
    var num = parseInt(tokens[5] + "", 10) ;      

    // pubDate = "21/09/2012"
    var pubDate= date.substr(0,2) + "/" + date.substr(2, 2) + "/20" + date.substr(4, 2) ;

    var XOM = ScriptUtils.createXomBuilder(false, false) ;
    var doc = XOM.build(new File(XWEB_PATH));
    
    var pageNodes = doc.query("/liste_parutions/parution[@id='TAP' and @publicationDate='" + 
        pubDate + "']/product[@id='PARMAG']/book/page[@physicalNumber='" + num + "']") ;
    
    if ( pageNodes.size() > 0 ) {
        for(var i=0; i<pageNodes.size(); i++) {
            var pageNode = pageNodes.get(i) ;
            var pageId = pageNode.getAttributeValue("id") ;
            var dstFile = new File(OUTPUT_DIR, "PAGE_" + date + "_TAP_" + pageId + ".pdf") ; 
            _print("copy " + srcFile.getName() + " to " + dstFile.getPath()) ;
            FileUtils.copyFile(srcFile, dstFile) ;
        }
    }
    else {
        _print("findPage() - page inconnue : " + basename);
    }
}

// Main
function main() {

    var name = _srcFile.getName() ;
    var RE = new RegExp("^PAGE_(\\d+)_PAR_(.+)_(.+)_(.+)_(.+)\\.pdf", "") ;

    if ( name.match(RE) ) {
        findPage() ;
    }
    else {
        _print("main() - nomenclature incorrecte : " + name);
    }
 
    return _OK ;
}

// start & exit
_exit = main() ;

