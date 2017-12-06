/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots reserves : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.java.util) ;
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.lowagie.text) ; 
importPackage(Packages.com.lowagie.text.pdf) ; 
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

// PDF properties
GRAY= 0.85;
MMtoPT = 72 / 25.4 ;
BFONT = BaseFont.createFont("c:/windows/fonts/PoyAOC83.otf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);

// Output directory
OUTPUT_DIR = "C:/tmp/" ;
ERROR_DIR = "C:/tmp/"

// Create specific PDF cell
function createCellNoBorder(colspan, text) {
    var font = new com.lowagie.text.Font(BFONT, 8);
    cell = new PdfPCell(new Paragraph(12, new Chunk(text, font)));
    cell.setColspan(colspan) ;
    cell.disableBorderSide(PdfPCell.TOP);
    //cell.disableBorderSide(PdfPCell.BOTTOM);
    cell.disableBorderSide(PdfPCell.LEFT);
    cell.disableBorderSide(PdfPCell.RIGHT);
    cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
    cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
    return cell ;
}

// Create specific PDF cell
function createCellHeader(colspan, text) {
    var font = new com.lowagie.text.Font(BFONT, 8);
    cell = new PdfPCell(new Paragraph(12, new Chunk(text, font)));
    cell.setFixedHeight(40 * MMtoPT);
    cell.setColspan(colspan) ;
    cell.setPaddingBottom(10);
    cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
    cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
    cell.setRotation(90);
    return cell ;
}

// Create specific PDF cell
function createCellTotalDpt(colspan, text) {
    var font = new com.lowagie.text.Font(BFONT, 6.8);
    cell = new PdfPCell(new Paragraph(12, new Chunk(text, font)));
    cell.setColspan(colspan) ;
    cell.setPaddingRight(3);
    cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
    cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
    cell.setGrayFill(GRAY);
    cell.disableBorderSide(PdfPCell.BOTTOM);
    return cell ;
}

// Create specific PDF cell
function createCellTotalIns(colspan, text) {
    var font = new com.lowagie.text.Font(BFONT, 6.8);
    cell = new PdfPCell(new Paragraph(12, new Chunk(text, font)));
    cell.setColspan(colspan) ;
    cell.setPaddingLeft(.5);
    cell.setPaddingRight(.5);
    cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_LEFT);
    cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
    cell.setGrayFill(GRAY);
    cell.disableBorderSide(PdfPCell.BOTTOM);
    return cell ;
}

// Create specific PDF cell
function createCellTotalTop(colspan, text) {
    var font = new com.lowagie.text.Font(BFONT, 6.8);
    cell = new PdfPCell(new Paragraph(12, new Chunk(text, font)));
    cell.setColspan(colspan) ;
    cell.setPaddingLeft(2);
    cell.setPaddingRight(2);
    cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_LEFT);
    cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
    cell.setGrayFill(GRAY);
    cell.disableBorderSide(PdfPCell.BOTTOM);
    return cell ;
}

// Create specific PDF cell
function createCellTotalPer(colspan, text) {
    var font = new com.lowagie.text.Font(BFONT, 6.8);
    cell = new PdfPCell(new Paragraph(12, new Chunk(text, font)));
    cell.setColspan(colspan) ;
    cell.setPaddingRight(3);
    cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
    cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
    cell.setGrayFill(GRAY);
    cell.disableBorderSide(PdfPCell.TOP);
    return cell ;
}

// Create specific PDF cell
function createCellTotalBottom(colspan, text) {
    var font = new com.lowagie.text.Font(BFONT, 6.8);
    cell = new PdfPCell(new Paragraph(12, new Chunk(text, font)));
    cell.setColspan(colspan) ;
    cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
    cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
    cell.setGrayFill(GRAY);
    cell.disableBorderSide(PdfPCell.TOP);
    return cell ;
}

// Create specific PDF cell
function createCellCity(colspan, isGray, text) {
    var font = new com.lowagie.text.Font(BFONT, 6.8);
    cell = new PdfPCell(new Paragraph(9.7, new Chunk(text, font)));
    cell.setColspan(colspan) ;
    cell.setPaddingTop(1);
    cell.setPaddingBottom(2);
    cell.setPaddingRight(0.5);
    cell.setPaddingLeft(1);
    cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_LEFT);
    cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
    if ( isGray ) cell.setGrayFill(GRAY);
    cell.disableBorderSide(PdfPCell.TOP);
    cell.disableBorderSide(PdfPCell.BOTTOM);
    return cell ;
}

// Create specific PDF cell
function createCellResult(colspan, isGray, text) {
    var font = new com.lowagie.text.Font(BFONT, 6.8);
    cell = new PdfPCell(new Paragraph(9.7, new Chunk(text, font)));
    cell.setColspan(colspan) ;
    cell.setPaddingTop(1);
    cell.setPaddingBottom(2);
    cell.setPaddingRight(1);
    cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
    cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
    if ( isGray ) cell.setGrayFill(GRAY);
    cell.disableBorderSide(PdfPCell.TOP);
    cell.disableBorderSide(PdfPCell.BOTTOM);
    return cell ;
}

// Create specific PDF cell
function createCellCaption(colspan, text) {
    var font = new com.lowagie.text.Font(BFONT, 6.8);
    cell = new PdfPCell(new Paragraph(9.7, new Chunk(text, font)));
    cell.setColspan(colspan) ;
    cell.setPaddingTop(1);
    cell.setPaddingBottom(3);
    cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_LEFT);
    return cell ;
}

// Create specific PDF cell
function createBorder(colspan) {
    cell = new PdfPCell();
    cell.setColspan(colspan) ;
    cell.setFixedHeight(0);
    cell.disableBorderSide(PdfPCell.BOTTOM);
    cell.disableBorderSide(PdfPCell.LEFT);
    cell.disableBorderSide(PdfPCell.RIGHT);
    return cell ;
}

// Read the XML file and create the PDF
function createPDF(file) {

    _print("Creating builder");
    var builder = new Builder();
    var doc = builder.build(file);

    _print("Parsing document");
    var row = 0 ;
    var trNodes = doc.query("//table [@class='tab_results']//tr");
    var trNode = trNodes.get(row);
    var tdNodes = trNode.query("td");

    _print("Computing table");
    var candidats = tdNodes.size() - 4 ;
    var total = 5 + 5 + candidats*2 ;

    _print("Creating PDF");
    var pageSize = new com.lowagie.text.Rectangle(270*MMtoPT, 370*MMtoPT);
    var document = new com.lowagie.text.Document(pageSize);
    document.setMargins(5*MMtoPT, 5*MMtoPT, 5*MMtoPT, 5*MMtoPT);

    var basename = FilenameUtils.getBaseName(_srcFile.getName()) ;
    fos = new FileOutputStream(new File(OUTPUT_DIR, basename + ".pdf")) ;
    PdfWriter.getInstance(document, fos);
    document.open();

    var table = new PdfPTable(total);
    table.setWidthPercentage(100) ;

    // 1ere ligne (header)
    table.addCell(createCellNoBorder(5, trim(tdNodes.get(0).getValue()))) ;
    table.addCell(createCellHeader(1, trim(tdNodes.get(1).getValue())));
    table.addCell(createCellHeader(2, trim(tdNodes.get(2).getValue())));
    table.addCell(createCellHeader(2, trim(tdNodes.get(3).getValue())));
    for (var i=4; i < tdNodes.size(); i++) {
        table.addCell(createCellHeader(2, carriage(tdNodes.get(i).getValue())));
    }
    row++ ;

    // 2eme ligne (total top)
    trNode = trNodes.get(row);
    if ( trNode.getAttributeValue("class") == "tab_results_total" ) {
     
        tdNodes = trNode.query("td");
        table.addCell(createCellTotalDpt(5, trim(tdNodes.get(0).getValue())));
        table.addCell(createCellTotalIns(1, trim(tdNodes.get(1).getValue())));
        for (var i=2; i < tdNodes.size(); i++) {
            table.addCell(createCellTotalTop(2, trim(tdNodes.get(i).getValue())));
        }
        row++;

        // 3eme ligne (total bottom)
        tdNodes = trNodes.get(row).query("td");
        table.addCell(createCellTotalPer(5, trim(tdNodes.get(0).getValue())));
        table.addCell(createCellTotalBottom(1, trim(tdNodes.get(1).getValue())));
        for (var i=2; i < tdNodes.size(); i++) {
            table.addCell(createCellTotalBottom(2, trim(tdNodes.get(i).getValue())));
        }
        row++;
    }
    // 4eme ligne et plus (results)
    var isGray = false ;

    while ( row < trNodes.size()) {
        tdNodes = trNodes.get(row).query("td");

        table.addCell(createCellCity(5, isGray, trim(tdNodes.get(0).getValue())));
        for (var i=1; i < tdNodes.size(); i++) {
            table.addCell(createCellResult(1, isGray, trim2(tdNodes.get(i).getValue())));
        }
        isGray = !isGray ;
        row++ ;
    }

    // Légende
    tdNodes = doc.query("//table [@class='tab_legend']//tr/td");
    if ( tdNodes != null && tdNodes.size() > 0 ) {
        var legende = trim3(tdNodes.get(0).getValue()) ;
        table.addCell(legende.length == 0 ? createBorder(total) : createCellCaption(total, legende));
    }
    else {
        table.addCell(createBorder(total)) ;
    }

    document.add(table);
    document.close() ;
    IOUtils.closeQuietly(fos) ;

    _print("PDF created") ;
}

// Trim white spaces
function trim(str){
    str = str + "" ;
    return str.replace(/^\s+/g,'').replace(/\s+$/g,'')
}

// Trim and remove white spaces
function trim2(str){
    str = str + "" ;
    return str.replace(/^\s+/g,'').replace(/\s+$/g,'').replace(/ /g,'') ;
}

// Trim white spaces and remove white spaces only before %
function trim3(str){
    str = str + "" ;
    return str.replace(/^\s+/g,'').replace(/\s+$/g,'').replace(/ %/g,'%') ;
}

// Trim white spaces and add a carriage return before left parenthesis
function carriage(str){
    str = str + "" ;
    return str.replace(/^\s+/g,'').replace(/\s+$/g,'').replace(/\(/g,'\n(') ;
}

// Main
function main() {
    createPDF(_srcFile.getFile()) ;
    return _OK ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
    IOUtils.closeQuietly(fos) ;
//FileUtils.copyFile(_srcFile.getFile(), new File(ERROR_DIR, _srcFile.getName())) ;
}

