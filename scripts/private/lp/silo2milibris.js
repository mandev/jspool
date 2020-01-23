/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io);
importPackage(Packages.nu.xom);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.com.adlitteram.jspool);

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Globals
var TMP_DIR = "D:/METHODE/archive/milibris_tmp/";
var OUT_DIR = "D:/METHODE/archive/milibris_ftp/";
var ZIP_DIR;

// Unzip archive
function extractZip() {
    _print("Extracting Zip file");
    var dirname = FilenameUtils.getBaseName(_srcFile.getName());
    ZIP_DIR = new File(TMP_DIR, dirname);
    
    _print("ZIP_DIR: " + ZIP_DIR);
    cleanDir() ;
    
    ScriptUtils.unzipFileToDir(_srcFile.getFile(), ZIP_DIR);
    _print("Extracting Zip file done");
}

// Zip archive
function buildZip() {
    _print("Building Zip file");

    var dirname = FilenameUtils.getBaseName(_srcFile.getName());
    var tmpZipFile = File.createTempFile(dirname + "_", ".zip.tmp", new File(TMP_DIR));   
    tmpZipFile.deleteOnExit()  ;
    _print("tmpZipFile: " + tmpZipFile);
    ScriptUtils.zipDirToFile(ZIP_DIR, tmpZipFile);

    var zipFile = new File(OUT_DIR, _srcFile.getName());
    if (zipFile.exists()) FileUtils.forceDelete(zipFile);
    FileUtils.moveFile(tmpZipFile, zipFile);
    _print("Building Zip file done");
}

function cleanDir() {
    if (ZIP_DIR.exists()) {
        _print("Deleting " + ZIP_DIR);
        FileUtils.forceDelete(ZIP_DIR);
    }
}

// Process zip and set global variables
function processZip() {
    _print("Processing");

    var filenames = ZIP_DIR.list();
    var rxp = new RegExp("\\d\\d\\d\\d\\d\\d\\d\\d", "");
    for (var i = 0; i < filenames.length; i++) {
        if (filenames[i].match(rxp)) {
            var dateName = filenames[i];
            var dateDir = new File(ZIP_DIR + "/" + dateName);
            _print("Parution: " + dateDir);
            
            var imageDir = new File(dateDir + "/page"); 
            var files = imageDir.listFiles();
            for (var j = 0; j < files.length; j++) {
                var file = files[j];
                if ( !FilenameUtils.isExtension(file.getName(), "xml")) {
                    FileUtils.forceDelete(file);
                }
            }
        }
    }
    _print("Processing Done");
}

// Main
function main() {
    extractZip();
    processZip() ;
    buildZip() ;    
    cleanDir();
    return _OK;
}

// start & exit
try {
    _exit = main();
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}

