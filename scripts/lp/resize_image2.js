/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

// $ed171209
importPackage(Packages.java.awt);
importPackage(Packages.java.io)  ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.im4java.core) ;
importPackage(Packages.org.im4java.process) ;
importPackage(Packages.org.im4java.utils) ;
importPackage(Packages.com.adlitteram.jspool) ;

OUTPUT_DIR = _getValue("OUTPUT_DIR") ;
ERROR_DIR = _getValue("ERROR_DIR")  ;
MAX_SIZE = _getValue("MAX_SIZE") ; 
REL_SIZE = _getValue("REL_SIZE") ; 

CONVERT_EXE = "ext/windows/imagemagick/convert.exe" ;

// Resize Image with Image Magick
function convertImage(srcFile, dstFile)  {
    var opt = [ srcFile.getPath(), "-resize", REL_SIZE + "x" + REL_SIZE + ">", dstFile.getPath()];
    _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + srcFile);
    var status = _exec(CONVERT_EXE, opt, dstFile.getParent(), 30000); // 30 secondes time out
    if ( status != 0  ) {
           _print("convertImage error!") ;
        FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, _srcFile.getName())) ;
    }
}

function copyFile(file) {
    var dirs = OUTPUT_DIR.split(";");
    var filename = FilenameUtils.removeExtension(_srcFile.getName()) + ".jpg";
    for(var i=0; i<dirs.length; i++) {
        var dstFile = new File(dirs[i], filename);
        _print("Copying " + file.getName() + " to " + dstFile);
        FileUtils.copyFile(file, dstFile);
    }
}

// Resize and convert to jpeg if necessary
function main() {
    
    var tmpFile = File.createTempFile("tmp_", ".jpg");
    tmpFile.deleteOnExit() ;

    var srcFile = _srcFile.getFile();
    var d = ScriptUtils.getImageDimension(srcFile);
    _print("Image: " + srcFile.getName() + " - " + d.width + "x" + d.height);
    
    // Convert image if not jpeg or larger than MAX_SIZE
    if ( d.width == 0 || d.height == 0 || d.width>MAX_SIZE || d.height>MAX_SIZE ) {
        convertImage(srcFile, tmpFile);
        copyFile(tmpFile);
        FileUtils.forceDelete(tmpFile);
    }
    else {
        copyFile(srcFile) ;
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
    _exit = _OK;
}
