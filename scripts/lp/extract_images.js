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
importPackage(Packages.java.util.zip)  ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.org.apache.commons.io) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Constants
var OUTPUT_DIR = "C:/tmp/images" ;

function copyStreamToFile(is, fileName) {
    _print("Extracting: " + fileName);
    var outfile = new File(OUTPUT_DIR, FilenameUtils.getName(fileName)) ;
    var os = new FileOutputStream(outfile);
    IOUtils.copy(is, os);
    IOUtils.closeQuietly(os);
    IOUtils.closeQuietly(is);
}

function processZip(file) {
    _print("Unzipping structure.cfg");
    var zipFile = new ZipFile(file);
    var entry = zipFile.getEntry("structure.cfg");

    _print("Creating builder");
    var builder = new Builder();
    var doc = builder.build(zipFile.getInputStream(entry));

    _print("Parsing document");
    var fileNodes = doc.query("//file");        // XOM does not support XPath v2 with RegExp
    for (var i=0; i<fileNodes.size(); i++) {
         var fileNode = fileNodes.get(i) ;
         var fileName = fileNode.getAttribute("name").getValue() ;
         var ext = FilenameUtils.getExtension(fileName).toLowerCase() + "" ;
         if ( ext == "jpg" || ext == "tif" || ext == "jpeg" || ext == "tiff" || ext == "png" || ext == "gif" ) {
            var fileEntry = zipFile.getEntry(fileName);
            copyStreamToFile(zipFile.getInputStream(fileEntry), fileName);
         }
    }

    _print("Extracting done");
    zipFile.close();
}

// Main
function main() {
    processZip(_srcFile.getFile()) ;
    return _OK ;
}

// start & exit
_exit = main() ;

