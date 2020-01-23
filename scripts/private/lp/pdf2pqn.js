/* 
 * Emmanuel Deviller
 * 
 * inout.js
 */

// Attention aux mots réservés : ex.  file.delete => file["delete"] )
importPackage(Packages.java.io);
importPackage(Packages.java.util);
importPackage(Packages.java.lang);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.lang);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.com.AdLitteram.jSpool.Files);
importPackage(Packages.com.AdLitteram.jSpool.Sources);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.pdftool.filters);
importPackage(Packages.com.adlitteram.pdftool.utils);

// _localScript : the being executed script (LocalScript)
// _channel : the current channel (Channel)
// _print() : print string to log
// _exit : OK = 0 ; FAIL = 1 ; NOP = 2 
SRC_DIR = "D:/LP/ArrMethode/pages/lefigaro_in";
DST_DIR = "D:/LP/ArrMethode/pages/lefigaro_out";

// 140613 => 20130614
function processDate(str) {
    return "20" + str.substr(4, 2) + str.substr(2, 2) + str.substr(0, 2);
}

// Is after src date
function isAfterDate(str) {
    var da = new Date();
    da.setFullYear(str.substr(0, 4), str.substr(4, 2) - 1, str.substr(6, 2));
    da.setHours(1, 59, 0, 0);
    var today = new Date();
    return (today > da);
}

function pad(str) {
    return StringUtils.leftPad(str, 2, "0");
}

// Used to sort the Staging File Array
function sortFiles(file1, file2) {
    return strcmp(file1.getName() - file2.getName());
}

function strcmp(str1, str2) {
    return ((str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1));
}

// Sortie zip : PQLP_20121022.zip
function buildConcatZip(code) {
    var fileArray = new File(SRC_DIR).listFiles();

    for (var i = 0; i < fileArray.length; i++) {
        var srcFile = fileArray[i];
        if (srcFile.isDirectory()) {
			var srcName = srcFile.getName() + "";
			var names = srcName.split("_") ;
			if ( names.length == 2 ) {
				var codeName = names[0];
				var dateName = names[1];
				if ( codeName == code && isAfterDate(dateName)) {
					var files = srcFile.listFiles();
					files.sort();
					var concatFilter = new Concat(new File(srcFile, srcName + ".pdf"));
					concatFilter.setDeleteSource(true);
					
					var pdfTool = new PdfTool();
					pdfTool.addFilter(concatFilter);
					pdfTool.execute(files);

					var d = new Date();
					var dd = d.getFullYear() + "" + pad(d.getMonth() + 1) + "" + pad(d.getDate()) + "" + pad(d.getHours()) + "" + pad(d.getMinutes()) + "" + pad(d.getSeconds());
					var zipFile = new File(SRC_DIR + "/" + code + "_" + dd + ".zip");
					ScriptUtils.zipDirToFile(srcFile, zipFile);

					var dstFile = new File(DST_DIR, zipFile.getName());
					_print("copie " + srcFile + " vers " + dstFile);
					FileUtils.copyFile(zipFile, dstFile);
					FileUtils.forceDelete(zipFile);
					FileUtils.forceDelete(srcFile);
				}
			}
		}
	}
}

// Entrée PDF : PAGE_140613_PAR_AUJ_CNAT_29_36.pdf
// PDF inside : PQLP_20121022_001.pdf, PQLP_20121022_002.pdf ...
function movePdf(code, re) {
    var listDir = new File(SRC_DIR).listFiles();
    for (var i = 0; i < listDir.length; i++) {
        var srcFile = listDir[i];
        var srcName = srcFile.getName() + "";
        _print("srcName " + srcName);
        if (!srcFile.isDirectory() && srcName.match(re)) {
            Thread.sleep(5000);  // stability insurance
            var dstDate = processDate(srcName.replace(re, "$1"));
            var book = srcName.replace(re, "$3");
            var page = srcName.replace(re, "$4");

            page = StringUtils.leftPad(page, 3, "0");
            if ( book == "CNAT" || book == "T75")  page = "0" + page;
            else if ( book == "CECO" || book == "E75")  page = "1" + page;
            else if ( book == "CJDE" )  page = "2" + page;
            else page = "3" + page;
            
            var dstFile = new File(SRC_DIR + "/" + code + "_" + dstDate + "/" + code + "_" + dstDate + "_" + page + ".pdf");
            _print("copie " + srcFile + " vers " + dstFile);
            FileUtils.copyFile(srcFile, dstFile);
            FileUtils.forceDelete(srcFile);
        }
    }
}

function process(code, re) {
    movePdf(code, re);
    buildConcatZip(code);
}

// Main 
function main() {

    var code = "PQAU";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(AUJ)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re);

    var code = "PQLP";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR75|JDE)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re);

    return _NOP;   // Don't do anything after this script
}

// Result _OK = 0 ; _FAIL = 1; _NOP = 2
// start & exit
try {
    _exit = main();
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}
