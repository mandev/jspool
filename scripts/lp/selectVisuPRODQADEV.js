/* test.js
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io) ;
importPackage(Packages.java.text) ;
importPackage(Packages.java.util) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// List All children - Node, int

var SEARCH_DIR = "D:/MANCHETTE/arrivee_SAV/XML/RESA";
var SEARCH2_DIR = "D:/ASURA/ARCHIVAGE/MANCHETTE";
var EXTENSIONS = ["xml"] ;
var EXTENSIONS2 = ["pdf"] ;
var OUTPUT_DIR = ["D:/MANCHETTE/sortie/XML/PROD/VISU","D:/MANCHETTE/sortie/XML/QA/VISU","D:/MANCHETTE/sortie/XML/DEV/VISU"] ;
//var OUTPUT_DIR = ["D:/MANCHETTE/sortie/XML/QA/VISU","D:/MANCHETTE/sortie/XML/DEV/VISU"] ;

var groupArray = new Array() ;

// Today
function getDay() {
    var da = new Date() ;
    return da.setDate(da.getDate()-7);
}

function getMn(min) {
    var da = new Date() ;
    return da.setMinutes(da.getMinutes()-min);
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    return nodes.get(0).getValue() ;
}

// Main
function main() {
 
    var file = _srcFile.getFile() ;

    _print("Creating builder");
    var builder = new Builder();
    var doc = builder.build(file);

    _print("Parsing document");
    var ids = doc.query("//TRANSPUB/visuels/visuel/contentId");
    var pdfs = doc.query("//TRANSPUB/visuels/visuel/PDFfilename");

    // Selections des fichiers RESA de moins de 7 jours
    var found = FileUtils.listFiles(new File(SEARCH_DIR), EXTENSIONS, false);
    var listF = new Array() ;
    for (var i = 0; i < found.size(); i++) {
        var f = found.get(i);
        if (FileUtils.isFileNewer(f, getDay())){
            listF.push(f);
        }
    }

    // Selections des PDFS de moins de 7 jours
    var found2 = FileUtils.listFiles(new File(SEARCH2_DIR), EXTENSIONS2, false);
    var listF2 = new Array() ;
    for (var m = 0; m < found2.size(); m++) {
        var f2 = found2.get(m);
        if (FileUtils.isFileNewer(f2, getDay())){
            listF2.push(f2);
        }
    }


    var val = 1;
    var val2 = 1;

    // Recherche si dans chaque fichier RESA se trouve le contentId 
    var builder0 = new Builder();
    var vals = new Array();
    for (var k = 0; k < ids.size(); k++) {
        var value = 0;
        for (j in listF) {
            var doc0 = builder0.build(listF[j]);
            var ids0 = doc0.query("//adrl/adr/id");

            for (var l = 0; l < ids0.size(); l++) {
                if (ids.get(k).getValue() == ids0.get(l).getValue()) {
                    value = 1;
                    break;
                }
            }
        }
        vals.push(value);
    }

    for (j in vals) {
        if (vals[j]==0) {
            val = 0;
            _print("No copy of file - missing RESA id : " + ids.get(j).getValue());
        }
    }

    // Recherche si dans la liste de PDFs se trouve le PDF du fichier VISU 
    var val2s = new Array();
    for (var o = 0; o < pdfs.size(); o++) {
        var value2 = 0;
        for (n in listF2) {
            if (pdfs.get(o).getValue() == listF2[n].getName()) {
                value2 = 1;
            }   
        }
        val2s.push(value2);
    }

    for (j in val2s) {
        if (val2s[j]==0) {
            val2 = 0;
            _print("No copy of file - missing PDF file : " + pdfs.get(j).getValue());
        }
    }

//    if ((val == "1")&&(val2 == "1")) {
//		for (i in OUTPUT_DIR) {
//            FileUtils.copyFile(_srcFile.getFile(), new File(OUTPUT_DIR[i], _srcFile.getName())) ;
//            _print("copy of file: " + _srcFile.getName() + " in " + OUTPUT_DIR[i]);
//		}
//		FileUtils.deleteQuietly(new File(_srcFile.getPath() + ".time0"));
//		return _KEEP ;
//    }
//    else {
        // on envoie quand meme toutes les 10 et 25 minutes
        if (FileUtils.isFileOlder(_srcFile.getFile(), getMn(25))) {
			_print("copy of file at 25 min ");
			for (i in OUTPUT_DIR) {
            	FileUtils.copyFile(_srcFile.getFile(), new File(OUTPUT_DIR[i], _srcFile.getName())) ;
            	_print("copy of file: " + _srcFile.getName() + " in " + OUTPUT_DIR[i]);
			}
            return _OK;
    	}
    	else if (FileUtils.isFileOlder(_srcFile.getFile(), getMn(10))) {
			_print("copy of file at 10 min ");
			for (i in OUTPUT_DIR) {
            	FileUtils.copyFile(_srcFile.getFile(), new File(OUTPUT_DIR[i], _srcFile.getName())) ;
            	_print("copy of file: " + _srcFile.getName() + " in " + OUTPUT_DIR[i]);
			}
            return _KEEP;
    	}
    	else if (FileUtils.isFileOlder(_srcFile.getFile(), getMn(5))) {
			_print("copy of file at 10 min ");
			for (i in OUTPUT_DIR) {
            	FileUtils.copyFile(_srcFile.getFile(), new File(OUTPUT_DIR[i], _srcFile.getName())) ;
            	_print("copy of file: " + _srcFile.getName() + " in " + OUTPUT_DIR[i]);
			}
            return _KEEP;
    	}
		else if ((val == "1")&&(val2 == "1")) {
			for (i in OUTPUT_DIR) {
				FileUtils.copyFile(_srcFile.getFile(), new File(OUTPUT_DIR[i], _srcFile.getName())) ;
				_print("copy of file: " + _srcFile.getName() + " in " + OUTPUT_DIR[i]);
			}
			return _KEEP ;
		}
//    }

    return _KEEP ;
}

// start & exit
_exit = main() ;

