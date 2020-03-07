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
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.pdftool.filters);
importPackage(Packages.com.adlitteram.pdftool.utils);

OUTPUT_DIR = _getValue("OUTPUT_DIR");
TMP_DIR = "/home/manu/tmp/sipg/"
TMP_FILE = new File(TMP_DIR)

function splitPdf(pdfFile) {
    FileUtils.deleteQuietly(TMP_FILE);
    FileUtils.forceMkdir(TMP_FILE);
    var pdfTool = new PdfTool();
    var splitPageFilter = new SplitPage(TMP_DIR + "/{BASE}_{COUNT}.pdf", 1, "%03d");
    pdfTool.addFilter(splitPageFilter);
    pdfTool.execute(pdfFile);
}

function createSedaSip() {
    _print("Starting")

    var archiveTransfer = new ArchiveTransfer();
    archiveTransfer.setArchivalAgreement("My Archival Agreement");
    archiveTransfer.setArchivalAgency("AG001", "");
    archiveTransfer.setTransferringAgency("AG002", "");

    var files = FileUtils.listFiles(TMP_FILE, ["pdf"], true).toArray();
    for (var i = 0; i < files.length; i++) {
        if (files[i].getName().endsWith(".pdf")) {
            _print("File: " + files[i].getName());
            var unit = new ArchiveUnit();
            unit.setBinaryPath(files[i].toPath());
            unit.setBinaryVersion("BinaryMaster_1");
            unit.addTitle(files[i].getName());
            archiveTransfer.addArchiveUnit(unit);
        }
    }

    var filename = FilenameUtils.removeExtension(_srcFile.getName()) + ".zip";
    Sedav2Service.getInstance().serialize(archiveTransfer, Paths.get(OUTPUT_DIR + filename));

    _print("Done")
    return _OK;
}

// start & exit 
try {
    splitPdf(_srcFile.getFile());
    _exit = createSedaSip();
} catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}
