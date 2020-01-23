/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io);
importPackage(Packages.java.util);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.lang);
importPackage(Packages.org.apache.commons.mail);
importPackage(Packages.com.adlitteram.jspool);
importPackage(Packages.nu.xom);

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

OUTPUT_DIRS = ["D:/METHODE/PROD/pairing/config"];
ERROR_DIR = ["D:/METHODE/PROD/pairing/error"];

MAIL_SERVER = "10.196.50.5";     // adresse du serveur smtp
MAIL_TO_USER = ["LPA_DSI_Encadr@leparisien.fr"];
MAIL_FROM_USER = "create_plates_map.js@leparisien.fr";

function writeElement(document, dstFile) {
    _print("writeElement: " + dstFile);
    if (dstFile.exists())
        FileUtils.forceDelete(dstFile);
    if (!dstFile.getParentFile().exists())
        FileUtils.forceMkdir(dstFile.getParentFile());
    var os = new BufferedOutputStream(new FileOutputStream(dstFile));
    var serializer = new Serializer(os, "UTF-8");
    serializer.setIndent(3);
    serializer.write(document);
    os.close();
}

// Create and send the email message
function sendMail(toUser, sujet, corps) {
    var email = new HtmlEmail();
    email.setHostName(MAIL_SERVER);
    email.setFrom(MAIL_FROM_USER);
    email.setCharset("UTF-8");
    for (var i in toUser)
        email.addTo(toUser[i]);
    email.setSubject(sujet);
    email.setHtmlMsg(corps);
    email.send();
}

function processXml() {
    _print("processXml: " + _srcFile.getName());

    var XOM = ScriptUtils.createXomBuilder(false, false);
    var doc = XOM.build(_srcFile.getFile());
    var parNode = doc.getRootElement();
    var platesElement = new Element("plates");
    platesElement.addAttribute(new Attribute("publicationDate", parNode.getAttributeValue("publicationDate")));

    var plateMap = {};

    var plateNodes = doc.query("/parution/product/book/plates/plate");
    for (var i = 0; i < plateNodes.size(); i++) {
        var plateNode = plateNodes.get(i);
        var plate = plateNode.getAttributeValue("filename");
        var pageL = plateNode.getAttributeValue("pageL");
        var pageR = plateNode.getAttributeValue("pageR");

        if (!plateMap.hasOwnProperty(plate)) {
            plateMap[plate] = {plate: plate, pageL: pageL, pageR: pageR};
            var plateElement = new Element("plate");
            plateElement.addAttribute(new Attribute("name", plate));
            plateElement.addAttribute(new Attribute("pageL", pageL));
            plateElement.addAttribute(new Attribute("pageR", pageR));
            platesElement.appendChild(plateElement);
        }
        else if (plateMap[plate].pageL != pageL || plateMap[plate].pageR != pageR) {
            var title = "!!!! ERREUR APPAIRAGE !!!! Le fichier " + _srcFile.getName() + " n'est pas valide";
            var corps1 = "car il contient deux définitions différentes d'une même plaque:";
            var corps2 = "=> plaque: " + plate + " - pageL: " + plateMap[plate].pageL + " - plaqueR: " + plateMap[plate].pageR;
            var corps3 = "=> plaque: " + plate + " - pageL: " + pageL + " - plaqueR: " + pageR;

            _print(title);
            _print(corps1);
            _print(corps2);
            _print(corps3);
            sendMail(MAIL_TO_USER, title, "<p>" + corps1 + "</p>" + "<p>" + corps2 + "</p>" + "<p>" + corps3 + "</p>");
            return;
        }
    }

    var filename = FilenameUtils.removeExtension(_srcFile.getName()) + ".pair";
    var document = new Document(platesElement);
    for (var i in OUTPUT_DIRS) {
        var dstFile = new File(OUTPUT_DIRS[i], filename);
        writeElement(document, dstFile);
    }
}

function main() {
    processXml();
    return _OK;
}

// start & exit
try {
    _exit = main();
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}

