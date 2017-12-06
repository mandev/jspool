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

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

TAR_DIR = new File("C:/tmp/ed2")  ;

function extractTar() {  
    _print("Extracting tar file");
    ScriptUtils.untarFileToDir(_srcFile.getFile(), TAR_DIR) ;
    _print("Extracting tar file done");
}

function extractTargz() {  
    _print("Extracting targz file");
    ScriptUtils.untargzFileToDir(_srcFile.getFile(), TAR_DIR) ;
    _print("Extracting targz file done");
}

function main() {

    extractTar() ;
    //extractTargz() ;
    return _OK ;
}

// start & exit 
_exit = main() ; 

