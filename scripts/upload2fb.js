/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

importPackage(Packages.java.io);
importPackage(Packages.java.util);
importPackage(Packages.java.lang);
importPackage(Packages.java.nio.charset);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.http);
importPackage(Packages.org.apache.http.client);
importPackage(Packages.org.apache.http.client.entity);
importPackage(Packages.org.apache.http.client.methods);
importPackage(Packages.org.apache.http.client.params);
importPackage(Packages.org.apache.http.client.protocol);
importPackage(Packages.org.apache.http.client.utils);
importPackage(Packages.org.apache.http.impl.client);
importPackage(Packages.org.apache.http.message);
importPackage(Packages.org.apache.http.params);
importPackage(Packages.org.apache.http.entity.mime);
importPackage(Packages.org.apache.http.entity.mime.content);
importPackage(Packages.org.apache.http.util);
importPackage(Packages.org.codehaus.jackson.map);
importPackage(Packages.nu.xom);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.com.adlitteram.pdftool);
importPackage(Packages.com.adlitteram.pdftool.filters);
importPackage(Packages.com.adlitteram.pdftool.utils);
importPackage(Packages.com.adlitteram.jspool) ;

var MAX_WIDTH = 1024 ;
var MAX_HEIGHT = 1024 ;

var TMP_DIR = "E:/tmp/pdf" ;
//var NICE_EXE = "/usr/bin/nice" ;
//var GS_EXE = "/usr/local/bin/gs" ;
//var CONVERT_EXE = "/usr/bin/convert" ;

var GS_EXE = "C:/Program Files/gs/gs9.04/bin/gswin64c.exe" ;
var CONVERT_EXE = "ext/windows/imagemagick/convert.exe" ;
 
var pageNumber ;
var pageWidth ;
var pageHeight ;
var coverWidth;
var coverHeight;
var cover ;
var pageRes ;
var accessToken ;
var albumName ;
var albumMessage ;
var albumMark ;
var pdfFile ;
var pdfDir ;
var albumId ;

// Extract info from the spooled XML file
function processXml() {
    _print("processXml:");
    
    var doc = new Builder().build(_srcFile.getFile());
    accessToken = getValue(doc, "/album/accessToken") + "" ;
    albumName = getValue(doc, "/album/name") + "" ;
    albumMessage = getValue(doc, "/album/message") + "" ;
    albumMark = getValue(doc, "/album/watermark") + "" ;
    
    var albumPdf = getValue(doc, "/album/pdf") + "" ;

    pdfFile = File.createTempFile("book_", ".pdf") ;
    pdfFile.deleteOnExit() ;
    FileUtils.copyFile(new File(albumPdf), pdfFile) ;

    pdfDir = new File(TMP_DIR, _srcFile.getName()) ;    
    FileUtils.forceMkdir(pdfDir)
}

// Compute resolution from size
function initPageResolution(page) {
    var pageDim = PdfExtractor.getPageSize(pdfFile, page) ;
    pageRes = Math.min(MAX_WIDTH/pageDim.getWidth(), MAX_HEIGHT/pageDim.getHeight()) ;
    pageWidth = pageDim.getWidth() * pageRes ;
    pageHeight = pageDim.getHeight() * pageRes ;
}

function initResolution() {
    _print("initResolution:") ;    

    var pdfInfo = PdfExtractor.getPdfInfo(pdfFile) ;   
    cover = pdfInfo.getMetadata("eDoc.Cover") ;
    pageNumber = pdfInfo.getNumberOfPages() ;

    if ( cover == "true" ) {
        initPageResolution(2) ;
        var coverDim = PdfExtractor.getPageSize(pdfFile, 1) ;
        coverWidth = coverDim.getWidth() * pageRes ;
        coverHeight = coverDim.getHeight() * pageRes ;
    }
    else {
        initPageResolution(1) ;
    }
}

// Manipulate Cover
function convertJpeg() {
    _print("convertJpeg:") ;    
    
    if ( cover == "true" )  {
        pageNumber = pageNumber + 1 ;
        var pw = Math.round(pageWidth) ;
        var xOffset = Math.round(pageWidth + coverWidth  - (2 * pageWidth))  ; 
        var yOffset = Math.round((coverHeight  -  pageHeight) / 2) ; 

        var opt = [ "page_1.jpg", "-crop", pw + "x0+0+" + yOffset, "page_" + pageNumber + ".jpg",] ;
        _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + pdfDir) ;
        _exec(CONVERT_EXE, opt, pdfDir.getPath(), 60000) ; // 1 minute time-out
        
        opt = [ "page_1.jpg", "-crop", pw + "x0+" + xOffset + "+" + yOffset, "page_1.jpg"] ;
        _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + pdfDir) ;
        _exec(CONVERT_EXE, opt, pdfDir.getPath(), 60000) ; // 1 minute time-out
    }

    if ( albumMark != null && albumMark.length > 0 ) {
        for (var i=1; i<=pageNumber; i++) {
            var opt = [ "page_" + i + ".jpg", "-background", "Gainsboro", 
            "label:" + albumMark,
            "-gravity", "Center", "-append", "page_" + i + ".jpg"] ;

            _print("Launching " + CONVERT_EXE + " " + opt + " dir: " + pdfDir) ;
            _exec(CONVERT_EXE, opt, pdfDir.getPath(), 60000) ; // 1 minute time-out
        }
    }
}

// Remove the margin from the PDF
function filterPdf() {
    _print("filterPdf:") ;    
    
    var margin = 3*72/25.4 ; // 3mm
    var pdfTool = new PdfTool() ;
    pdfTool.addFilter(new CropMargin(null, margin, margin, margin, margin)) ;
    pdfTool.execute(pdfFile) ;
}

// Rip the PDF with Ghostscript
function execGhostscript() {
    _print("execGS:") ;    
    
    // var exe = "nice -n 19 /opt/ghostscript/bin/gs " ;
    var opt = [ "-q", "-dNOPROMPT", "-dBATCH", "-dNOPAUSE", "-sDEVICE=jpeg",  
    "-dJPEGQ=90", "-dUseCIEColor", "-dDOINTERPOLATE", "-r" + (pageRes * 72),
    "-dGraphicsAlphaBits=4", "-o", "page_%000d.jpg", pdfFile.getPath() ] ;

    _print("Launching " + GS_EXE + " " + opt + " dir: " + pdfDir) ;
    var status = _exec(GS_EXE, opt, pdfDir.getPath(), 30 * 60000) ; // 30 minutes time out
    
    if ( status != 0  ) {
        _print("execGS error!") ;
    }
}

// Create a new album
function createAlbum() {
    _print("createAlbum:");
    
    var url = "https://graph.facebook.com/me/albums?access_token=" + accessToken;

    var list = new ArrayList();
    list.add(new BasicNameValuePair("name", albumName));
    list.add(new BasicNameValuePair("message", albumMessage));

    var reqEntity = new UrlEncodedFormEntity(list, "UTF-8");
    reqEntity.setContentType("application/x-www-form-urlencoded");

    var httppost = new HttpPost(url);
    httppost.setEntity(reqEntity);
    
    var httpclient = new DefaultHttpClient();
    var id = null ;
    
    try {
        var response = httpclient.execute(httppost);
        var resEntity = response.getEntity();
        if (resEntity != null) {
            var str = EntityUtils.toString(resEntity, "UTF-8") ;
            _print("result: " + str);
            var result = new ObjectMapper().readValue(str, Class.forName("java.util.Map"));
            id = result.get("id") ;
        }
    }
    finally {
        EntityUtils.consume(resEntity);
        httpclient.getConnectionManager().shutdown();
    }
    
    albumId = id ;
}

// Upload all pages to the album
function uploadAlbum() {
    _print("uploadAlbum:");
    
    if ( albumId != null ) {
        var j = 1 ;
        for (var i=1; i<=pageNumber; i++) {
            if ( i == 2 && cover == "true" ) continue ; 
            var file = new File(pdfDir, "page_" + i + ".jpg" ) ;
            uploadPhoto(file, "page " + j ) ;
            j++ ;
        }
    }
}

function uploadPhoto(file, message) {
    _print("uploadPhoto: " + file);
    
    var url = "https://graph.facebook.com/" + albumId + "/photos?access_token=" + accessToken;

    var reqEntity = new MultipartEntity(HttpMultipartMode.BROWSER_COMPATIBLE);
    reqEntity.addPart("source", new FileBody(file, "image/jpeg"));
    reqEntity.addPart("message", new StringBody(message + " - "  + albumMessage, "text/plain", Charset.forName("UTF-8")));

    var httppost = new HttpPost(url);
    httppost.setEntity(reqEntity);

    var httpclient = new DefaultHttpClient();
    httpclient.getParams().setParameter(CoreProtocolPNames.PROTOCOL_VERSION, HttpVersion.HTTP_1_1);
    
    try {
        var response = httpclient.execute(httppost);
        var resEntity = response.getEntity();
        if (resEntity != null) {
            var str = EntityUtils.toString(resEntity, "UTF-8") ;
            _print("result: " + str);   
        }
    }
    finally {
        httpclient.getConnectionManager().shutdown();
    }
        
}

// Delete temporary files
function clean() {
    _print("Clean:");
    FileUtils.deleteQuietly(pdfFile) ;
    FileUtils.deleteQuietly(pdfDir) ;
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    if ( nodes.size() > 1 ) _print("xpath: " + xpath + " - multiple values: " + nodes.get(0).getValue())
    return nodes.get(0).getValue() ;
}

// Main
function main() {
    processXml() ;
    filterPdf() ;
    initResolution() ;
    execGhostscript() ;
    convertJpeg() ;
    createAlbum() ;
    uploadAlbum() ;   
    clean() ;
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
