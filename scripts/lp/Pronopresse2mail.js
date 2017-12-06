/* test.js
 * Emmanuel Deviller
 *
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile)
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
 *
 * Attention aux mots reserves : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.java.util)  ;
importPackage(Packages.java.util.concurrent)  ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.apache.commons.lang) ;
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.java.awt) ;
importPackage(Packages.java.lang) ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.org.apache.commons.mail) ;



// TODO:
// traiter le cas d'une photo non rattachée à un article mais à une page						
// traiter les crédits multiples
// cropper les previews des PDF
// cropper les images des galleries
// Merger les story items des pages double

// ok - threader les traitements
// ok - traiter le cas d'une seconde balise <texte> dans une story (que faire?) 
// ok - filter les dummy texte (par ex. <?EM-dummyText [relance]?> )
// ok - filtrer <span id="U1102386625440z9C" style="font-family:'EuropeanPi-Three';color:#bebebe;">L</span>
// ok - Photos anamorphosées
// ok - Pages doubles

// BUGS PH
// ok - Supprimer le traitement photos
// ok - Boites avec coordonnées négatives sont à 0,0 (a tester)
// ko - Ne pas separer la page double (impossible)

// TEMP_DIR = "D:/METHODE/archive/silo_tmp/" ;
// OUTPUT_DIR = "D:/METHODE/archive/silo/" ;
// ERROR_DIR = "D:/METHODE/archive/silo_error/" ;
// SAV_DIR = "D:/METHODE/archive/silo_sav/" ;
//TEMP_DIR = "D:/METHODE/archive/pige_tmp/" ;
INPUT_DIR = "D:/LP/ArrExt/turfxmlpresseout/" ;

MAIL_SERVER = "10.196.50.5" ;     // adresse du serveur smtp
MAIL_TO_USER = _getValue("MAIL_TO_USER") ;
MAIL_FROM_USER="dsi@leparisien.presse.fr" ;

var ZIP_DIR ;
var DATE_PATH ;
var DATE_DIR ;
var DATE_NAME ;
var PLAN_FILENAME ;
var PLAN_UUID ;
var STDDATE ;   // 25062011
var INVDATE ;   // 20110625
var EXECUTOR ;

//var SEP_ARRAY = java.lang.reflect.Array.newInstance(java.lang.String, 2);
var SEP_ARRAY = [' ', '-','.'] ;
var TRANS_RE = new RegExp(".*translate\\((.*?)\\)", "") ;
var SCALE_RE = new RegExp(".*scale\\((.*?)\\)", "") ;    
var ROTATE_RE = new RegExp(".*rotate\\((.*?)\\)", "") ;    
var PAGE_ARRAY = ["left", "right"] ;
var XOM = ScriptUtils.createXomBuilder(false, false) ;
var IMGSET = {} ;
var PDFSET = {} ;

var imagesProps = new Array();
var storiesProps = new Array();

function filterfichier(file) {
    //var fichiercontent = FileUtils.readFileToString(file, "UTF-8");
    var fichiercontent = FileUtils.readFileToString(file);
    fichiercontent = fichiercontent.replaceAll("Dauphiné Libéré", "Dauphiné libéré");
	fichiercontent = fichiercontent.replaceAll("Week-End", "Week-end");
	fichiercontent = fichiercontent.replaceAll("Tropiques F.M.", "Tropiques FM");
	fichiercontent = fichiercontent.replaceAll("Paris-Courses", "Paris Courses");
    return fichiercontent;
}


function writeFichier(document, file) {
    var os = new BufferedOutputStream(new FileOutputStream(file)) ;
//    var serializer = new Serializer(os, "UTF-8");
//    var buffer = new StringBuffer();
    var dstFile = new File(file) ;
// _print("write to file: " lename);
    var bw = new BufferedWriter(new FileWriter(dstFile));
    //bw.write(buffer.toString());
    bw.write(document);
    bw.close() ; 


    
//    serializer.setIndent(4);
//    serializer.setMaxLength(64);
//    serializer.write(document);
//    os.close() ;
}

function createXML() {

    var root = new Element("doc") ;
    var doc = new Document(root);
    return doc ;
}

// Create and send the email message
function sendEmail(file) {
    _print("Sending email");
    //var file1 = new File(INPUT_DIR, _srcFile.getName())
    var file1 = new File(file);
    var sujet = "Fichier pronostics du jour ";

    var email = new HtmlEmail();
    email.setHostName(MAIL_SERVER);
    email.setFrom(MAIL_FROM_USER);
    email.setCharset("UTF-8") ;
    var toUser = MAIL_TO_USER.split(";")
    for (var i in toUser) {
        email.addTo(toUser[i]);
    }
    email.setSubject(sujet);
	//_print("file: " + file);
    // for (var i in file) {

    	//_print("i = :" + i ) ;
    	   var attachment = new EmailAttachment();
        attachment.setPath(file1);
        attachment.setDisposition(EmailAttachment.ATTACHMENT);
        //attachment.setName("Test");
        attachment.setName(file1.getName());
        email.attach(attachment);
    //}
    
    
    email.send();
}

function sleeps(milliSeconds){
        var startTime = new Date().getTime();
        while (new Date().getTime() < startTime + milliSeconds);
}

function copyToError() {
    var srcFile = _srcFile.getFile() ;
    var errFile = new File(ERROR_DIR, _srcFile.getName()) ;
    if ( srcFile.exists() ) FileUtils.copyFile(srcFile, errFile) ;
}

function processFichier(physPage) {
    _print("Process fichier : " + physPage.path );

    // Lit le fichier de page
    physPage = filterfichier(new File(physPage.path));

    return physPage ;
 }

// Main
function main() {
    _print("Starting Process");
    var dir = new File(INPUT_DIR);
    EXECUTOR = ScriptUtils.createFifoExecutor() ;
        //var document = createXML() ;
	   var file = _srcFile.getFile() ;
    	   var str1 = processFichier(file) ;
    	   var file1 = new File(INPUT_DIR, _srcFile.getName())
        _print("Writing fichier " + INPUT_DIR + _srcFile.getName());
    	   writeFichier(str1, file1) ;
        sendEmail(file1);
        	       _print("Waiting for executor to complete");
        EXECUTOR.shutdown() ;    
        var status = EXECUTOR.awaitTermination(60, TimeUnit.MINUTES);
		
            if ( status ) {
            sleeps(20000);
        	  FileUtils.cleanDirectory(dir);
            _print("Process Done");
        	  return _OK ;
        }   
        else {
            _print("Executor time-out. Process Aborted");
            copyToError() ;
            return _OK ;
        }
     
    }

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
}