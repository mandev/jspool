/* 
 * This input script create a Local Dir spool on the fly.
 * The target of this local spool is specified from the current channel.
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.com.AdLitteram.jSpool.Files) ; 
importPackage(Packages.com.AdLitteram.jSpool.Sources) ; 

SRC_DIR="C:/tmp/ed0/" ;

// Is Tomorrow
function isTomorrow(name) {
    var da = new Date() ;
    da.setFullYear("20" + name.substr(6,2), name.substr(3,2)-1, name.substr(0,2)) ;
    da.setHours(6,0,0,0) ;
    
    var today = new Date() ;
    if ( today < da ) {
        da.setDate(da.getDate()-1) ;
        return ( today > da ) ;
    }
    return false ;
}

// Return the requested dir
function getDir() {
    var src = new File(SRC_DIR) ;
    if (src.isDirectory()) {
        var listDir = src.listFiles();
        for (var i=0; i<listDir.length; i++) {
            var srcDir1 = listDir[i] ; 
            if ( isTomorrow(srcDir1.getName()) ) {
                return srcDir1.getPath() ;
            }
        }
    }
    return "" ;
}

// Init and wrap the Local Spool
function initLocalSpool() {
    localDir = _localScript.getProperty("_localDir") ;
    if ( localDir == null ) {
        localDir = new LocalDir() ;
        localDir.init(_channel) ;
        _localScript.setProperty("_localDir", localDir) ;
    }
    return localDir ;
}

// Main 
function main() {
    var localDir = initLocalSpool() ;    
    var srcDir = getDir() ;
    
    if (srcDir != "") {
        var dir = new File(srcDir) ;    
        if ( dir.exists() && dir.isDirectory()) {        
            var srcFile = new LocalFile(dir, 3, false, 0);        
            _print("LocalDir " + _localScript.getChannel().getTrgHandler()) ;
            localDir.doRun(srcDir, srcFile, _channel.getTrgHandler()) ;
        }
    }
    else {
        _print("Tomorrow dir not found.") ;    
    }
    
    return _NOP ;   // Don't do anything after this script
}

// Result _OK = 0 ; _FAIL = 1; _NOP = 2
_exit=main() ; 

