importPackage(Packages.java.io);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.pdftool.filters);
importPackage(Packages.com.adlitteram.pdftool.utils);

// Init
var srcFile = _srcFile.getFile();

var srcFile1 = new File("D:/tmp/ed3/11.0.3298548735_left.pdf");
var srcFile2 = new File("D:/tmp/ed3/11.0.3298548735_right.pdf");
var outputPath = "D:/tmp/ed3/final.pdf";

//var pdfInfo = PdfExtractor.getPdfInfo(srcFile);
//var pageCount = pdfInfo.getNumberOfPages();
//var splitDocFilter = new SplitDocument("C:/tmp/ed1/first_{TEMP}.pdf", "C:/tmp/ed1/pages_{TEMP}.pdf", "C:/tmp/ed1/last_{TEMP}.pdf", 1, pageCount - 1);
//var imposeFilter = new Impose(outputPath, 560 * NumUtils.MMtoPT, 380 * NumUtils.MMtoPT, Impose.SIMPLE, 0, 0, 280 * NumUtils.MMtoPT, 0);
//concatFilter.setDeleteSource(true);

var MM = NumUtils.MMtoPT;
var pdfTool = new PdfTool();
pdfTool.addFilter(new Concat(outputPath));
pdfTool.addFilter(new Impose(null, 560 * MM, 380 * MM, Impose.SIMPLE, 0, 0, 280 * MM, 0));
pdfTool.execute([srcFile1, srcFile2]);

_exit = _OK;
