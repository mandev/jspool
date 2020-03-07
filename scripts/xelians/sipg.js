/* 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 * 
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io);
importPackage(Packages.java.nio.file);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.com.xelians.sipg);
importPackage(Packages.com.xelians.sipg.model);
importPackage(Packages.com.xelians.sipg.service.sedav2);

OUTPUT_DIR = _getValue("OUTPUT_DIR");

function createSedaSip() {
    _print("Starting")

    var unit = new ArchiveUnit();
    unit.setBinaryPath(_srcFile.getFile().toPath());
    unit.setBinaryVersion("BinaryMaster_1");
    unit.addTitle(_srcFile.getName());

    var archiveTransfer = new ArchiveTransfer();
    archiveTransfer.setArchivalAgreement("My Archival Agreement");
    archiveTransfer.setArchivalAgency("AG001", "");
    archiveTransfer.setTransferringAgency("AG002", "");
    archiveTransfer.addArchiveUnit(unit);

    var filename = FilenameUtils.removeExtension(_srcFile.getName()) + ".zip";
    Sedav2Service.getInstance().serialize(archiveTransfer, Paths.get(OUTPUT_DIR + filename));

    _print("Done")
    return _OK;
}

// start & exit 
try {
    _exit = createSedaSip();
} catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}
