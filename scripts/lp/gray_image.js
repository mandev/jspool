/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

// $ed171209
importPackage(Packages.java.awt);
importPackage(Packages.java.io)  ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.im4java.core) ;
importPackage(Packages.org.im4java.process) ;
importPackage(Packages.org.im4java.utils) ;
importPackage(Packages.com.adlitteram.jspool.framework.image) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

OUTPUT_DIR = "C:/tmp/ed2" ;

// Resize Image with Image Magick
function convertImage(srcFile, dstFile)  {

    var images = java.lang.reflect.Array.newInstance(java.lang.String, 2);
    images[0] = srcFile.getPath() ;
    images[1] = dstFile.getPath() ;

    var op = new IMOperation();
    op.addImage();
    op.type("GrayScale"); // ^>
    op.addImage();

    var convert = new ConvertCmd();
    convert.setSearchPath("lib/windows/imagemagick");
    convert.run(op, images);
}

// Convert image to gray
function main() {
    
    var dstDir = new File(OUTPUT_DIR) ;
    var dstFile = new File(dstDir, FilenameUtils.removeExtension(_srcFile.getName()) + "_nb.jpg") ;

    // Convert image if not jpeg or larger than MAx_SIZE
    FileUtils.forceMkdir(dstDir);
    _print("Converting image to gray: " + _srcFile.getName());
    convertImage(_srcFile.getFile(), dstFile) ;
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
