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

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

function main() {

    var outputDir ;
    var dir = _srcFile.getFile().getParentFile().getName() ;
    //_print("dir : " + dir) ;

    if ( dir == "60" || dir == "75" || dir == "77N" || dir == "77S" || 
         dir == "78" || dir == "91" || dir == "92" || dir == "93" || 
         dir == "94" || dir == "95" || dir == "TLI" ) 
    {
        outputDir="C:\\Images\\Intermédiare\\Processing\\" + dir ;
    }
    else if ( dir == "COR" || dir == "NAT" ) 
    {
        outputDir="C:\\Images\\Fils\\Fil interne\\" + dir ; 
    }        
    else 
    {
        outputDir="C:\\Images\\Fils\\Fil interne\\COR\\" ; 
    }
        
    // Construct the destination file (don't use with ftp source)
    var destFile = new File(outputDir, _srcFile.getName()) ;
    _print("Copie : " + _srcFile.getFile() + " vers " + destFile) ;
    FileUtils.copyFile(_srcFile.getFile(), destFile) ;
 
    return _OK ;
}

// start & exit 
_exit = main() ; 

