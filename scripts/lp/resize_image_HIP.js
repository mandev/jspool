/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots r�serv�s : ex.  file.delete => file["delete"] )
 */

// $ed171209
importPackage(Packages.java.awt);
importPackage(Packages.java.io)  ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.adlitteram.jspool) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

OUTPUT_DIR = "D:/LP/ArrExt/images/HIP/entree" ;
ERROR_DIR = "D:/LP/ArrExt/images/HIP/erreur" ;

MAX_SIZE = 3300 ;  // 200 dpi * 420 / 25.4
REL_SIZE = 3000 ;  // 180 dpi * 420 / 25.4

// Resize Image with Image Magick
function convertImage(srcFile, dstFile)  {

    var exe = "ext/windows/imagemagick/convert.exe " ;

// modif sh le 060711
    var opt = "\"" + srcFile.getPath() + "\" -resize " + REL_SIZE + "x" + REL_SIZE + "> \"" + dstFile.getPath() + "\"" ;

    _print("Launching " + exe + opt) ;
    _exec2(exe + opt, dstFile.getParent(), true, 30000) ; // creates also parent directory
}

// Resize and convert to jpeg if necessary
function main() {
    
    var dstDir = new File(OUTPUT_DIR) ;
    var dstFile = new File(dstDir, FilenameUtils.removeExtension(_srcFile.getName()) + ".jpg") ;

    var d = ScriptUtils.getImageDimension(_srcFile.getFile()) ;

    // Convert image if not jpeg or larger than MAx_SIZE
    if ( d.width == 0 || d.height == 0 || d.width>MAX_SIZE || d.height>MAX_SIZE ) {
        FileUtils.forceMkdir(dstDir);
        _print("Converting image " + _srcFile.getName() + " - " + d.width + "x" + d.height);
        convertImage(_srcFile.getFile(), dstFile) ;
    }
    else {
        _print("Copying image " + _srcFile.getName() + " - " + d.width + "x" + d.height);
        FileUtils.copyFile(_srcFile.getFile(), dstFile) ;
    }

    return _OK ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, _srcFile.getName())) ;
    _exit = _FAIL;
}
