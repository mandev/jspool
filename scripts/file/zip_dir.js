/* 
 * Zip input dir
 */

importPackage(Packages.java.io);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.com.adlitteram.jspool);

var INPUT_DIR = _getValue("INPUT_DIR");

function buildZip(file) {
    var name = file.getName();
    var dstFile = new File(INPUT_DIR, name + "_archive.zip");
    if (dstFile.exists())
        FileUtils.forceDelete(dstFile);
    ScriptUtils.zipDirToFile(dir, dstFile);
}

function main() {
    var dir = new File(INPUT_DIR);
    var files = dir.listFiles();
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file.isDirectory()) {
            buildZip(file);
        }
    }

    return _OK;
}

// start & exit
try {
    _exit = main();
} catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _KO;
}

