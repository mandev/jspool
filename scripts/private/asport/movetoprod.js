/* 
* Emmanuel Deviller
* 
* inout.js
*/
// Attention aux mots r�serv�s : ex.  file.delete => file["delete"] )
importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ; 

// _localScript : the being executed script (LocalScript)
// _channel : the current channel (Channel)
// _print() : print string to log
// _exit : OK = 0 ; FAIL = 1 ; NOP = 2 

OUTPUT_DIR = "D:/AUJSPORT/PRODAUJSPORT/produits/" ;

function getToday() {

    var today = new Date() ;
    today.setTime(today.getTime() + 1000 * 60 * 60 * 24 ) // 24 heures

    var day = today.getDate() ;
    if ( day < 10 ) day = "0" + day ;

    var month = today.getMonth() + 1  ;
    if ( month < 10 ) month = "0" + month ;
    
    var year = today.getFullYear() + ""
    year = year.substr(2,2) ;

    //_print("date " +  day + " " + month + " " + year ) ;

    return day + "" + month + "" + year ;
}

// Main 
function main() {

    var dir = _srcFile.getFile().getParentFile().getName() ;
    var name = _srcFile.getName() + "" ; // Force Javascript String
    var index = name.indexOf("_", 0) ;
    
    var dstFile ;
    if ( dir.toUpperCase() == "SECOURS" ) {
      var dir2 = _srcFile.getFile().getParentFile().getParentFile().getName() ;
      if ( dir2.toUpperCase() == "PUBS" ) {
        dstFile = new File(OUTPUT_DIR + "AS" + name.substr(0, index) + "/secours/" + dir2, name) ;
      }
      else {
        dstFile = new File(OUTPUT_DIR + "AS" + getToday() + "/secours/" + dir2, name) ;
      }
    }
    else {
      if ( dir.toUpperCase() == "PUBS" ) {
        dstFile = new File(OUTPUT_DIR + "AS" + name.substr(0, index) + "/" + dir, name) ;
      }
      else if ( dir.toUpperCase() == "EXTERNES" ) {
        dstFile = new File(OUTPUT_DIR + "AS" + getToday() + "/" + dir, name) ;
      }
      else { 
        var page = name.toUpperCase().substr(0, index) ;
        if ( page.match(/^P\d$/) ) page = "P0" + page.charAt(1) ;
        else if ( ! page.match(/^P\d\d$/) ) page = "P00" ;
        dstFile = new File(OUTPUT_DIR + "AS" + getToday() + "/" + page, name) ;
      }
    }

    _print("copie " + name + " vers " + dstFile) ;
    FileUtils.copyFile(_srcFile.getFile(), dstFile) ;
    
    return _OK ;   // Don't do anything after this script
}

// Result _OK = 0 ; _FAIL = 1; _NOP = 2
_exit=main() ; 

