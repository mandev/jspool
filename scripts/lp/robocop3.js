/* Robocop.js
 * Paul Huynh
 *
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile)
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.apache.commons.lang) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Init
DEST_DIR = "D:/MANCHETTE/depart/" ;
DEST_DIR2 = [ "D:/METHODE/PROD/pub/", "D:/METHODE/QA/pub/", "D:/METHODE/PRODV6/pub/" ]  ;
//DEST_DIR2 = [ "D:/METHODE/PROD/pub/" ]  ;

// Transcodage pour le bon repertoire
function ventil(code) {
    if (code=="OI")	return "60";
    if (code=="PR")	return "75";
    if (code=="PRSE")	return "75";
    if (code=="SM")	return "77";
    if (code=="SMN")	return "77";
    if (code=="SMS")	return "77";
    if (code=="YV")	return "78";
    if (code=="ES")	return "91";
    if (code=="HS")	return "92";
    if (code=="HSSE")	return "92";
    if (code=="SD")	return "93";
    if (code=="VM")	return "94";
    if (code=="VO")	return "95";
    if (code=="PAR")	return "NAT";
    if (code=="AU")	return "NAT";
    if (code=="AUSE")	return "NAT";
    if (code=="AUSNE")	return "NAT";
    if (code=="PARSE")	return "NAT";
    if (code=="PARSNE")	return "NAT";
    if (code=="AUECO")      return "SUPECO";
    if (code=="AUECOSE")    return "SUPECO";
    if (code=="PARECOSE")   return "SUPECO";
    if (code=="PARECO")     return "SUPECO";
    return "libre";
}

// Retourne vrai si la date est celle de demain (AAMMJJ)
function isTomorrow(name) {
    var da = new Date() ;
    da.setFullYear("20" + name.substr(0,2), name.substr(2,2)-1, name.substr(4,2)) ;
    da.setHours(7,0,0,0) ;

    var today = new Date() ;
    if ( today < da ) {
        da.setDate(da.getDate()-3) ;
        return ( today > da ) ;
    }
    return false ;
}

// Filename: LP_AU_090107_896172-2_LARGENTININONI_V01.eps
function getExtractedFile(filename) {
    var ext = FilenameUtils.getExtension(filename).toLowerCase() ;

    var tok = FilenameUtils.getBaseName(filename).split("_") ;
    tok[3] = tok[3].replace('-','_') ;
    tok[4] = StringUtils.left(tok[4].replace('-','_'), 12) ;

    var obj = new Object();
    obj.code  = tok[1] + "" ;    // AU
    obj.date = tok[2] + "" ;     // 090107
    obj.ext = ext + "" ;         // eps
    obj.dstname = tok[1] + "_" + tok[4] + "_" + tok[3] + "_" + tok[2] + "." + ext ; // AU_LARGENTININO_896172_2_090107.eps
    return obj ;
}

// Main
function main() {

    var srcName = _srcFile.getName() ;
    var extfile = getExtractedFile(srcName) ;

    var file = new File(_srcFile.getPath()) ;
    var gfDir = file.getParentFile().getParentFile() ;

    // Envoi vers le serveur MAG - on teste le dossier grand-père pour le MAG (bof bof...)
    if ( gfDir.getName() == "MAG" ) {
        _print("Envoi MAGAZINE : " + srcName) ;

        var dirname = (extfile.ext == "eps" ) ? "/EPS/" : "/TIFF/" ;
        var dstFile = new File(DEST_DIR + "MAG/" + extfile.date + dirname + ventil(extfile.code), extfile.dstname) ;

        _print("Copie vers : " + dstFile.getPath()) ;
        FileUtils.copyFile(_srcFile.getFile(), dstFile ) ;
        return _OK ;
    } 
    // Envoi vers supplement ECO
    else  if (extfile.code == "AUECO" || extfile.code == "AUECOSE" || extfile.code=="PARECOSE" || extfile.code=="PARECO" ) {
        if ( extfile.ext == "pdf" ) {
            _print("Envoi SUPPLEMENT ECO de : " + srcName) ;
            for (var i in DEST_DIR2) {
                var dstFile = new File(DEST_DIR2[i],  srcName) ;
                _print("Copie vers : " + dstFile.getPath()) ;
                FileUtils.copyFile(_srcFile.getFile(), dstFile ) ;
            }
            return _OK ;
        }
		else if ( extfile.ext == "eps" ) {
            _print("Pas d'envoi SUPPLEMENT ECO de : " + srcName) ;
            return _OK ;
		}
    }
    // Envoi vers sersor et Methode
    else  if ( isTomorrow(extfile.date) ) {
        if ( extfile.ext == "eps" ) {
            _print("Envoi SERSOR : " + srcName) ;
            var dstFile = new File(DEST_DIR + "sersor/" + ventil(extfile.code) + "/" + extfile.dstname ) ;
            _print("Copie vers : " + dstFile.getPath() ) ;
            FileUtils.copyFile(_srcFile.getFile(), dstFile ) ;
            return _OK ;
        }
        else if ( extfile.ext == "pdf") {
            _print("Envoi METHODE : " + srcName) ;
            for (var i in DEST_DIR2) {
                var dstFile = new File(DEST_DIR2[i], srcName) ;
                _print("Copie vers : " + dstFile.getPath() ) ;
                FileUtils.copyFile(_srcFile.getFile(), dstFile ) ;
            }
            return _OK ;
        }
    }
    return _KEEP ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
//FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, _srcFile.getName())) ;
}


