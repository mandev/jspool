/* 
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

CONVERT_EXE = "ext/windows/imagemagick/convert.exe" ;
EXIFTOOL_EXE = "ext/windows/exiftool/exiftool.exe" ;

ERROR_DIR = "D:/Images/Error"  ;
INTERN_DIRS= [ "D:/Images/Selection/{#DPT#}", "D:/Images/Fil_Interne/{#DPT#}" ] ;	
EIDOS_DIRS= [ "D:/Sortie/EIDOS/PROD/regionale", "D:/Sortie/EIDOS/QA/regionale", "D:/Sortie/EIDOS/DEV/regionale" ] ;


function createTmpFile(prefix) {
    var tmpFile = File.createTempFile(prefix + "_", ".tmp");
    tmpFile.deleteOnExit();
    return tmpFile ;
}

// Add dpt value to iptc
function addIptcTag(imageFile, dpt)  {
//    var iptcFile = createTmpFile("iptc");
//    var iptcData = "-1IPTC:FixtureIdentifier=" + dpt + "\n";
//    FileUtils.writeStringToFile(iptcFile, iptcData, "US-ASCII") ;
//    var opt = ["-overwrite_original", "-@", iptcFile.getPath(), imageFile.getPath()];
    
    var opt = ["-overwrite_original", "-1IPTC:FixtureIdentifier=" + dpt, imageFile.getPath()];
    _print("Launching " + EXIFTOOL_EXE + " " + opt + " dir: " + imageFile.getParent()) ;
    var status = _exec(EXIFTOOL_EXE, opt, imageFile.getParent(), 30000) ; // 30 secondes time out
    if ( status != 0  ) {
        _print("addIptcTag error!") ;
        FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, _srcFile.getName())) ;
    }
    
//    FileUtils.forceDelete(iptcFile);
}

// Resize and convert image to jpeg with Image Magick
function convertImage(srcFile, dstFile, size)  {
    var maxsize = size * 1.2 ;
    var d = ScriptUtils.getImageDimension(srcFile) ;
    
    if ( d.width == 0 || d.height == 0 || d.width > maxsize || d.height > maxsize ) {
        _print("Converting image " + srcFile.getName() + " - " + d.width + "x" + d.height);
        var opt = [ srcFile.getPath(), "-resize", size + "x" + size + ">", dstFile.getPath()] ;
        _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + srcFile) ;
        var status = _exec(CONVERT_EXE, opt, dstFile.getParent(), 30000) ; // 30 secondes time out
        if ( status != 0  ) {
            _print("convertImage error!") ;
            FileUtils.copyFile(srcFile, new File(ERROR_DIR, srcFile.getName())) ;
        }
    }
    else {
        _print("Copying image " + srcFile.getName() + " - " + d.width + "x" + d.height);
        FileUtils.copyFile(srcFile, dstFile) ;
    }
}

// Process and dispatch image to ouput directories
function processImage(srcFile, dpt, dirs, size)  {
    var imageFile = createTmpFile("image");
    convertImage(srcFile, imageFile, size) ;
    addIptcTag(imageFile, dpt) ;
    
    for (var i in dirs) {
        var dstDir = new File(dirs[i].replace(/{#DPT#}/g, dpt)) ;
        var dstFile = new File(dstDir, FilenameUtils.removeExtension(srcFile.getName()) + ".jpg") ;
        FileUtils.copyFile(imageFile, dstFile) ;
    }
    FileUtils.forceDelete(imageFile);
}

function main() {
    
    var srcFile = _srcFile.getFile() ;
    var dpt = srcFile.getParentFile().getName() ;
    
    processImage(srcFile, dpt, INTERN_DIRS, _getValue("INTERN_SIZE")) ;
    processImage(srcFile, dpt, EIDOS_DIRS, _getValue("EIDOS_SIZE")) ;

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
