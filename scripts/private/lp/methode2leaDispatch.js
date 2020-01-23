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
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir) ;
//_print("srcFile : " + _srcFile.getPath()) ;

// List All children - Node, int

OUTPUT_DIR = "D:/METHODE/web/ftp_sdv/" ;
OUTPUT_DIR2 = "D:/METHODE/web/mail_web/" ;

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    return nodes.get(0).getValue() ;
}

// Main
function main() {

    var file = _srcFile.getFile() ;

    _print("Creating builder") ;
    var builder = new Builder() ;
    var doc = builder.build(file) ;
    
    _print("Parsing document") ;
    var status = getValue(doc,"//dbMetadata/Metadata/PubData/Web/Status") ;
    
    if (status==""){
    		var destFile = new File(OUTPUT_DIR, _srcFile.getName()) ;
		_print("copie " + _srcFile.getName() + " vers " + OUTPUT_DIR) ;
    		FileUtils.copyFile(_srcFile.getFile(), destFile) ;
		var destFile = new File(OUTPUT_DIR2, _srcFile.getName()) ;
 		_print("copie " + _srcFile.getName() + " vers " + OUTPUT_DIR2) ;
      	FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    }

    return _OK ;
//return _KEEP ;
}

// start & exit
_exit = main() ;

