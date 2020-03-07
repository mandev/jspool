importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ; 

// This this not the best way to init a String array!
OUTPUT_DIRS = new Array()
OUTPUT_DIRS[0] = "C:/tmp/ed5" ;
OUTPUT_DIRS[1] = "C:/tmp/ed6" ;

// Copy the srcfile to outputdir and append the src directory name to the destination filename
function main() {
     for (i in OUTPUT_DIRS) {
        // Construct the destination file (don't use with ftp source)
        var prefix = _srcFile.getFile().getParentFile().getName() ;
        var destFile = new File(OUTPUT_DIRS[i], prefix + "_" + _srcFile.getName()) ;

        _print("copy file: " + _srcFile.getName() + " to " + destFile) ;
        FileUtils.copyFile(_srcFile.getFile(), destFile) ;
      }

     return _OK ;
}

// start & exit 
_exit = main() ; 

