
/* test.js
 * Emmanuel Deviller
 *
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile)
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
 *
 * Attention aux mots r�serv�s : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) 
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.com.adlitteram.jspool.framework.image) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Init directory (no limit!)
MAX_FILE=8000 ;
MAX_SIZE = 330 ;  // 200 dpi * 420 / 25.4
REL_SIZE = 300 ;  // 180 dpi * 420 / 25.4
ERROR_DIR = "c:/tmp/ed3" ;

// Check if image is a valid JPEG
function checkFormatAndSize(file) {
    var d = JpegInfo.getDimension(file) ;
    return ( d.width > 0 && d.height > 0 && d.width<=MAX_SIZE && d.height<=MAX_SIZE ) ;
}

// Resize Image with Image Magick
function convertImage(file, filename)  {
    var dir = file.getParentFile() ;
    var ext = FilenameUtils.getExtension(filename);
    var dstExt = "jpg".equalsIgnoreCase(ext) ? ext : "jpg" ;
    var dstFile = new File(dir, FilenameUtils.removeExtension(filename.toLowerCase()) + "." + dstExt) ;

    var exe = "lib/windows/imagemagick/convert.exe " ;
    var opt = "\"" + file.getPath() + "\" -resize " + REL_SIZE + "x" + REL_SIZE + "> \"" + dstFile.getPath() + "\"" ;
    _print("Launching " + exe + opt) ;
    _execFor(exe + opt, dstFile.getParent(), 30000, null) ; // creates also parent directory
    if ( !dstFile.equals(file) ) FileUtils.forceDelete(file);
    return dstFile ;
}

// Check and repare image metadata
function isValidImage(file) {
    var exe = "lib/windows/exiftool/exiftool.exe " ;
    var opt = "-q -q -P -overwrite_original_in_place -all= -tagsfromfile @ -all:all \"" + file.getPath() + "\"" ;
    _print("Launching " + exe + opt) ;
    var os = ByteArrayOutputStream() ;
    _execFor(exe + opt, file.getParent(), 30000, os) ; // creates also parent directory
    _print(os.toString()) ;
    return !( os.toString().startsWith("Error:")) ;
}

// Copy file to error dir
function copyToError() {
    _print("Bad image file: " + _srcFile.getName()) ;
    var dstFile = new File(ERROR_DIR, _srcFile.getName()) ;
    FileUtils.copyFile(_srcFile.getFile(), dstFile) ;
}

// Copy MAX_FILE in each directory
function main() { 
    var file = _srcFile.getFile() ;
    var filename = _srcFile.getName() ;

    _print("checking format and size: " + filename) ;
    if ( !checkFormatAndSize(file)) {
        _print("converting image: " + filename);
        file = convertImage(file, filename) ;
        filename = file.getName() ;
    }

    var dstName = FilenameCleaner.clean(filename).replace(' ', '_');
    dstName = dstName.replace('#','_').replace('(','_').replace(')','_').replace('[','_').replace(']','_');
    dstName = dstName.replace('!','_').replace('%','_').replace('{','_').replace('}','_').replace('+','_');

    _print("checking metadata: " + filename) ;
    if ( isValidImage(file)) {
        var dstFile = new File("c:/tmp/ed2", dstName) ;
        _print("Copying " + _srcFile.getName() + " to " + dstFile.getPath());
        FileUtils.copyFile(file, dstFile) ;
    }
    else {
        copyToError();
    }

    return _OK ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    copyToError();
    _exit = _OK;
}
