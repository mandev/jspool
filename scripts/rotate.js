/* 
 * Emmanuel Deviller
 * 
 * test.js
 */

importPackage(Packages.java.io);
importPackage(Packages.java.lang);
importPackage(Packages.java.util);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.lang);
importPackage(Packages.nu.xom);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.imageinfo);
importPackage(Packages.java.awt);
importPackage(Packages.java.awt.geom);

// _srcDir : the spooled directory (String)
// _srcFile : the file found (SourceFile) 
// Attention aux mots réservés : ex.  file.delete => file["delete"] )

//var AF= [ "-75.8492", "-5.524004", "-3", "1.084442", "1.084442"] ;
//var SH= [ "0", "0", "436.53", "268.8"] ;

// translate(-0.553373 296.2662) rotate(-90) scale(1.018411 1.018411)
//var AF= [ "-0.553373", "296.2662", "-90", "1.018411", "1.018411"] ;
//var SH= [ "0", "0", "234.56", "297.6"] ;

// translate(141.1693 -28.15151) rotate(90) scale(0.6163223 0.6163223
//<shape shapeX="150.24" shapeY="739.2" shapeWidth="136.06" shapeHeight="134.4" 
//var AF= [ "141.1693", "-28.15151", "90", "0.6163223", "0.6163223"] ;
//var SH= [ "0", "0", "136.06", "134.4"] ;

//contentTm="translate(138.8604 -0.748981) rotate(180) scale(0.2212079 -0.2212079)">
//<shape shapeX="0.0" shapeY="334.3" shapeWidth="68.24" shapeHeight="127.95" 
//var AF= [ "138.8604", "-0.748981", "180", "0.2212079", "-0.2212079"] ;
//var SH= [ "0", "0", "68.24", "127.95"] ;

// contentTm="translate(85.7868 138.9196) rotate(-90) scale(0.3089856 -0.3089856)"
// shapeX="655.61" shapeY="243.46" shapeWidth="70.06" shapeHeight="95"
var AF = ["85.7868", "138.9196", "-90", "0.3089856", "-0.3089856"];
var SH = ["0", "0", "70.06", "95"];

REL_SIZE = 3000;
CONVERT_EXE = "ext/windows/imagemagick/convert.exe";

function convertImage(srcFile, dstFile, shape, affine) {
    //return ;

    if (dstFile.exists())
        FileUtils.forceDelete(dstFile);

    //var d = ScriptUtils.getImageDimension(srcFile) ;
    var imageInfo = ScriptUtils.getImageInfo(srcFile);

    var res = 360 / 72;
    var w = Math.round((shape.x2 - shape.x1) / Math.abs(affine.sx) * res);
    var h = Math.round((shape.y2 - shape.y1) / Math.abs(affine.sy) * res);

    if (affine.ro == "0" && affine.sx > 0 && affine.sy > 0) {
        var x = sign(Math.round(-affine.tx / affine.sx * res));
        var y = sign(Math.round(-affine.ty / affine.sy * res));
        var opt = [srcFile.getPath(), "-crop", w + "x" + h + x + y, "+repage",
            "-resize", REL_SIZE + "x" + REL_SIZE + ">", dstFile.getPath()];
    } else {
//        var af = AffineTransform.getScaleInstance(-affine.sx, -affine.sy);
//        af.rotate(toRad(affine.ro)) ;
        var af = AffineTransform.getRotateInstance(toRad(affine.ro));
        af.scale(affine.sx, affine.sy);
        var rec = new Rectangle2D.Double(0, 0, imageInfo.getWidth(), imageInfo.getHeight());
        var bbox = af.createTransformedShape(rec).getBounds2D();

        _print("w: " + imageInfo.getWidth() + " h:" + imageInfo.getHeight());
        var x = sign(Math.round((-affine.tx * res - bbox.getX()) / Math.abs(affine.sx)));
        var y = sign(Math.round((-affine.ty * res - bbox.getY()) / Math.abs(affine.sy)));
        _print("x: " + x + " y:" + y);

        var flop = (affine.sx < 0) ? "-flop" : "";
        var flip = (affine.sy < 0) ? "-flip" : "";
        var opt = [srcFile.getPath(), flip, flop, "-rotate", affine.ro,
            "-crop", w + "x" + h + "" + x + "" + y, "+repage",
            "-resize", REL_SIZE + "x" + REL_SIZE + ">",
            dstFile.getPath()];
    }

    _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + dstFile.getParent());
    _exec(CONVERT_EXE, opt, dstFile.getParent(), 30000); // creates also parent directory
}

function sign(n) {
    return (n >= 0) ? "+" + n : n;
}

function createAffine() {
    return {
        tx: AF[0],
        ty: AF[1],
        ro: AF[2],
        sx: AF[3],
        sy: AF[4]
    }
}

// Create a shape
function createShape() {
    return {
        x1: SH[0],
        y1: SH[1],
        x2: SH[2],
        y2: SH[3]
    }
}

function toRad(deg) {
    return deg * Math.PI / 180;
}

function main() {
    var srcFile = _srcFile.getFile();
    var dstFile = new File("C:/tmp", srcFile.getName());
    var shape = createShape();
    var affine = createAffine();
    convertImage(srcFile, dstFile, shape, affine);
    return _KEEP;
}

try {
    _exit = main();
} catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}
