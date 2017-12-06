
/* pdf_dcopy.js
* Emmanuel Deviller
*
* _srcDir : the spooled directory (String)
* _srcFile : the file found (SourceFile)
* _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
*
* Attention aux mots réservés : ex.  file.delete => file["delete"] )
*/

importPackage(Packages.java.io)  ;
importPackage(Packages.java.util) ;
importPackage(Packages.com.lowagie.text) ;
importPackage(Packages.com.lowagie.text.pdf) ;
importPackage(Packages.org.apache.commons.io) ;

_print("srcDir : " + _srcDir);
_print("srcFile : " + _srcFile.getPath());

// Init directory (no limit!)
OUTPUT_DIRS = new Array()
OUTPUT_DIRS[0] = "C:/tmp/ed5" ;
OUTPUT_DIRS[1] = "C:/tmp/ed6" ;

// true pour copier l'arborescence, false sinon
var sub = true ;

// Get the metadata map
function getMetadata(ifile)  {
  var reader = new PdfReader(ifile.getPath()) ;
  var map = reader.getInfo() ;
  reader.close() ;
  return map ;
}

// Main
function main() {

  var file = _srcFile.getFile() ;

  var name = _srcFile.getName() ;
  name = name.replace("_", "@") ;
  name = name.replace("~", "©") ;

  var pre = name ;
  var ext = "" ;
	
  var index = name.lastIndexOf(".") ;
  if ( index > 0 ) {
    pre = name.substring(0,index) ;
    ext = name.substring(index) ;
  }

  var map = getMetadata(file) ;
  var copies = map.get("eDoc.Copies") ;
  if ( copies.length() == 1 ) copies = "00" + copies ;
  else if ( copies.length() == 2 ) copies = "0" + copies ;

  name = pre + "_" + copies + ext ;

  // Arborescence
  var dir = "" ;

  if ( sub ) { 
    var s1 = FilenameUtils.normalize(FilenameUtils.concat(_srcDir,".")) ;
    var s2 = FilenameUtils.normalize(FilenameUtils.getFullPath(_srcFile.getPath())) ;
    if ( s2.startsWith(s1) ) dir = s2.substring(s1.length()) ;
    else dir = s2 ;  // pas normal !
  }

  for (i in OUTPUT_DIRS) {
     var destFile = new File(FilenameUtils.concat(OUTPUT_DIRS[i],dir), name) ;
     _print("copie : " + _srcFile.getName() + " vers " + destFile.getPath()) ;
     FileUtils.copyFile(file, destFile) ;
  }

  return _OK ;
}

// start & exit
_exit = main() ;
