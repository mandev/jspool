/* 
 * Emmanuel Deviller
 * 
 * inout.js
 */

// Attention aux mots r�serv�s : ex.  file.delete => file["delete"] )
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
SRC_DIR = "D:/LP/ArrMethode/pages/qwam_in";
DST_DIR = "D:/LP/ArrMethode/pages/qwam_out";
SAV_DIR = "D:/LP/ArrMethode_SAV/qwam_sav";
COM_DIR = "D:/LP/ArrMethode/pages/complet";
LF_DIR = "D:/LP/ArrMethode/pages/lefigaro_out";
EQ_DIR = "D:/LP/ArrMethode/pages/lequipe/lequipe_in";
VE_DIR = "D:/LP/ArrMethode/pages/ventes/ventes_in";

// 140613 => 20130614
function processDate(str) {
    return "20" + str.substr(4, 2) + str.substr(2, 2) + str.substr(0, 2);
}

// 130911 => 20130911
function processDate_us(str) {
    return "20" + str.substr(0, 2) + str.substr(2, 2) + str.substr(4, 2);
}

// Is between src date
function isBetweenDate(str) {
    var da = new Date();
    da.setFullYear(str.substr(0, 4), str.substr(4, 2) - 1, str.substr(6, 2));
    da.setHours(6, 1, 0, 0);

    var today1 = new Date();
    today1.setHours(6, 1, 0, 0);

    var today2 = new Date();
    today2.setHours(6, 59, 0, 0);

    var today = new Date();
    return ((today > da) && (today > today1) && (today < today2));
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
            var names = srcName.split("_");
            if (names.length == 2) {
                var codeName = names[0];
                var dateName = names[1];
                if (codeName == code && isBetweenDate(dateName)) {
		    _print("concat " + srcFile);
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
                    _print("copie " + zipFile + " vers " + dstFile);
                    FileUtils.copyFile(zipFile, dstFile);

                    var savFile = new File(SAV_DIR, zipFile.getName());
                    _print("copie " + zipFile + " vers " + savFile);
                    FileUtils.copyFile(zipFile, savFile);


                    if (code == "LPJE" || code == "LPMA") {
						dstFile = new File(LF_DIR, zipFile.getName());
                    	_print("copie " + zipFile + " vers " + dstFile);
                    	FileUtils.copyFile(zipFile, dstFile);
					}

                    if ( code == "PQLP" || code == "LPPA" || code == "LPJE" || code == "LPMA") {
						dstFile = new File(COM_DIR, zipFile.getName());
                    	_print("copie " + zipFile + " vers " + dstFile);
                    	FileUtils.copyFile(zipFile, dstFile);
					}

                    FileUtils.forceDelete(zipFile);
                    FileUtils.forceDelete(srcFile);
                }
            }
        }
    }
}

// Entr�e PDF : PAGE_140613_PAR_AUJ_CNAT_29_36.pdf
// PDF inside : PQLP_20121022_001.pdf, PQLP_20121022_002.pdf ...
function movePdf(code, re, listDir) {
    //_print("re " + re);
    var first = true;
    for (var i = 0; i < listDir.length; i++) {
        var srcFile = listDir[i];
        var srcName = srcFile.getName() + "";
        //_print("srcName " + srcName);
        if ( srcFile.isFile() && srcName.match(re)) {
            if ( first ) {
                Thread.sleep(10000);
                first = false ;
            }  // stability insurance
            var dstDate = processDate(srcName.replace(re, "$1"));
            var book = srcName.replace(re, "$3");
            var page = srcName.replace(re, "$4");
           
            page = StringUtils.leftPad(page, 3, "0");

            if (book == "CNAT" || book == "T75" || book == "T75BIS" || book == "T60" || 
                    book == "T7S" || book == "T7N" || book == "T78" || book == "T91" || 
                    book == "T92" || book == "T93" || book == "T94" || book == "T95" || 
                    book == "PAR" || book == "CNATNTE" || book == "CAUJNTE" ||
                    book == "CAUJTOU" || book == "CNATTOU" || book == "CAUJVIT" ||
                    book == "CNATVIT" || book == "CAUJMIT" || book == "CNATMIT" )
                page = "0" + page;
            else if (book == "CECO" || book == "CECOMIT" || book == "CECOTOU" || book == "CECOVIT" ||
                    book == "E75" || book == "E60" || book == "E7S" || book == "E7N" ||
                    book == "E78" || book == "E91" || book == "E92" || book == "E93" ||
                    book == "E94" || book == "E95")
                page = "1" + page;
            else if (book == "CJDE")
                page = "2" + page;
            else
                page = "3" + page;

            var dstFile = new File(SRC_DIR + "/" + code + "_" + dstDate + "/" + code + "_" + dstDate + "_" + page + ".pdf");
            _print("copie " + srcFile + " vers " + dstFile);
            FileUtils.copyFile(srcFile, dstFile);
			if ((code == "LPMA" && page == "3001") || (code == "LPJE" && page == "2001")) {
            	var dstFile = new File(VE_DIR + "/" + code + "_" + dstDate + ".pdf");
            	FileUtils.copyFile(srcFile, dstFile);
			}
			if (code == "EQMA" && page == "3001") {
            	var dstFile = new File(EQ_DIR + "/" + code + "_" + dstDate + ".pdf");
            	FileUtils.copyFile(srcFile, dstFile);
			}
            FileUtils.forceDelete(srcFile);
        }
    }
}

function movePdf_sup_BOUGEZ(code, re, listDir) {
    //_print("re " + re);
    var first = true;
    for (var i = 0; i < listDir.length; i++) {
        var srcFile = listDir[i];
        var srcName = srcFile.getName() + "";
        //_print("srcName " + srcName);
        if ( srcFile.isFile() && srcName.match(re)) {
            if ( first ) {
                Thread.sleep(10000);
                first = false ;
            }  // stability insurance
            var dstDate = processDate(srcName.replace(re, "$1"));
            var book = srcName.replace(re, "$1");
            var dstDate = srcName.replace(re, "$2") + "" + srcName.replace(re, "$4") + "" + srcName.replace(re, "$3");
            var page = srcName.replace(re, "$5");
           
            page = StringUtils.leftPad(page, 3, "0");

            page = "0" + page;

            var dstFile = new File(SRC_DIR + "/" + code + "_" + dstDate + "/" + code + "_" + dstDate + "_" + page + ".pdf");
            _print("copie " + srcFile + " vers " + dstFile);
            FileUtils.copyFile(srcFile, dstFile);
            FileUtils.forceDelete(srcFile);
        }
    }
}

function movePdf_sup(code, re, listDir) {
    //_print("re " + re);
    var first = true;
    for (var i = 0; i < listDir.length; i++) {
        var srcFile = listDir[i];
        var srcName = srcFile.getName() + "";
        //_print("srcName " + srcName);
        if ( srcFile.isFile() && srcName.match(re)) {
            if ( first ) {
                Thread.sleep(10000);
                first = false ;
            }  // stability insurance
            var dstDate = processDate(srcName.replace(re, "$1"));
            var book = srcName.replace(re, "$1");
            var dstDate = srcName.replace(re, "$2") + "" + srcName.replace(re, "$3") + "" + srcName.replace(re, "$4");
            var page = srcName.replace(re, "$5");
           
            page = StringUtils.leftPad(page, 3, "0");

            if (book == "PARISIENNE" )
                page = "0" + page;
            else
                page = "1" + page;

            var dstFile = new File(SRC_DIR + "/" + code + "_" + dstDate + "/" + code + "_" + dstDate + "_" + page + ".pdf");
            _print("copie " + srcFile + " vers " + dstFile);
            FileUtils.copyFile(srcFile, dstFile);
            FileUtils.forceDelete(srcFile);
        }
    }
}

function movePdf_eqp(code, re, listDir) {
//    _print("re " + re);
    var first = true;
    for (var i = 0; i < listDir.length; i++) {
        var srcFile = listDir[i];
        var srcName = srcFile.getName() + "";
        // _print("srcName " + srcName);
        if ( srcFile.isFile() && srcName.match(re)) {
//        _print("srcFile " + srcFile);
            if ( first ) {
                Thread.sleep(10000);
                first = false ;
            }  // stability insurance
            var dstDate = processDate_us(srcName.replace(re, "$2"));
            var book = srcName.replace(re, "$1");
            var page = srcName.replace(re, "$3");
           
            page = StringUtils.leftPad(page, 3, "0");

            if (book == "eq" || book == "mag" || book == "sns" || book == "ff" || book == "vel"|| book == "jdg")
                page = "0" + page;

            var dstFile = new File(SRC_DIR + "/" + code + "_" + dstDate + "/" + code + "_" + dstDate + "_" + page + ".pdf");
            _print("copie " + srcFile + " vers " + dstFile);
            FileUtils.copyFile(srcFile, dstFile);
            FileUtils.forceDelete(srcFile);
        }
    }
}

function process(code, re, listDir) {
    movePdf(code, re, listDir);
    buildConcatZip(code);
}

function process_sup_BOUGEZ(code, re, listDir) {
    movePdf_sup_BOUGEZ(code, re, listDir);
    buildConcatZip(code);
}

function process_sup(code, re, listDir) {
    movePdf_sup(code, re, listDir);
    buildConcatZip(code);
}

function process_eqp(code, re, listDir) {
    movePdf_eqp(code, re, listDir);
    buildConcatZip(code);
}

function process_EQMA(code, re, listDir) {
    movePdf(code, re, listDir);
}

function clean() {
    var listDir = new File(SRC_DIR).listFiles();
    for (var i = 0; i < listDir.length; i++) {
        var file = listDir[i];
        if (!file.isDirectory() ) {
            FileUtils.forceDelete(file);
        }
    }
}

function cleanre(re) {
    var listDir = new File(SRC_DIR).listFiles();
    for (var i = 0; i < listDir.length; i++) {
        var file = listDir[i];
		var filename = file.getName() + "" ;
        if (!file.isDirectory() && filename.match(re)) {
            FileUtils.forceDelete(file);
        }
    }
}

// Main 
function main() {

	cleanre(new RegExp("^PAGE_(\\d+)_PAR_(LYO)_(.+)_(\\d+)_\\d+\\.pdf", "")) ;
	cleanre(new RegExp("^PAGE_(\\d+)_PAR_(NCY)_(.+)_(\\d+)_\\d+\\.pdf", "")) ;
	cleanre(new RegExp("^PAGE_(\\d+)_PAR_(NTE)_(.+)_(\\d+)_\\d+\\.pdf", "")) ;
	cleanre(new RegExp("^PAGE_(\\d+)_PAR_(TOU)_(.+)_(\\d+)_\\d+\\.pdf", "")) ;
	cleanre(new RegExp("^PAGE_(\\d+)_PAR_(VIT)_(.+)_(\\d+)_\\d+\\.pdf", "")) ;
	cleanre(new RegExp("^PAGE_(\\d+)_PAR_(MIT)_(.+)_(\\d+)_\\d+\\.pdf", "")) ;
	cleanre(new RegExp("^PAGE_(\\d+)_PAR_(PAR75)_(SELMAG)_(\\d+)_\\d+\\.pdf", "")) ;
	cleanre(new RegExp("^(BOUGEZ)_(\\d+)_(\\d+)_(\\d+)_(DEROULE)\\.pdf", "")) ;
	cleanre(new RegExp("^(PARISIENNE)_(\\d+)_(\\d+)_(\\d+)_(\\d+)_AUJ\\.pdf", "")) ;
	cleanre(new RegExp("^(PARISIENNE)_(\\d+)_(\\d+)_(\\d+)_(\\d+)_LP\\.pdf", "")) ;
	
    var listDir = new File(SRC_DIR).listFiles();

    // Bougez : BOUGEZ_2013_08_12_58.pdf
    var code = "LPBO";
    var re = new RegExp("^(BOUGEZ)_(\\d+)_(\\d+)_(\\d+)_(\\d+)\\.pdf", "");
    process_sup_BOUGEZ(code, re, listDir);

    // La Parisienne : PARISIENNE_2013_08_12_58.pdf
    var code = "LPPA";
    var re = new RegExp("^(PARISIENNE)_(\\d+)_(\\d+)_(\\d+)_(\\d+)\\.pdf", "");
    process_sup(code, re, listDir);

    // Aujourd'hui en France Magazine AEF
    var code = "EQMA";  
    var re = new RegExp("^PAGE_(\\d+)_PAR_(AUJ)_(MAG)_(\\d+)_\\d+\\.pdf", "");
    process_EQMA(code, re, listDir);

    // Le Parisien Magazine (ATTENTION : � traiter avant le PAR75 sinon le 
	// fichier est consid�r� comme appartenant au quotidien)
    var code = "LPMA";  
    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR75)_(MAG)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);

	// Le Parisien Quotidien 75
    var code = "PQLP";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR75)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);

	// Le Parisien Quotidien Oise
    var code = "LP60";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR60)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);

    var code = "LP7S";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR7S)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);

    var code = "LP7N";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR7N)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);

    var code = "LP78";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR78)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);

    var code = "LP91";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR91)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);

    var code = "LP92";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR92)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);

    var code = "LP93";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR93)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);

    var code = "LP94";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR94)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);

    var code = "LP95";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR95)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);

    var code = "LPJE";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(JDE)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);

    // PAGE_DATE_PAR_AUJ_CNAT_12_48.pdf
    var code = "PQAU";
    var re = new RegExp("^PAGE_(\\d+)_PAR_(AUJ)_(.+)_(\\d+)_\\d+\\.pdf", "");
    process(code, re, listDir);
    	
    // Lequipe Magazine mag_130914_3747205_1626_17.pdf
    var code = "EQUM";  
    var re = new RegExp("^(mag)_(\\d+)_\\S+_\\d+_(\\d+)\\.pdf", "");
    process_eqp(code, re, listDir);

	// Lequipe eq_130911_1-U10256996442sx_0_1.pdf
    var code = "EQUI";
    var re = new RegExp("^(eq)_(\\d+)_(\\d+).+.pdf", "");
    process_eqp(code, re, listDir);

	// S&S sns_130914_3747326_0048_2.pdf
    var code = "EQUS";
    var re = new RegExp("^(sns)_(\\d+)_\\d+_\\d+_(\\d+).pdf", "");
    process_eqp(code, re, listDir);

	// France FootBall ff_130914_3747326_0048_2.pdf
    var code = "FFOO";
    var re = new RegExp("^(ff)_(\\d+)_\\d+_\\d+_(\\d+).pdf", "");
    process_eqp(code, re, listDir);

	// Velo vel_131003_3748662_0512_1.pdf
    var code = "VELO";
    var re = new RegExp("^(vel)_(\\d+)_\\d+_\\d+_(\\d+).pdf", "");
    process_eqp(code, re, listDir);

	// Journal du Golf jdg_131003_3748662_92_1.pdf
    var code = "EQJG";
    var re = new RegExp("^(jdg)_(\\d+)_\\d+_\\d+_(\\d+).pdf", "");
    process_eqp(code, re, listDir);

    //clean() ;    
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


//    var code = "LP75BIS";
//    var re = new RegExp("^PAGE_(\\d+)_PAR_(PAR75BIS)_(.+)_(\\d+)_\\d+\\.pdf", "");
//    process(code, re, listDir);
//
//    var code = "AUMIT";
//    var re = new RegExp("^PAGE_(\\d+)_PAR_(MIT)_(.+)_(\\d+)_\\d+\\.pdf", "");
//    process(code, re, listDir);
//
//    var code = "AUNTE";
//    var re = new RegExp("^PAGE_(\\d+)_PAR_(NTE)_(.+)_(\\d+)_\\d+\\.pdf", "");
//    process(code, re, listDir);
//
//    var code = "AUVIT";
//    var re = new RegExp("^PAGE_(\\d+)_PAR_(VIT)_(.+)_(\\d+)_\\d+\\.pdf", "");
//    process(code, re, listDir);
//
//    var code = "AUTOU";
//    var re = new RegExp("^PAGE_(\\d+)_PAR_(TOU)_(.+)_(\\d+)_\\d+\\.pdf", "");
//    process(code, re, listDir);