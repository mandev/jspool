/* test.js
 * Emmanuel Deviller
 *
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile)
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io);
importPackage(Packages.java.lang);
importPackage(Packages.org.apache.commons.io);
importPackage(Packages.org.apache.commons.mail);
importPackage(Packages.nu.xom);

// Debug
//_print("srcDir : " + _srcDir) ;
//_print("srcFile : " + _srcFile.getPath()) ;

MAIL_SERVER = "10.196.50.5";     // adresse du serveur smtp
MAIL_TO_USER=["dvidalrevel@leparisien.fr", "fvezard@leparisien.fr", "jmmontali@leparisien.fr", "salbouy@leparisien.fr"] ;
MAIL_FROM_USER = "afp@leparisien.fr";

// Get the XML value depending on the xpath
function getXML(node, xpath) {
    var nodes = node.query(xpath);
    if (nodes == null || nodes.size() == 0)
        return "";
    return nodes.get(0).toXML();
}


// Get the value value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath);
    if (nodes == null || nodes.size() == 0)
        return "";
    return nodes.get(0).getValue();
}

// Create and send the email message
function sendMail(toUser, sujet, corps) {
    var email = new HtmlEmail();
    email.setHostName(MAIL_SERVER);
    email.setFrom(MAIL_FROM_USER);
    email.setCharset("UTF-8");
    for (var i in toUser) email.addTo(toUser[i]);
    email.setSubject(sujet);
    email.setHtmlMsg(corps);
    email.send();
}

// Main
function main() {
    var file = _srcFile.getFile();

    _print("Parsing document");
    var builder = new Builder();
    var doc = builder.build(file);

    var urgency = doc.query("//Urgency").get(0);
    if (urgency != null) {
        var formalName = urgency.getAttributeValue("FormalName") + "";
        if (formalName == "0" || formalName == "1" || formalName == "2") {

            var title = "ALERTE AFP";
            var dateline = getValue(doc, "//DateLine") + "";
            var subject = getValue(doc, "//body.content/*") + "" ;
            var content = getXML(doc, "//body.content/*") + "";

            _print("Creating html message");
            var corps = "<html><body>";

            if (subject != null)
                title += " - " + subject.substr(0, Math.min(subject.length, 40)) + "...";

            if (dateline != null)
                corps += "<h3>" + dateline + "</h3>";

            if (content != null)
                corps += "<p>" + content + "</p>";

            corps += "</body></html>";
           
            // Envoi du mail
            _print("Sending message");
            _print(title + " - " + corps);

            sendMail(MAIL_TO_USER, title, corps);
        }
    }

    return _OK;
//return _KEEP ;
}

// start & exit
try {
    _exit = main();
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
    _exit = _FAIL;
}

