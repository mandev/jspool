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

var AF = ["85.7868", "138.9196", "-90", "0.3089856", "-0.3089856"];
var SH = ["0", "0", "70.06", "95"];

REL_SIZE = 3000;
CONVERT_EXE = "ext/windows/imagemagick/convert.exe";

function convertImage(srcFile, dstFile, shape, affine) {
    if (dstFile.exists())
        FileUtils.forceDelete(dstFile);

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
