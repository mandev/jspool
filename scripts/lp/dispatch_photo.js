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
importPackage(Packages.com.drew.imaging.jpeg) ;
importPackage(Packages.com.drew.metadata.iptc) ;
importPackage(Packages.com.drew.metadata.exif) ;

CONVERT_EXE = "ext/windows/imagemagick/convert.exe" ;
EXIFTOOL_EXE = "ext/windows/exiftool/exiftool.exe" ;

ERROR_DIR = "D:/Error"  ;

SELECT_DIRS = [ "D:/Images/Selection/{#DPT#}", "D:/Images/Fil_Interne/{#DPT#}" ] ;	
EIDOS_SELECT_DIRS = [ "D:/Sortie/EIDOS/PROD/regionale", "D:/Sortie/EIDOS/QA/regionale", "D:/Sortie/EIDOS/DEV/regionale" ] ;

PHOTO_DIRS = [ "D:/Images/Fil_Interne/{#DPT#}" ] ;	
EIDOS_PHOTO_DIRS = [ "D:/Sortie/EIDOS/PROD/photographes", "D:/Sortie/EIDOS/QA/photographes", "D:/Sortie/EIDOS/DEV/photographes" ] ;

CORRES_DIRS= [ "D:/Images/Fil_Interne/{#DPT#}" ] ;	
EIDOS_CORRES_DIRS = [ "D:/Sortie/EIDOS/PROD/correspondants", "D:/Sortie/EIDOS/QA/correspondants", "D:/Sortie/EIDOS/DEV/correspondants" ] ;

function createTmpFile(prefix) {
    var tmpFile = File.createTempFile(prefix + "_", ".tmp");
    tmpFile.deleteOnExit();
    return tmpFile ;
}

// Get some IPTC values for Jpeg or Tiff
function getIptcData(file) {
    try {
        var metadata = JpegMetadataReader.readMetadata(file) ;
        var iptcDir = ScriptUtils.getIptcDirectory(metadata);
        if ( iptcDir != null ) {
            var iptcData = new Object();
            iptcData.fixture = nonNull(iptcDir.getString(IptcDirectory.TAG_FIXTURE_ID));
            return iptcData ;
        }
    }
    catch (e) {
        _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
        _print("Error parsing iptc: " + file) ;
    }
    return null ;
}

function nonNull(value) {
    return ( value == null ) ? "" : value ;
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
    
    for (var i in dirs) {
        var dstDir = new File(dirs[i].replace(/{#DPT#}/g, dpt)) ;
        var dstFile = new File(dstDir, FilenameUtils.removeExtension(srcFile.getName()) + ".jpg") ;
        _print("Copying " + imageFile + " to " + dstFile );
        FileUtils.copyFile(imageFile, dstFile) ;
    }
    FileUtils.forceDelete(imageFile);
}

function main() {
    
    var srcFile = _srcFile.getFile() ;
    var iptcData = getIptcData(srcFile) ;
    var dpt = ( iptcData == null ) ? null : iptcData.fixture ;
    
    if ( dpt == "60" || dpt == "75" || dpt == "77N" || dpt == "77S" || dpt == "78" ||
        dpt == "91" || dpt == "92" || dpt == "93" ||  dpt == "94" || dpt == "95" ) {
         
        processImage(srcFile, dpt, SELECT_DIRS, _getValue("INTERN_SIZE")) ;
        processImage(srcFile, dpt, EIDOS_SELECT_DIRS, _getValue("EIDOS_SIZE")) ;
    }
    else if ( dpt == "NAT" ) {
        processImage(srcFile, dpt, PHOTO_DIRS, _getValue("INTERN_SIZE")) ;
        processImage(srcFile, dpt, EIDOS_PHOTO_DIRS, _getValue("EIDOS_SIZE")) ;
    }
    else {
        processImage(srcFile, dpt, CORRES_DIRS, _getValue("INTERN_SIZE")) ;
        processImage(srcFile, dpt, EIDOS_CORRES_DIRS, _getValue("EIDOS_SIZE")) ;
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
