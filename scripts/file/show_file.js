/* 
 * Test
 */

// Retrieves  file
_print("srcDir : " + _srcDir);
_print("srcFile : " + _srcFile.getPath());

var file = _srcFile.getFile() ;
_print("fileLength : " + file.length());

// Retrieves args 
var out = _getValue("OUTPUT") ;
var count = _getValue("COUNT") ;

_print("output : " + out);

if ( count === null ) 
    _print("Count is not defined");
else 
    _print("count : " + count);

_setValue("COUNT", count+1) ;

// _exit :  _OK = 0 ; _FAIL = 1 ; _NOP = 2 ; _KEEP = 3 ;
_exit=_OK ;