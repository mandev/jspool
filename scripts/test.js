/* 
 * Emmanuel Deviller
 * 
 * test.js
 */

// importPackage(Packages.java.io)  ;

// _srcDir : the spooled directory (String)
// _srcFile : the file found (SourceFile) 
// Attention aux mots réservés : ex.  file.delete => file["delete"] )

// Init
_print("srcDir : " + _srcDir);
_print("srcFile : " + _srcFile.getPath());

var file = _srcFile.getFile() ;
_print("fileLength : " + file.length());

// Retrieves args 
var name = _getValue("NAME") ;
var tel = _getValue("TEL") ;
var size = parseInt(_getValue("SIZE")) ;
var age = _getValue("AGE") ;

_print("name : " + name);
_print("tel : " + tel);
_print("size : " + size);
_print("age : " + age);
if ( age == null ) _print("age is not defined");

_setValue("SIZE", size+1) ;

// _exit :  _OK = 0 ; _FAIL = 1 ; _NOP = 2 ; _KEEP = 3 ;
_exit=_OK ; 

