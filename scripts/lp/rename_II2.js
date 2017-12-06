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

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// Paramètres
var OUTPUT_DIR = "D:/LP/ArrExt/images/REUTERS/entree" ;
var ERROR_DIR = "D:/LP/ArrExt/images/REUTERS/erreur" ;

// $ed171109
// Ce script supprime les entêtes des fichiers Reuter au format II2
// Le début du fichier jpeg est déterminé par le délimiteur ÿØÿà\0 (JPEG JFIF)
// On assume que ce délimiteur se trouve dans les premiers 4096 octets du fichier
function main() {

    // Read the header - 4096 bytes max
    var size = Math.min(_srcFile.getFile().length(), 4096) ;
    var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, size);
    var dstName = FilenameUtils.getBaseName(_srcFile.getName()) + ".JPG" ;

    var fis = new FileInputStream(_srcFile.getFile()) ;
    var offset = 0;
    var numRead = 0;
    while (offset < buffer.length && (numRead=fis.read(buffer, offset, buffer.length-offset)) >= 0)  offset += numRead;
    fis.close() ;

    // Délimiteur: ÿØÿà\0 (ISO-8859-1) - *** Marker: SOI (xFFD8) ***
    offset = new java.lang.String(buffer, "ISO-8859-1").indexOf("ÿØÿà\0");

    if ( offset > 0 ) {
        _print("Supression de l'entête - offset: " + offset) ;
        fis = new FileInputStream(_srcFile.getFile()) ;

        var dstFile = new File(OUTPUT_DIR, dstName) ;
        _print("copie partielle de " + _srcFile.getName() + " vers " + dstFile.getPath()) ;

        var fos = new FileOutputStream(dstFile) ;
        numRead = 0
        var numSkip = 0 ;
        while ( numSkip < offset && (numRead = fis.skip(offset-numSkip)) >= 0 ) numSkip += numRead ;
        while ( (numRead = fis.read(buffer)) >= 0 ) fos.write(buffer, 0, numRead);
        fis.close() ;
        fos.close() ;
    }
    else if ( offset == 0 ) {
        _print("Le fichier " + _srcFile.getName() + " ne comporte pas d'entête") ;
        var dstFile = new File(OUTPUT_DIR, dstName) ;
        _print("copie " + _srcFile.getName() + " vers " + dstFile.getPath()) ;
        FileUtils.copyFile(_srcFile.getFile(), dstFile) ;
    }
    else {
        _print("Le délimiteur 'ÿØÿà\\0' n'existe pas dans l'entete du fichier : " + _srcFile.getName()) ;
        var dstFile = new File(ERROR_DIR, _srcFile.getName()) ;
        _print("copie " + _srcFile.getName() + " vers " + dstFile.getPath()) ;
        FileUtils.copyFile(_srcFile.getFile(), dstFile) ;
    }
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
