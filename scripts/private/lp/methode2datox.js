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
importPackage(Packages.nu.xom) ;
importPackage(Packages.com.adlitteram.pdftool) ;
importPackage(Packages.com.adlitteram.pdftool.filters) ;
importPackage(Packages.com.adlitteram.pdftool.utils) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Paramètres
var OUTPUT_DIRS  = [ "C:/tmp/sortie/" ] ;

// Global Variables
var leftFile ;
var rightFile ;

// Split the plate into 2 pages
function splitPlateToPages(file) {
    _print("Spliting plate");

    leftFile = File.createTempFile("left_page_", ".pdf") ;
    leftFile.deleteOnExit() ;
    var pdfTool = new PdfTool();
    //pdfTool.addFilter(new CropMargin(leftFile.getPath(), 0* NumUtils.MMtoPT, 0* NumUtils.MMtoPT, 0* NumUtils.MMtoPT, 300* NumUtils.MMtoPT ));
    pdfTool.addFilter(new CropMargin(leftFile.getPath(), 0* NumUtils.MMtoPT, 0* NumUtils.MMtoPT, 0* NumUtils.MMtoPT, 354* NumUtils.MMtoPT ));
    pdfTool.addFilter(new AddMargin(0* NumUtils.MMtoPT, 0* NumUtils.MMtoPT, 0* NumUtils.MMtoPT, 10* NumUtils.MMtoPT ));
    pdfTool.execute(file);

    rightFile = File.createTempFile("right_page_", ".pdf")
    rightFile.deleteOnExit() ;
    pdfTool = new PdfTool();
    pdfTool.addFilter(new CropMargin(rightFile.getPath(), 283* NumUtils.MMtoPT, 0* NumUtils.MMtoPT, 0* NumUtils.MMtoPT, 61* NumUtils.MMtoPT ));
    pdfTool.execute(file);
}

// Clean and remove temporary objects
function clean() {
    FileUtils.deleteQuietly(leftFile) ;
    FileUtils.deleteQuietly(rightFile) ;
}

// Copy pages to destinations
function copyTo(file, filename) {
    for (i in OUTPUT_DIRS) {
        var destFile = new File(OUTPUT_DIRS[i], filename) ;
        _print("copie : " + file.getName() + " vers " + destFile.getPath()) ;
        FileUtils.copyFile(file, destFile) ;
    }
}

// Process the PDF plates
function processPdf(file) {

    // srcfle : PAGE_030909_PAR_AUJ_CNAT_P2.pdf
    var basename = FilenameUtils.getBaseName(_srcFile.getName()) ;
    var tokens = basename.split("_") ;
    var pdate   = tokens[1] + "" ;
    var media   = tokens[2] + "" ;  // toujours PAR
    var edition = tokens[3] + "" ;
    var book    = tokens[4] + "" ;
    var page   = (tokens[5] + "").substring(1) ;
    var type    = tokens[6] + "" ;

    // file: LeParisien_2009-09-01.xml.map
    var day = pdate.substring(0,2)
    var month = pdate.substring(2,4)
    var year = pdate.substring(4,6)

    // LeParisien_2009-09-04.xml.map
    var xdate = "20" + year + "-" + month + "-" + day ;
    var mapfile = new File("c:/tmp/LeParisien_" + xdate + ".xml.map") ;
    if ( mapfile.exists() ) {
        _print("Creating builder : " + mapfile.getPath());
        var builder = new Builder();
        var doc = builder.build(mapfile);

        _print("Parsing document");
        var mapNodes = doc.query("/maps/map");

        // Supression des 0
        while ( page.charAt(0) == "0") page = page.substring(1) ;

        // <map xprodId="PARIS04" correspondingXsmile="2009-09-01:PAR75:E75:4:true:24 Heures"/>
        for (var i=0; i<mapNodes.size(); i++) {
            var mapNode = mapNodes.get(i) ;

            var xsmile = mapNode.getAttribute("correspondingXsmile").getValue();
            var t = xsmile.split(":") ;

            if ( t[0] != xdate  || t[1] != edition  || t[2] != book ) continue ;
            if ( t[3] != page ) continue ;
            if ( t[5] == "true" && type == "SIMPLE" ) continue ;
            if ( t[5] == "false" && ( type == "FDBL" || type == "PANO")) continue ;

            var id = mapNode.getAttribute("xprodId").getValue();
            var fdate = day + "" + month + "" + year ;
            if ( fdate.charAt(0) == "0") fdate = fdate.substring(1) ;

            // Fichier de sortie : PAR_30909_MARNESUD02sGAU_CP.pdf PAR_30909_MARNESUD02sDRO_CP.pdf, PAR_30909_MARNESUD02sDBL_CP.pdf
            if ( type == "SIMPLE" ) copyTo(file, "PAR_" + fdate + "_" + id + "sGAU_CP.pdf") ;
            else if ( type == "PANO" ) copyTo(file, "PAR_" + fdate + "_" + id + "sDBL_CP.pdf") ;
            else {
                // Separation de la plaque
                splitPlateToPages(file) ;
                copyTo(leftFile, "PAR_" + fdate + "_" + id + "sGAU_CP.pdf") ;
                copyTo(rightFile, "PAR_" + fdate + "_" + id + "~sDRO_CP.pdf") ;
                clean() ;
            }

            return _OK ;
        }

        _print(_srcFile.getName() + " n'existe pas dans le fichier de mapping");
        return _OK ;
    }
    else {
        _print("Le fichier de mapping " + mapfile.getPath() + " n'existe pas");
        return _FAIL ;
    }
}
// Main
function main() {

    return processPdf(_srcFile.getFile()) ;
}

// start & exit
_exit = main() ;

