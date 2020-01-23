/* impose_pdf.js
 * v 1.2
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots reserves : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.java.util) ; 
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.lowagie.text) ; 
importPackage(Packages.com.lowagie.text.pdf) ; 
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.adlitteram.pdftool.filters) ;
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// General Configuration File
CONFIG_FILE = "C:/tmp/ecenter/config/impose-config.xml" ;

FORCE=false ; 	// Force imposition disregarding time limit
FAST_TRY=true ;	// Don't try all imposition possibilities
MAX_TRY=1000 ;	// Max number of imposition tries 

// Load the configuration from the CONFIG_FILE
function loadConfig() {

    PLATES = _getValue("PLATES") ;

    if ( PLATES == null ) {
        _print("Loading configuration : " + CONFIG_FILE);

        var builder = new Builder();
        var doc = builder.build(new File(CONFIG_FILE));
        var root = doc.getRootElement();
        var platesElement = root.getFirstChildElement("plates") ;

        PLATE_DIR = platesElement.getAttribute("filterDir").getValue() ;
        STAGING_DIR = platesElement.getAttribute("stagingDir").getValue() ;
        DEFAULT_DIR = platesElement.getAttribute("defaultDir").getValue() ;
        ERROR_DIR = platesElement.getAttribute("errorDir").getValue() ;
        TIME_LIMIT = parseInt(platesElement.getAttribute("timeLimit").getValue()) ;
		
        PLATES = new Array() ;

        var plateList = platesElement.getChildElements("plate")
        for (var i=0; i<plateList.size(); i++) {
            var plateElement = plateList.get(i) ;
            var filter = plateElement.getAttribute("filter").getValue() ;
            var sameFile = plateElement.getAttribute("sameFile").getValue() ;
            var samePageNumber = plateElement.getAttribute("samePageNumber").getValue() ;
            var timeLimit = plateElement.getAttribute("timeLimit").getValue() ;

            var codes = new Array() ;
            var pageList = plateElement.getChildElements("page")
            for (var j=0;  j<pageList.size(); j++) {
                var pageElement = pageList.get(j) ;
                codes.push(pageElement.getAttribute("code").getValue()) ;
            }
			
            PLATES.push(createPlate(codes, filter, sameFile, samePageNumber, timeLimit)) ;
        }
        _print("Loading configuration done");
	
        _setValue("PLATES", PLATES) ;
    }
}

// Plate : Array of codes, XML configuration file, same filename, time limit (minute)
function createPlate(codes, filter, sameFile, samePageNumber, timeLimit) {
    var plate = new Object();
    plate.codes = codes ;
    plate.filter = PLATE_DIR + filter ;
    plate.samePageNumber = samePageNumber;
    plate.sameFile = sameFile;
    plate.timeLimit = timeLimit ;
    return plate ;
}

// Create a staging File
function createStagingFile(file) {
    //_print("createStagingFile() - " + file) ;
    var stagingFile = new Object();
    stagingFile.file = file;
    stagingFile.metafile = new File(file.getPath() + ".meta") ;

    if ( stagingFile.metafile.exists() ) {
        var props = new Properties();
        var fin = new FileInputStream(stagingFile.metafile) ;
        props.load(fin);
        fin.close();

        stagingFile.pages = props.getProperty("pages") ;
        stagingFile.code = props.getProperty("code") ;
        stagingFile.copies = props.getProperty("copies") ;
        stagingFile.time = parseInt(props.getProperty("time") + "") ;
    }
    else {
        var pdfInfo = PdfExtractor.getPdfInfo(file) ;
        if ( pdfInfo != null ) {
            stagingFile.pages = pdfInfo.getNumberOfPages() ;
            
            stagingFile.code = pdfInfo.getMetadata("eDoc.Code") ;
            if ( stagingFile.code == null ) return null ;
 
            stagingFile.copies = pdfInfo.getMetadata("eDoc.Copies") ;
            if ( stagingFile.copies == null ) stagingFile.copies = 1 ;
 
            stagingFile.time = new Date().getTime() ;
            storeMetadatas(stagingFile) ;
        }
        else {
            return null ;
        }
    }

    return stagingFile ;
}

// Store the stagingFile to file
function storeMetadatas(stagingFile) {
    var props = new Properties();
    props.setProperty("pages", stagingFile.pages) ;
    props.setProperty("code", stagingFile.code) ;
    props.setProperty("copies", stagingFile.copies) ;
    props.setProperty("time", stagingFile.time + "") ;

    var fout = new FileOutputStream(stagingFile.metafile) ;
    props.store(fout, null);
    fout.close();
}

// Return all PDF files waiting in the dir directory
function getWaitingFiles(dir) {
    var dirFile = new File(dir) ;
    if ( ! dirFile.exists() ) dirFile.mkdirs() ;
    return dirFile.listFiles();
}

// Used to sort the Staging File Array
function sortStagingFiles(a, b) {
    return a.file.lastModified() - b.file.lastModified() ;
}

// Return all PDF files with copies > 0 in the staging directeory
function getStagingFiles(files) {
    var stagingFiles = new Array() ;

    for (var i=0; i<files.length; i++) {
        var file = files[i] ;
        if ( file.getName().toLowerCase().endsWith(".pdf")) {
            var stagingFile = createStagingFile(file) ;
            if ( stagingFile == null ) {
                FileUtils.moveFileToDirectory(file, new File(ERROR_DIR), true) ;
            }
            else if ( stagingFile.copies > 0 ) {
                stagingFiles.push(stagingFile) ;
            }
            else {
                FileUtils.deleteQuietly(stagingFile.file) ;
                FileUtils.deleteQuietly(stagingFile.metafile) ;
            }
        }
    }
    stagingFiles.sort(sortStagingFiles) ;
    return stagingFiles ;
}

// Compose all plates
function composePlates(plates, stagingFiles) {
    var success = true ;

    while ( success ) {
        success = false ;
        for (var i=0; i<plates.length; i++) {
            var plate = plates[i] ;
            var sFiles = findPlateFiles(plate, stagingFiles) ;
            if ( sFiles != null ) {
                success = true ;
                executePlate(sFiles, plate.filter) ;
            }
        }
    }
}

// Find the specific combination of files to compose the plate
function findPlateFiles(plate, stagingFiles) {
    //_print("findPlate() : length: " + stagingFiles.length) ;

    var count = 0 ;
    var i = 0 ;
    var j = 0 ;
    var jStart = new Array() ;
    var sFiles = new Array() ;

    while ( i < plate.codes.length ) {
        count++ ;
        var code = plate.codes[i] ;
        var found = false ;
        var time = new Date().getTime() ;
        while (j < stagingFiles.length ) {
            var stagingFile = stagingFiles[j] ;
            jStart[i] = j + 1 ;
			
            if ( stagingFile.code == code && stagingFile.copies > 0 &&
                ( i == 0 || plate.samePageNumber == "false" || stagingFile.pages == sFiles[i-1].pages) &&
                ( i == 0 || plate.sameFile == "false" || stagingFile.file.getAbsolutePath() == sFiles[i-1].file.getAbsolutePath()) &&
                ( FORCE == true || (time - stagingFile.time) >= plate.timeLimit * 1000 * 60 )) {
				
                stagingFile.copies--;
                sFiles.push(stagingFile);
                found = true ;
                break ;
            }
            j++ ;
        }
		
        if ( found ) {
            if ( i == plate.codes.length-1 ) return sFiles ;
            i++ ;
            j = 0 ;
        }
        else {
            if ( i == 0 ) {
                for (var k=0; i<sFiles.length; k++) sFiles[k].copies++ ;
                return null ;
            }
			
            sFiles.pop().copies++ ;
            i-- ;
            j = jStart[i] ;
			
            if ( FAST_TRY && j >= stagingFiles.length ) {
                for (var k=0; k<sFiles.length; k++) sFiles[k].copies++ ;
                return null ;
            }
        }
		
        if (count > MAX_TRY ) {
            _print("findPlate() : deadlock detected") ;
            for (var k=0; k<sFiles.length; k++) sFiles[k].copies++ ;
            return null ;
        }
    }

    _print("findPlate() : error plate.codes.length = 0") ;
    return null ;
}

// Execute the PdfTool sequence with the given files and according to the plate.filter configuration file
function executePlate(sFiles, filter) {

    var pdfTool = PdfTool.createFromFile(new File(filter)) ;
    if ( pdfTool != null ) {
        _print("executePlate() - plate configuration : " + filter + " sFiles.length : " + sFiles.length) ;
        var files = new Array() ;
        for (var i=0; i<sFiles.length; i++) {
            files[i] = sFiles[i].file ;
            _print("executePlate() - " + files[i].getName()) ;
            if ( i > 0 &&  files[i].getAbsolutePath() == files[i-1].getAbsolutePath() ) continue ;
            storeMetadatas(sFiles[i]) ;
        //setMetadata(sFiles[i].file, "eDoc.Copies", sFiles[i].copies)
        }
        pdfTool.execute(files) ;
    }
    else {
        _print("executePlate() - " + filter + " is not a valid plate configration") ;
        for (var i=0; i<sFiles.length; i++) sFiles[i].copies++;
    }
}

// Set PDF metadata
//function setMetadata(file, key, value)  {
//    //_print("setMetadata() - " + file + " " + key + " " + value) ;
//    var addMeta = new AddMetadata(key, value) ;
//    addMeta.filter(file) ;
//}

// Remove all files whose copies = 0 in the staging area or TIME_LIMIT has expired
function removeStagingFiles(stagingFiles)  {
    var time = new Date().getTime() ;

    for (var i=0; i<stagingFiles.length; i++) {
        var stagingFile = stagingFiles[i] ;
        if ( stagingFile.copies <= 0 ) {
            FileUtils.deleteQuietly(stagingFile.file) ;
            FileUtils.deleteQuietly(stagingFile.metafile) ;
        }
        else if ( ( time - stagingFile.time > TIME_LIMIT * 1000 * 60 ) ) {
            FileUtils.moveFileToDirectory(stagingFile.file, new File(DEFAULT_DIR), true) ;
            FileUtils.deleteQuietly(stagingFile.metafile) ;
        }
    }
}

// Print the plate config info
function printPlates(plates)  {
    for (var i=0; i<plates.length; i++) {
        var plate = plates[i] ;
        var codes = "" ;
        for (var j=0; j<plate.codes.length; j++) codes = codes + " " + plate.codes[j] ;
        _print("Plate :" + codes + ", " + plate.filter + ", " + plate.timeLimit) ;
    }
    _print(" ") ;
}

// Print the stagingFiles info
function printStagingFiles(stagingFiles)  {
    for (var i=0; i<stagingFiles.length; i++) {
        var stagingFile = stagingFiles[i] ;
        if ( stagingFile.copies > 0 )
            _print("Staging File : " + stagingFile.file.getName() + ", " + stagingFile.code + ", " + stagingFile.copies + ", " + stagingFile.pages) ;
    }
    _print(" ") ;
}

// Print Pdf Info
function printInfo(file)  {
    var pdfInfo = PdfExtractor.getPdfInfo(file) ;
    _print(file.getName() + " : " + pdfInfo.getMetadata("eDoc.Code")) ;

    var it = pdfInfo.getEntrySet().iterator() ;
    while ( it.hasNext() )  {
        var entry = it.next() ;
        _print(file.getName() + " : " + entry.getKey().toString() + " = " + entry.getValue().toString()) ;
    }
    _print(" ") ;
}

// Copy input file to staging directory
function moveToStaging(srcFile) {
    var dstFile = new File(STAGING_DIR, srcFile.getName()) ;
    _print("Move " + srcFile.getName() + " to " + dstFile) ;
    FileUtils.deleteQuietly(dstFile) ;
    FileUtils.deleteQuietly(new File(dstFile.getPath() + ".meta")) ;
    FileUtils.moveFile(srcFile.getFile(), dstFile) ;
}

// Main
function main() {

    // Initialize the global variables from XML configuration file
    loadConfig() ;
    
    var filename = _srcFile.getName() + "" ;
    if ( filename == "_FORCE_" ) FORCE = true ;
    else if ( filename == "_RUNNING_" ) FORCE = false ;
    else moveToStaging(_srcFile) ;

    // List the files in staging directory
    var files = getWaitingFiles(STAGING_DIR) ;

    // Print metadatas of the file
    //printInfo(files[0]) ;

    // Create and save the staging files
    var stagingFiles = getStagingFiles(files) ;
    _print("Fichiers en attente: " + stagingFiles.length) ;

    // Print the staging files
    //printStagingFiles(stagingFiles) ;

    // Print all available plates
    //printPlates(PLATES) ;

    // Build Plates
    composePlates(PLATES, stagingFiles) ;

    // Clean Staging Directory
    removeStagingFiles(stagingFiles) ;

    // Print the remaining staging files
    //printStagingFiles(stagingFiles) ;

    // do something here
    //FileUtils.touch(TOUCH_FILE) ;
    return _OK ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
}



