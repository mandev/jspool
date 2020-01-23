
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
//OUTPUT_DIRS[1] = "C:/tmp/ed6" ;

// true pour copier l'arborescence, false sinon
var sub = false ;

// Get the metadata map
function getMetadata(file)  {
  var reader = new PdfReader(file.getPath()) ;
  var map = reader.getInfo() ;
  reader.close() ;
  return map ;
}

// Main
function main() {

  var file = _srcFile.getFile() ;
  var name = _srcFile.getName() ;

  var map = getMetadata(file) ;
  var code = map.get("eDoc.Code") ;
  
  if ( code == "SET-PIXSMILE-A3-001" ) {
    var pre = name ;
    var ext = "" ;
	
    var index = name.lastIndexOf(".") ;
    if ( index > 0 ) {
      pre = name.substring(0,index) ;
      ext = name.substring(index) ;
    }

    var copies = map.get("eDoc.Copies") ;
    name = pre + "_Q" + copies + ext ;

    OUTPUT_DIRS[0] = "C:/tmp/ed6" ;
  }
		

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
     _print("copy : " + _srcFile.getName() + " to " + destFile.getPath()) ;
     FileUtils.copyFile(file, destFile) ;
  }

  return _OK ;
}

// start & exit
_exit = main() ;
