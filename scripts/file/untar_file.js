/* 
 * Untar file
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ; 
importPackage(Packages.com.adlitteram.jspool) ;

TAR_DIR = new File("C:/tmp/output")  ;

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
    return _OK ;
}

// start & exit 
_exit = main() ; 

