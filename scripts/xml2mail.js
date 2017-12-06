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
importPackage(Packages.java.lang)  ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.apache.commons.mail) ;
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir) ;
//_print("srcFile : " + _srcFile.getPath()) ;

MAIL_SERVER="193.16.201.5" ;     // adresse du serveur smtp
MAIL_TO_USER="edeviller@leparisien.presse.fr" ;  // moi
MAIL_FROM_USER="edeviller@leparisien.presse.fr" ;  // moi

// Get the XML value depending on the xpath
function getXML(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    return nodes.get(0).toXML() ;
}

// Get the value value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    return nodes.get(0).getValue() ;
}

// Trim white spaces
function trim(str){
    if ( str != null ) {
        str += "" ;
        str = str.replace(/^\s+/g,'').replace(/\s+$/g,'')
    }
    return str ;
}

// Create and send the email message
function sendMail(toUser, sujet, corps) {
    var email = new HtmlEmail();
    email.setHostName(MAIL_SERVER);
    email.setFrom(MAIL_FROM_USER);
    email.setCharset("UTF-8") ;
    email.addTo(toUser);
    email.setSubject(sujet);
    email.setHtmlMsg(corps);

    email.send();
}

// Main
function main() {
    var file = _srcFile.getFile() ;

    _print("Creating builder") ;
    var builder = new Builder() ;
    var doc = builder.build(file) ;
    
    _print("Parsing document") ;
    var article = doc.query("//article") ;
    var titre = getXML(article.get(0), "//titraille") ;
    var texte = getXML(article.get(0), "//texte") ;
    var legende = getXML(article.get(0), "//photo-groupe/photo-legende") ;

    _print("Creating html message") ;
    var corps = "<html><body>" ;
    if ( titre != null ) corps += "<h2>" + titre  + "</h2>"  ;
    if ( texte != null ) corps += texte ;
    if ( legende != null ) corps += "<h3>" + legende + "</h3>"
    corps += "</body></html>" ;

    var nodes = doc.query("//Metadata/General") ;
    var sujet = "Contribution WEB" ;
    if ( nodes != null && nodes.size() > 0 ) {
        var node = nodes.get(0) ;
        var value = trim(getValue(node, "DocAuthor")) ;
        if ( value != null && value.length > 0 ) sujet += " - " + value ;
        value = trim(getValue(node, "Category")) ;
        if ( value != null && value.length > 0 ) sujet += " - " + value ;
        value = trim(getValue(node, "DocTitle")) ;
        if ( value != null && value.length > 0 ) sujet += " - " + value ;
    }

    // Envoi du mail
    _print("Sending message") ;
    sendMail(MAIL_TO_USER, sujet, corps) ;

    return _OK ;
//return _KEEP ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
}

