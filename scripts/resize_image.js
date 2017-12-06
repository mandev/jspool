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
importPackage(Packages.com.adlitteram.jspool) ;

OUTPUT_DIR = _getValue("OUTPUT_DIR") ;
ERROR_DIR = _getValue("ERROR_DIR")  ;

var MAX_SIZE = 3000;  // Pixels
var REL_SIZE = 3000;
var CONVERT_EXE = "ext/windows/imagemagick/convert.exe";

function convertImage2(srcFile, dstFile) {

    // shapeX="655.61" shapeY="243.46" shapeWidth="70.06" shapeHeight="95"
    var shape =  {
        x1: 655.61,
        y1: 243.46,
        x2: 655.61 + 70.06,
        y2: 243.46 + 95
    };

    // contentTm="translate(85.7868 138.9196) rotate(-90) scale(0.3089856 -0.3089856)"
    var affine = {
        tx: 85.7868,
        ty: 138.9196,
        sx: 0.3089856,
        sy: -0.3089856,
        ro: -90
    }    
    
    var imageInfo = ScriptUtils.getImageInfo(srcFile);
    var res = 360 / 72;
    var w = Math.round((shape.x2 - shape.x1) / Math.abs(affine.sx) * res);
    var h = Math.round((shape.y2 - shape.y1) / Math.abs(affine.sy) * res);

    if ( imageInfo == null || affine.ro == "0" && affine.sx > 0 && affine.sy > 0) {
        var x = sign(Math.round(-affine.tx / affine.sx * res));
        var y = sign(Math.round(-affine.ty / affine.sy * res));
        var opt = [srcFile.getPath(), "-crop", w + "x" + h + x + y, "+repage",
            "-resize", REL_SIZE + "x" + REL_SIZE + ">", dstFile.getPath()];
    }
    else {
        _print("Withe rotation");
        var af = AffineTransform.getScaleInstance(affine.sx, affine.sy);
        af.rotate(toRad(affine.ro));
        var rec = new Rectangle2D.Double(0, 0, imageInfo.getWidth(), imageInfo.getHeight());
        var bbox = af.createTransformedShape(rec).getBounds2D();

        var x = sign(Math.round((-affine.tx * res - bbox.getX()) / Math.abs(affine.sx)));
        var y = sign(Math.round((-affine.ty * res - bbox.getY()) / Math.abs(affine.sy)));
        var flop = (affine.sx < 0) ? "-flop" : "";
        var flip = (affine.sy < 0) ? "-flip" : "";
        var opt = [srcFile.getPath(), flip, flop, "-rotate", affine.ro,
            "-crop", w + "x" + h + x + y, "+repage",
            "-resize", REL_SIZE + "x" + REL_SIZE + ">", dstFile.getPath()];
    }

    _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent());
    _exec(CONVERT_EXE, opt, dstFile.getParent(), 300000); // creates also parent directory

}
// Resize and convert to jpeg if necessary
function main() {
    
    var dstFile = new File("D:/tmp/toto.jpg") ;
    convertImage2(_srcFile.getFile(), dstFile) ;

    return _OK ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, _srcFile.getName())) ;
    _exit = _OK;
}
