/* test.js
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io);
importPackage(Packages.java.nio.file);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.com.xelians.sipg);
importPackage(Packages.com.xelians.sipg.model);
importPackage(Packages.com.xelians.sipg.service.sedav2);

OUTPUT_DIR = _getValue("OUTPUT_DIR");

function validatingSedaSip() {
    _print("Processing: " + _srcFile.getName()) ;

    var input = _srcFile.getFile().toPath() ;

    Sedav2Service.getInstance().validate(input);
    
    Files.copy(input, Paths.get(OUTPUT_DIR + _srcFile.getName()));

    _print("Validate OK")
    return _OK;
}

// start & exit 
try {
    _exit = validatingSedaSip();
} catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}



