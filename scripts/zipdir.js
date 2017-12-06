/* dmail.js
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.com.adlitteram.jspool);

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Init 
var INPUT_DIR = _getValue("INPUT_DIR"); // "C:/tmp/sinequa1/"

function buildZip(file) {
    _print("buildZip");
    var name = file.getName();
    var lpDir = new File(INPUT_DIR, name + "_LEPARISIEN")
    if (file.exists()) {
        if (!lpDir.exists()) {
            lpDir.mkdirs();
            FileUtils.moveToDirectory(file, lpDir, true);
            var dstFile = new File(INPUT_DIR, name + "_LEPARISIEN.zip");
            if ( dstFile.exists() ) FileUtils.forceDelete(dstFile);
            ScriptUtils.zipDirToFile(lpDir, dstFile);
        }
        else {
            _print("BuildZip :  " + lpDir + " déja existant!");
        }
    }
    else {
        _print("BuildZip :  " + file + " n'existe pas!");
    }
    _print("buildZip done");
}

//20130901

// Resize and mail
function main() {
    var dir = new File(INPUT_DIR);
    var files = dir.listFiles();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.isDirectory()) {
            var pageDir = new File(file, "page");
            if (pageDir.exists() && pageDir.isDirectory()) {
                buildZip(file);
            }
            else {
                _print("Impossible de zipper: " + file);
            }
        }
    }

    return _OK;
}

// start & exit
try {
    _exit = main();
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _KO;
}

